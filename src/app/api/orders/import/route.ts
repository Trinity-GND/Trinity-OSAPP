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

  // Rows with a Job ID already assigned get deduplicated against what's in
  // the database (the "safety net, not a sync tool" behavior). Rows with no
  // ID at all are genuinely new records (e.g. converted from an external
  // sheet that never had our IDs) -- those always import and get a fresh
  // JOB-NNNNNN assigned by the database, they're never dropped.
  const rowsWithId = rows.filter((r) => r.id);
  const rowsWithoutId = rows.filter((r) => !r.id);
  const ids = rowsWithId.map((r) => r.id) as string[];

  const supabase = getServiceSupabase();
  const { data: existing, error: existingError } = await supabase
    .from("orders")
    .select("id")
    .in("id", ids.length > 0 ? ids : ["__none__"]);

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const existingIds = new Set((existing ?? []).map((r) => r.id));
  const newRowsWithId = rowsWithId.filter((r) => !existingIds.has(r.id as string));
  const newRows = [...newRowsWithId, ...rowsWithoutId];

  if (session.role !== "owner") {
    for (const r of newRows) delete r.materialCost;
  }

  let imported = 0;
  if (newRows.length > 0) {
    const dbRows = newRows.map((r) => {
      const row = orderToRow(r);
      if (r.id) row.id = r.id;
      return row;
    });
    const { error: insertError, count } = await supabase.from("orders").insert(dbRows, { count: "exact" });
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    imported = count ?? newRows.length;
  }

  return NextResponse.json({
    imported,
    skipped: rowsWithId.length - newRowsWithId.length,
    total: rows.length,
  });
}
