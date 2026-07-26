import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServiceSupabase } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/auth/require";

export async function GET() {
  const session = await requireOwner();
  if (session instanceof NextResponse) return session;

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("team_members")
    .select("id, name, role, active, created_at")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ members: data });
}

export async function POST(req: NextRequest) {
  const session = await requireOwner();
  if (session instanceof NextResponse) return session;

  const { name, pin, role } = await req.json();
  if (!name?.trim() || !/^\d{4}$/.test(pin) || !["owner", "employee"].includes(role)) {
    return NextResponse.json({ error: "Name, a 4-digit PIN, and a valid role are required" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const pin_hash = await bcrypt.hash(pin, 10);
  const { data, error } = await supabase
    .from("team_members")
    .insert({ name: name.trim(), pin_hash, role, active: true })
    .select("id, name, role, active, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ member: data }, { status: 201 });
}
