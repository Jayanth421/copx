import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/database.types";
import { requireSupabasePublicKey, requireSupabaseUrl } from "@/lib/supabase/env";

export async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    requireSupabaseUrl(),
    requireSupabasePublicKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(
              ({
                name,
                value,
                options,
              }: {
                name: string;
                value: string;
                options: CookieOptions;
              }) => {
                cookieStore.set(name, value, options);
              },
            );
          } catch {
            // Server Components cannot always mutate cookies.
          }
        },
      },
    },
  );
}
