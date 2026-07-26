// One-time seed: hashes PINs from seed-data/team-pins.json (gitignored,
// never committed) and upserts them into team_members via the service
// role key. Safe to re-run — it upserts by name.
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
);

const roster = JSON.parse(
  readFileSync(new URL("../seed-data/team-pins.json", import.meta.url), "utf8"),
);

for (const member of roster) {
  const pin_hash = await bcrypt.hash(member.pin, 10);
  const { error } = await supabase
    .from("team_members")
    .upsert(
      { name: member.name, pin_hash, role: member.role, active: true },
      { onConflict: "name" },
    );
  if (error) {
    console.error(`Failed to seed ${member.name}:`, error.message);
  } else {
    console.log(`Seeded ${member.name} (${member.role})`);
  }
}
