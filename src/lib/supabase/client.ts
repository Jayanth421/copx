"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import { requireSupabasePublicKey, requireSupabaseUrl } from "@/lib/supabase/env";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient;
  }

  const url = requireSupabaseUrl();
  const publicKey = requireSupabasePublicKey();

  browserClient = createBrowserClient<Database>(url, publicKey);
  return browserClient;
}
