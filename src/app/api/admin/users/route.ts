import { apiError, apiOk } from "@/lib/http";
import { getCurrentAuthContext } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const authContext = await getCurrentAuthContext();

  if (!authContext.profile || authContext.profile.role !== "admin") {
    return apiError("Forbidden", 403);
  }

  const adminClient = getSupabaseAdminClient();
  const { data, error } = await adminClient
    .from("profiles")
    .select(
      "id,full_name,role,college_id,created_at,colleges(id,name,code,group_code,contact_email,created_at)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return apiError(error.message, 500);
  }

  return apiOk({ users: data ?? [] });
}
