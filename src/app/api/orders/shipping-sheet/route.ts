import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/require";
import { rowToOrder } from "@/lib/orders/map";

function escapeCell(value: string | number | null): string {
  const s = value == null ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { ids } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "Select at least one order first" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("cancelled", false)
    .in("id", ids);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const orders = (data ?? []).map(rowToOrder);
  const eligible = orders.filter((o) => o.finalWeight != null);
  const skipped = orders.length - eligible.length;

  const header = "SR NO,BUYER NAME,ADDRES,CITY,STATE,ZIP CODE,COUNTRY,CONTACT NO,CONTENT";
  const rows = eligible.map((o, i) =>
    [
      i + 1,
      escapeCell(o.buyerName),
      escapeCell(o.addressLine),
      escapeCell(o.city),
      escapeCell(o.state),
      escapeCell(o.zip),
      escapeCell(o.country),
      escapeCell(o.contactNo),
      escapeCell(o.category),
    ].join(","),
  );
  const csv = [header, ...rows].join("\n");

  return NextResponse.json({ csv, included: eligible.length, skipped });
}
