import { NextResponse } from "next/server";
import { getSession, SessionPayload } from "@/lib/auth/session";

export async function requireSession(): Promise<SessionPayload | NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  return session;
}

export async function requireOwner(): Promise<SessionPayload | NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  if (session.role !== "owner") {
    return NextResponse.json({ error: "Owner access required" }, { status: 403 });
  }
  return session;
}
