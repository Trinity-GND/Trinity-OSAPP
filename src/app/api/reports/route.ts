import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/auth/require";
import { rowToOrder } from "@/lib/orders/map";
import { getLaborRate } from "@/lib/settings";
import { buildReportsSummary } from "@/lib/reports";

export async function GET() {
  const session = await requireOwner();
  if (session instanceof NextResponse) return session;

  const supabase = getServiceSupabase();
  const [{ data: orderRows, error }, laborRate] = await Promise.all([
    supabase.from("orders").select("*"),
    getLaborRate(supabase),
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const orders = (orderRows ?? []).map(rowToOrder);
  const report = buildReportsSummary(orders, laborRate);

  return NextResponse.json({ ...report, laborRate });
}
