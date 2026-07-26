import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServiceSupabase } from "@/lib/supabase/server";
import { setSessionCookie } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const { pin } = await req.json();

  if (typeof pin !== "string" || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: "Enter a 4-digit PIN" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { data: members, error } = await supabase
    .from("team_members")
    .select("id, name, role, pin_hash")
    .eq("active", true);

  if (error) {
    return NextResponse.json({ error: "Login is temporarily unavailable" }, { status: 500 });
  }

  let matched: { id: string; name: string; role: "owner" | "employee" } | null = null;
  for (const member of members ?? []) {
    if (await bcrypt.compare(pin, member.pin_hash)) {
      matched = { id: member.id, name: member.name, role: member.role };
      break;
    }
  }

  if (!matched) {
    return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
  }

  await setSessionCookie({ ...matched, iat: Date.now() });

  await supabase.from("access_log").insert({
    team_member_id: matched.id,
    name: matched.name,
    role: matched.role,
  });

  return NextResponse.json({ name: matched.name, role: matched.role });
}
