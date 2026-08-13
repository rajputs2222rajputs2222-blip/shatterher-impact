import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type ContentRow = {
  id: string;
  key: string;
  group_name: string;
  label: string;
  kind: string;
  value: string;
  sort_order: number;
};

export type ContentMap = Record<string, string>;

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export const getSiteContent = createServerFn({ method: "GET" }).handler(async (): Promise<ContentMap> => {
  const { data, error } = await publicClient().from("site_content").select("key, value");
  if (error) throw new Error(error.message);
  const map: ContentMap = {};
  for (const row of data ?? []) map[row.key] = row.value ?? "";
  return map;
});
