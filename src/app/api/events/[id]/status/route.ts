import { apiError, apiOk } from "@/lib/http";
import { getCurrentAuthContext } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEventNotification } from "@/lib/mailer";
import { updateEventStatusSchema } from "@/lib/validators";
import type { EventRecord } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type StudentProfileRow = {
  id: string;
};

const EVENT_SELECT =
  "id,title,description,location,start_at,end_at,visibility,category,status,poster_url,registration_deadline,capacity,created_at,college_id,created_by,colleges(id,name,code,group_code,contact_email,created_at)";

async function fetchUserEmailsByIds(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, string>();
  }

  const adminClient = getSupabaseAdminClient();
  const { data, error } = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    return new Map<string, string>();
  }

  const map = new Map<string, string>();
  for (const user of data.users) {
    if (userIds.includes(user.id) && user.email) {
      map.set(user.id, user.email);
    }
  }

  return map;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const authContext = await getCurrentAuthContext();

  if (!authContext.profile || authContext.profile.role !== "admin") {
    return apiError("Forbidden", 403);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON payload.", 400);
  }

  const parsed = updateEventStatusSchema.safeParse(body);

  if (!parsed.success) {
    return apiError("Invalid status update payload.", 400);
  }

  const adminClient = getSupabaseAdminClient();
  const { data: eventData, error: existingError } = await adminClient
    .from("events")
    .select(EVENT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (existingError) {
    return apiError(existingError.message, 500);
  }

  if (!eventData) {
    return apiError("Event not found.", 404);
  }

  const { data, error } = await adminClient
    .from("events")
    .update({ status: parsed.data.status })
    .eq("id", id)
    .select(EVENT_SELECT)
    .single();

  if (error || !data) {
    return apiError(error?.message ?? "Could not update event status.", 500);
  }

  const event = eventData as EventRecord;
  const action = parsed.data.status;

  const targetUserIds: string[] = [event.created_by];

  if (action === "published") {
    let profilesQuery = adminClient
      .from("profiles")
      .select("id,colleges!inner(group_code)")
      .eq("role", "student")
      .limit(500);

    if (event.visibility === "local" && event.colleges?.group_code) {
      profilesQuery = profilesQuery.eq("colleges.group_code", event.colleges.group_code);
    }

    const { data: studentProfiles } = (await profilesQuery) as {
      data: StudentProfileRow[] | null;
    };
    targetUserIds.push(...(studentProfiles ?? []).map((profile) => profile.id));
  }

  const uniqueTargetIds = Array.from(new Set(targetUserIds));
  const emailMap = await fetchUserEmailsByIds(uniqueTargetIds);

  await Promise.all(
    uniqueTargetIds.map(async (userId) => {
      const email = emailMap.get(userId);

      if (!email) {
        return;
      }

      await sendEventNotification({
        to: email,
        eventTitle: event.title,
        action: action as "published" | "approved" | "rejected",
      });
    }),
  );

  return apiOk({ event: data });
}
