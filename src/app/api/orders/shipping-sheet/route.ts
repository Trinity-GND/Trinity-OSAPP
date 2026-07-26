import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/require";
import { rowToOrder } from "@/lib/orders/map";

function escapeCell(value: string | null): string {
  const s = value ?? "";
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const supabase = getServiceSupabase();
  const { data, error } = await supabase.from("orders").select("*").eq("cancelled", false);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const orders = (data ?? []).map(rowToOrder);
  const eligible = orders.filter((o) => o.finalWeight != null);
  const skipped = orders.length - eligible.length;

  const header = "Job ID,Buyer Name,Shipping Address";
  const rows = eligible.map(
    (o) => `${escapeCell(o.id)},${escapeCell(o.buyerName)},${escapeCell(o.shippingAddress)}`,
  );
  const csv = [header, ...rows].join("\n");

  return NextResponse.json({ csv, included: eligible.length, skipped });
}
