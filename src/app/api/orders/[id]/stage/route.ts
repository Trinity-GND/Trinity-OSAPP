import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/require";
import { rowToOrder } from "@/lib/orders/map";
import { presentOrder } from "@/lib/orders/present";
import { STAGES, Stage } from "@/types/order";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const body = await req.json();
  const stage = body.stage as Stage;

  if (!STAGES.includes(stage)) {
    return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
  }

  if (stage === "readyToDispatch") {
    const finalWeight = Number(body.finalWeight);
    if (!finalWeight || finalWeight <= 0) {
      return NextResponse.json(
        { error: "Final weight is required to move to Ready to Dispatch" },
        { status: 400 },
      );
    }
  }

  const supabase = getServiceSupabase();
  const { data: existing, error: fetchError } = await supabase
    .from("orders")
    .select("stage_timestamps")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const stageTimestamps = { ...(existing.stage_timestamps ?? {}) };
  if (!stageTimestamps[stage]) {
    stageTimestamps[stage] = new Date().toISOString();
  }

  const update: Record<string, unknown> = {
    stage,
    stage_timestamps: stageTimestamps,
    updated_at: new Date().toISOString(),
  };
  if (stage === "readyToDispatch") {
    update.final_weight = Number(body.finalWeight);
  }

  const { data, error } = await supabase
    .from("orders")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ order: presentOrder(rowToOrder(data), session.role) });
}
