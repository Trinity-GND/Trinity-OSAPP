import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/auth/require";
import { getLaborRate, setLaborRate } from "@/lib/settings";

export async function GET() {
  const session = await requireOwner();
  if (session instanceof NextResponse) return session;

  const supabase = getServiceSupabase();
  return NextResponse.json({ laborRate: await getLaborRate(supabase) });
}

export async function PUT(req: NextRequest) {
  const session = await requireOwner();
  if (session instanceof NextResponse) return session;

  const { laborRate } = await req.json();
  if (!(Number(laborRate) > 0)) {
    return NextResponse.json({ error: "Enter a valid labor rate" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  await setLaborRate(supabase, Number(laborRate));
  return NextResponse.json({ laborRate: Number(laborRate) });
}
