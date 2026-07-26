import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServiceSupabase } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/auth/require";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOwner();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const body = await req.json();
  const update: Record<string, unknown> = {};

  if (typeof body.name === "string" && body.name.trim()) update.name = body.name.trim();
  if (typeof body.role === "string" && ["owner", "employee"].includes(body.role)) update.role = body.role;
  if (typeof body.active === "boolean") update.active = body.active;
  if (typeof body.pin === "string") {
    if (!/^\d{4}$/.test(body.pin)) {
      return NextResponse.json({ error: "PIN must be 4 digits" }, { status: 400 });
    }
    update.pin_hash = await bcrypt.hash(body.pin, 10);
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("team_members")
    .update(update)
    .eq("id", id)
    .select("id, name, role, active, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ member: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOwner();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const supabase = getServiceSupabase();
  const { error } = await supabase.from("team_members").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
