import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { requireSupabasePublicKey, requireSupabaseUrl } from "@/lib/supabase/env";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });

  let supabaseUrl = "";
  let supabasePublicKey = "";

  try {
    supabaseUrl = requireSupabaseUrl();
    supabasePublicKey = requireSupabasePublicKey();
  } catch {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabasePublicKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
