import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getServiceSupabase } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/require";
import { rowToOrder } from "@/lib/orders/map";
import { BulkJobCardsDoc } from "@/lib/pdf/job-card-doc";

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { ids } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "No orders selected" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase.from("orders").select("*").in("id", ids);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const byId = new Map((data ?? []).map((row) => [row.id, rowToOrder(row)]));
  const orders = ids.map((id: string) => byId.get(id)).filter(Boolean) as ReturnType<typeof rowToOrder>[];

  const buffer = await renderToBuffer(<BulkJobCardsDoc orders={orders} />);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="trinity-os-job-cards.pdf"`,
    },
  });
}
