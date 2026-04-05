import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { AppRole, Profile } from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type AuthContext = {
  user: User | null;
  profile: Profile | null;
};

export function dashboardPathForRole(role: AppRole) {
  if (role === "admin") {
    return "/dashboard/admin";
  }

  if (role === "college") {
    return "/dashboard/college";
  }

  return "/dashboard/student";
}

export async function getCurrentAuthContext(): Promise<AuthContext> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id,full_name,role,college_id,created_at,colleges(id,name,code,group_code,contact_email,created_at)",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return { user, profile: null };
  }

  return {
    user,
    profile: (data as Profile | null) ?? null,
  };
}

export async function requireSignedIn() {
  const context = await getCurrentAuthContext();

  if (!context.user) {
    redirect("/auth/sign-in");
  }

  return context;
}

export async function requireRole(roles: AppRole[]) {
  const context = await requireSignedIn();

  if (!context.profile || !roles.includes(context.profile.role)) {
    redirect("/dashboard");
  }

  return context as { user: User; profile: Profile };
}
