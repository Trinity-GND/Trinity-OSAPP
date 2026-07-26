import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/require";
import { rowToOrder } from "@/lib/orders/map";
import { presentOrders } from "@/lib/orders/present";
import { ordersToCSV } from "@/lib/csv";

export async function GET() {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const supabase = getServiceSupabase();
  const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const orders = presentOrders((data ?? []).map(rowToOrder), session.role);
  const csv = ordersToCSV(orders);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="trinity-os-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
