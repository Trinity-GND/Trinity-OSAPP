// One-time setup: creates the public storage bucket for order product photos.
import { createClient } from "@supabase/supabase-js";
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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: buckets } = await supabase.storage.listBuckets();
if (buckets?.some((b) => b.name === "order-images")) {
  console.log("Bucket 'order-images' already exists.");
} else {
  const { error } = await supabase.storage.createBucket("order-images", {
    public: true,
    fileSizeLimit: "5MB",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  });
  console.log(error ? `Failed: ${error.message}` : "Created bucket 'order-images'.");
}
