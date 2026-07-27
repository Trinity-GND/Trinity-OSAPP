import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/auth/require";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOwner();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const body = await req.json();
  const update: Record<string, unknown> = {};
  if (typeof body.code === "string" && body.code.trim()) update.code = body.code.trim();
  if (typeof body.name === "string" && body.name.trim()) update.name = body.name.trim();

  const supabase = getServiceSupabase();
  const { data, error } = await supabase.from("clients").update(update).eq("id", id).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ client: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOwner();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const supabase = getServiceSupabase();
  const { error } = await supabase.from("clients").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
