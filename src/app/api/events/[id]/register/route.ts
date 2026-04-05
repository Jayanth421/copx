import { apiError, apiOk } from "@/lib/http";
import { getCurrentAuthContext } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendRegistrationConfirmation } from "@/lib/mailer";
import type { EventRecord } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const EVENT_SELECT =
  "id,title,description,location,start_at,end_at,visibility,category,status,poster_url,registration_deadline,capacity,created_at,college_id,created_by,colleges(id,name,code,group_code,contact_email,created_at)";

export async function POST(_: Request, { params }: RouteContext) {
  const { id } = await params;
  const authContext = await getCurrentAuthContext();

  if (!authContext.user || !authContext.profile) {
    return apiError("Unauthorized", 401);
  }

  if (authContext.profile.role !== "student") {
    return apiError("Only students can register for events.", 403);
  }

  const adminClient = getSupabaseAdminClient();
  const { data: eventData, error: eventError } = await adminClient
    .from("events")
    .select(EVENT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (eventError) {
    return apiError(eventError.message, 500);
  }

  if (!eventData) {
    return apiError("Event not found.", 404);
  }

  const event = eventData as EventRecord;

  if (event.status !== "published") {
    return apiError("This event is not open for registration.", 400);
  }

  if (
    event.visibility === "local" &&
    authContext.profile.colleges?.group_code !== event.colleges?.group_code
  ) {
    return apiError("This local event is restricted to another college group.", 403);
  }

  if (
    event.registration_deadline &&
    new Date(event.registration_deadline).getTime() < Date.now()
  ) {
    return apiError("Registration deadline has passed.", 400);
  }

  if (event.capacity) {
    const { count, error: countError } = await adminClient
      .from("registrations")
      .select("*", { count: "exact", head: true })
      .eq("event_id", id);

    if (countError) {
      return apiError(countError.message, 500);
    }

    if ((count ?? 0) >= event.capacity) {
      return apiError("This event has reached capacity.", 409);
    }
  }

  const { data, error } = await adminClient
    .from("registrations")
    .insert({
      event_id: id,
      student_id: authContext.user.id,
      status: "confirmed",
    })
    .select("id,event_id,student_id,status,registered_at")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return apiError("You are already registered for this event.", 409);
    }
    return apiError(error.message, 500);
  }

  if (authContext.user.email) {
    await sendRegistrationConfirmation({
      to: authContext.user.email,
      fullName: authContext.profile.full_name,
      eventTitle: event.title,
      startAt: event.start_at,
    });
  }

  return apiOk({ registration: data }, 201);
}
