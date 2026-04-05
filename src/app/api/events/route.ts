import { apiError, apiOk } from "@/lib/http";
import { createEventSchema } from "@/lib/validators";
import { getCurrentAuthContext } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { EventRecord, EventStatus } from "@/lib/types";

const EVENT_SELECT =
  "id,title,description,location,start_at,end_at,visibility,category,status,poster_url,registration_deadline,capacity,created_at,college_id,created_by,colleges(id,name,code,group_code,contact_email,created_at)";

function eventMatchesFilters(event: EventRecord, params: URLSearchParams) {
  const query = params.get("q")?.trim().toLowerCase();
  const category = params.get("category");
  const visibility = params.get("visibility");
  const status = params.get("status");

  if (query) {
    const haystack = `${event.title} ${event.description} ${event.location}`.toLowerCase();
    if (!haystack.includes(query)) {
      return false;
    }
  }

  if (category && event.category !== category) {
    return false;
  }

  if (visibility && event.visibility !== visibility) {
    return false;
  }

  if (status && event.status !== status) {
    return false;
  }

  return true;
}

export async function GET(request: Request) {
  const authContext = await getCurrentAuthContext();
  const adminClient = getSupabaseAdminClient();
  const params = new URL(request.url).searchParams;
  const scope = params.get("scope");
  const role = authContext.profile?.role ?? null;

  let query = adminClient
    .from("events")
    .select(EVENT_SELECT)
    .order("start_at", { ascending: true });

  if (role === "college" && scope === "mine") {
    if (!authContext.profile?.college_id) {
      return apiError("College profile is not configured.", 400);
    }
    query = query.eq("college_id", authContext.profile.college_id);
  } else if (role !== "admin") {
    query = query.eq("status", "published");
  }

  const { data, error } = await query;

  if (error) {
    return apiError(error.message, 500);
  }

  const events = ((data ?? []) as EventRecord[]).filter((event) => {
    if (!eventMatchesFilters(event, params)) {
      return false;
    }

    if (role === "admin") {
      return true;
    }

    if (role === "college" && scope === "mine") {
      return true;
    }

    if (event.visibility === "global") {
      return true;
    }

    const viewerGroup = authContext.profile?.colleges?.group_code;
    const eventGroup = event.colleges?.group_code;

    if (!viewerGroup || !eventGroup) {
      return false;
    }

    return viewerGroup === eventGroup;
  });

  return apiOk({ events });
}

export async function POST(request: Request) {
  const authContext = await getCurrentAuthContext();

  if (!authContext.user || !authContext.profile) {
    return apiError("Unauthorized", 401);
  }

  if (!["college", "admin"].includes(authContext.profile.role)) {
    return apiError("Forbidden", 403);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON payload.", 400);
  }

  const parsed = createEventSchema.safeParse(body);

  if (!parsed.success) {
    return apiError("Invalid event payload.", 400);
  }

  let collegeId = authContext.profile.college_id;
  const role = authContext.profile.role;

  if (role === "admin") {
    const explicitCollegeId = (body as { collegeId?: string }).collegeId;

    if (!explicitCollegeId) {
      return apiError("Admin must provide collegeId.", 400);
    }

    collegeId = explicitCollegeId;
  }

  if (!collegeId) {
    return apiError("College association is required.", 400);
  }

  const payload = parsed.data;
  const adminClient = getSupabaseAdminClient();
  const status: EventStatus = role === "admin" ? "published" : "pending";

  const { data, error } = await adminClient
    .from("events")
    .insert({
      title: payload.title,
      description: payload.description,
      location: payload.location,
      start_at: payload.startAt,
      end_at: payload.endAt ?? null,
      registration_deadline: payload.registrationDeadline ?? null,
      visibility: payload.visibility,
      category: payload.category,
      poster_url: payload.posterUrl ?? null,
      capacity: payload.capacity ?? null,
      status,
      college_id: collegeId,
      created_by: authContext.user.id,
    })
    .select(EVENT_SELECT)
    .single();

  if (error || !data) {
    return apiError(error?.message ?? "Could not create event.", 500);
  }

  return apiOk({ event: data }, 201);
}
