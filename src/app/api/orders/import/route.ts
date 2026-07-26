import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/require";
import { csvToOrders } from "@/lib/csv";
import { orderToRow } from "@/lib/orders/map";

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const text = await file.text();
  const rows = csvToOrders(text);
  const ids = rows.map((r) => r.id).filter(Boolean) as string[];

  const supabase = getServiceSupabase();
  const { data: existing, error: existingError } = await supabase
    .from("orders")
    .select("id")
    .in("id", ids.length > 0 ? ids : ["__none__"]);

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const existingIds = new Set((existing ?? []).map((r) => r.id));
  const newRows = rows.filter((r) => r.id && !existingIds.has(r.id as string));

  if (session.role !== "owner") {
    for (const r of newRows) delete r.materialCost;
  }

  let imported = 0;
  if (newRows.length > 0) {
    const dbRows = newRows.map((r) => ({ ...orderToRow(r), id: r.id }));
    const { error: insertError, count } = await supabase.from("orders").insert(dbRows, { count: "exact" });
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    imported = count ?? newRows.length;
  }

  return NextResponse.json({
    imported,
    skipped: rows.length - newRows.length,
    total: rows.length,
  });
}
