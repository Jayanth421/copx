import { apiError, apiOk } from "@/lib/http";
import { getCurrentAuthContext } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const REGISTRATION_SELECT =
  "id,event_id,student_id,status,registered_at,events(id,title,start_at,college_id,colleges(id,name,code,group_code)),profiles(id,full_name,role,college_id)";

type RegistrationRow = {
  id: string;
  event_id: string;
  student_id: string;
  status: "confirmed" | "cancelled";
  registered_at: string;
  events: {
    id: string;
    title: string;
    start_at: string;
    college_id: string;
  } | null;
  profiles: {
    id: string;
    full_name: string;
    role: "admin" | "college" | "student";
    college_id: string | null;
  } | null;
};

export async function GET(request: Request) {
  const authContext = await getCurrentAuthContext();

  if (!authContext.user || !authContext.profile) {
    return apiError("Unauthorized", 401);
  }

  const adminClient = getSupabaseAdminClient();
  const params = new URL(request.url).searchParams;
  const eventId = params.get("eventId");

  let query = adminClient
    .from("registrations")
    .select(REGISTRATION_SELECT)
    .order("registered_at", { ascending: false });

  if (eventId) {
    query = query.eq("event_id", eventId);
  }

  const role = authContext.profile.role;

  if (role === "student") {
    query = query.eq("student_id", authContext.user.id);
  }

  const { data, error } = (await query) as {
    data: RegistrationRow[] | null;
    error: { message: string } | null;
  };

  if (error) {
    return apiError(error.message, 500);
  }

  let registrations = data ?? [];

  if (role === "college") {
    registrations = registrations.filter(
      (registration) => registration.events?.college_id === authContext.profile?.college_id,
    );
  }

  return apiOk({ registrations });
}
