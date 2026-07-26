import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getServiceSupabase } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/require";
import { rowToOrder } from "@/lib/orders/map";
import { SingleJobCardDoc } from "@/lib/pdf/job-card-doc";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const supabase = getServiceSupabase();
  const { data, error } = await supabase.from("orders").select("*").eq("id", id).single();

  if (error || !data) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const order = rowToOrder(data);
  const buffer = await renderToBuffer(<SingleJobCardDoc order={order} />);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${order.id}-job-card.pdf"`,
    },
  });
}
