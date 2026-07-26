import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/auth/require";

export async function GET(req: NextRequest) {
  const session = await requireOwner();
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month"));

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("payroll_entries")
    .select("*")
    .eq("year", year)
    .eq("month", month)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entries: data });
}

export async function POST(req: NextRequest) {
  const session = await requireOwner();
  if (session instanceof NextResponse) return session;

  const body = await req.json();
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("payroll_entries")
    .insert({
      year: body.year,
      month: body.month,
      name: body.name ?? "",
      monthly_salary: body.monthlySalary ?? 0,
      days_to_be_paid: body.daysToBePaid ?? 0,
      days_present: body.daysPresent ?? 0,
      advance: body.advance ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entry: data }, { status: 201 });
}
