import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/require";
import { rowToOrder } from "@/lib/orders/map";
import { presentOrder } from "@/lib/orders/present";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const body = await req.json();
  const returnReason = (body.returnReason ?? "").trim();
  const refundType = body.refundType ?? "none";

  if (!returnReason) {
    return NextResponse.json({ error: "A return reason is required" }, { status: 400 });
  }
  if (!["none", "full", "partial"].includes(refundType)) {
    return NextResponse.json({ error: "Invalid refund type" }, { status: 400 });
  }
  if (refundType === "partial" && !(Number(body.refundAmount) > 0)) {
    return NextResponse.json(
      { error: "A refund amount is required for a partial refund" },
      { status: 400 },
    );
  }

  const supabase = getServiceSupabase();

  const update: Record<string, unknown> = {
    returned: true,
    return_reason: returnReason,
    return_date: new Date().toISOString(),
    refund_type: refundType,
    updated_at: new Date().toISOString(),
  };

  if (refundType === "full") {
    const { data: order } = await supabase.from("orders").select("sold_price").eq("id", id).single();
    update.refund_amount = order?.sold_price ?? null;
    update.refund_date = new Date().toISOString();
  } else if (refundType === "partial") {
    update.refund_amount = Number(body.refundAmount);
    update.refund_date = new Date().toISOString();
  }

  const { data, error } = await supabase.from("orders").update(update).eq("id", id).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ order: presentOrder(rowToOrder(data), session.role) });
}
