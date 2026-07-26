import { SupabaseClient } from "@supabase/supabase-js";

export async function getLaborRate(supabase: SupabaseClient): Promise<number> {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "labor_rate_per_gram_usd")
    .single();
  return Number(data?.value ?? 280);
}

export async function setLaborRate(supabase: SupabaseClient, rate: number): Promise<void> {
  await supabase
    .from("app_settings")
    .upsert({ key: "labor_rate_per_gram_usd", value: rate });
}
