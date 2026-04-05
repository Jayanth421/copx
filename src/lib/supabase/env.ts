import { requireEnv } from "@/lib/env";

const SUPABASE_PUBLIC_KEY_HINT =
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY";

export function requireSupabaseUrl() {
  return requireEnv("NEXT_PUBLIC_SUPABASE_URL");
}

export function requireSupabasePublicKey() {
  const value =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (value) {
    return value;
  }

  throw new Error(
    `Missing required Supabase public key environment variable. Set one of: ${SUPABASE_PUBLIC_KEY_HINT}`,
  );
}
