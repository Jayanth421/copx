import { apiError, apiOk } from "@/lib/http";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("colleges")
    .select("id,name,code,group_code")
    .order("name", { ascending: true });

  if (error) {
    return apiError(error.message, 500);
  }

  return apiOk({ colleges: data ?? [] });
}
