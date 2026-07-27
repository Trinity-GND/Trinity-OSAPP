import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import { requireSession, requireOwner } from "@/lib/auth/require";

export async function GET() {
  // Both owner and employee sessions can read this -- employees need it for
  // the code lookup when logging an Offline order, even though only the
  // owner can add/edit entries.
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const supabase = getServiceSupabase();
  const { data, error } = await supabase.from("clients").select("*").order("code", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ clients: data });
}

export async function POST(req: NextRequest) {
  const session = await requireOwner();
  if (session instanceof NextResponse) return session;

  const { code, name } = await req.json();
  if (!code?.trim() || !name?.trim()) {
    return NextResponse.json({ error: "Code and name are required" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("clients")
    .insert({ code: code.trim(), name: name.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ client: data }, { status: 201 });
}
