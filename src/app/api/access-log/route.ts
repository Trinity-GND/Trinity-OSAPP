import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/auth/require";

export async function GET() {
  const session = await requireOwner();
  if (session instanceof NextResponse) return session;

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("access_log")
    .select("id, name, role, logged_in_at")
    .order("logged_in_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entries: data });
}
