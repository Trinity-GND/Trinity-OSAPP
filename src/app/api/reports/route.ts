import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/auth/require";
import { rowToOrder } from "@/lib/orders/map";
import { getLaborRate } from "@/lib/settings";
import { buildReportsSummary } from "@/lib/reports";

export async function GET(req: NextRequest) {
  const session = await requireOwner();
  if (session instanceof NextResponse) return session;

  const orderType = new URL(req.url).searchParams.get("orderType");

  const supabase = getServiceSupabase();
  let query = supabase.from("orders").select("*");
  if (orderType === "online" || orderType === "offline") {
    query = query.eq("order_type", orderType);
  }

  const [{ data: orderRows, error }, laborRate] = await Promise.all([query, getLaborRate(supabase)]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const orders = (orderRows ?? []).map(rowToOrder);
  const report = buildReportsSummary(orders, laborRate);

  return NextResponse.json({ ...report, laborRate });
}
