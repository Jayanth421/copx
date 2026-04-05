import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";
import { requireSupabaseUrl } from "@/lib/supabase/env";

let adminClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseAdminClient() {
  if (adminClient) {
    return adminClient;
  }

  adminClient = createClient<Database>(
    requireSupabaseUrl(),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  return adminClient;
}
