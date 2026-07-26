import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getServiceSupabase } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/require";
import { rowToOrder } from "@/lib/orders/map";
import { filterOrdersForReport, ReportPreset } from "@/lib/orders/report-filters";
import { OrdersReportDoc } from "@/lib/pdf/orders-report-doc";

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { preset, ids } = (await req.json()) as { preset: ReportPreset; ids?: string[] };

  const supabase = getServiceSupabase();
  const { data, error } = await supabase.from("orders").select("*").eq("cancelled", false);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const orders = (data ?? []).map(rowToOrder);
  const filtered = filterOrdersForReport(orders, preset, ids);

  const buffer = await renderToBuffer(<OrdersReportDoc orders={filtered} />);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="trinity-os-orders-report.pdf"`,
    },
  });
}
