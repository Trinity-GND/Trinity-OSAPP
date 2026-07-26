import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";

// TEMPORARY diagnostic route -- no secrets exposed, only presence/length/prefix
// and whether a real Supabase query succeeds. Remove after debugging.
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const secret = process.env.SESSION_SECRET;

  function findBadChars(name: string, value: string | undefined) {
    if (!value) return [];
    const bad: { index: number; code: number; char: string }[] = [];
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i);
      if (code > 255) bad.push({ index: i, code, char: value[i] });
    }
    return bad.map((b) => ({ var: name, ...b }));
  }

  const info: Record<string, unknown> = {
    urlPresent: !!url,
    urlPrefix: url?.slice(0, 30) ?? null,
    anonKeyPresent: !!anon,
    anonKeyLength: anon?.length ?? 0,
    serviceKeyPresent: !!service,
    serviceKeyLength: service?.length ?? 0,
    sessionSecretPresent: !!secret,
    badChars: [
      ...findBadChars("url", url),
      ...findBadChars("anon", anon),
      ...findBadChars("service", service),
      ...findBadChars("secret", secret),
    ],
  };

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase.from("team_members").select("id").limit(1);
    info.queryOk = !error;
    info.queryError = error?.message ?? null;
    info.rowCount = data?.length ?? null;
  } catch (e) {
    info.queryOk = false;
    info.thrown = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(info);
}
