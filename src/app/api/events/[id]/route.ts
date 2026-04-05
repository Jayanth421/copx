import { z } from "zod";
import { apiError, apiOk } from "@/lib/http";
import { getCurrentAuthContext } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createEventSchema } from "@/lib/validators";
import type { EventRecord } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const EVENT_SELECT =
  "id,title,description,location,start_at,end_at,visibility,category,status,poster_url,registration_deadline,capacity,created_at,college_id,created_by,colleges(id,name,code,group_code,contact_email,created_at)";

function canViewerSeeEvent(event: EventRecord, viewerRole: string | null, viewerGroup?: string | null) {
  if (viewerRole === "admin") {
    return true;
  }

  if (viewerRole === "college" && event.college_id) {
    return true;
  }

  if (event.status !== "published") {
    return false;
  }

  if (event.visibility === "global") {
    return true;
  }

  if (!viewerGroup || !event.colleges?.group_code) {
    return false;
  }

  return viewerGroup === event.colleges.group_code;
}

export async function GET(_: Request, { params }: RouteContext) {
  const { id } = await params;
  const authContext = await getCurrentAuthContext();
  const adminClient = getSupabaseAdminClient();

  const { data, error } = await adminClient
    .from("events")
    .select(EVENT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return apiError(error.message, 500);
  }

  if (!data) {
    return apiError("Event not found.", 404);
  }

  const event = data as EventRecord;
  const allowed = canViewerSeeEvent(
    event,
    authContext.profile?.role ?? null,
    authContext.profile?.colleges?.group_code,
  );

  if (!allowed) {
    return apiError("Forbidden", 403);
  }

  return apiOk({ event });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const authContext = await getCurrentAuthContext();

  if (!authContext.user || !authContext.profile) {
    return apiError("Unauthorized", 401);
  }

  if (!["admin", "college"].includes(authContext.profile.role)) {
    return apiError("Forbidden", 403);
  }

  const adminClient = getSupabaseAdminClient();
  const { data: existing, error: existingError } = await adminClient
    .from("events")
    .select("id,college_id,status")
    .eq("id", id)
    .maybeSingle();

  if (existingError) {
    return apiError(existingError.message, 500);
  }

  if (!existing) {
    return apiError("Event not found.", 404);
  }

  if (
    authContext.profile.role === "college" &&
    authContext.profile.college_id !== existing.college_id
  ) {
    return apiError("Forbidden", 403);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON payload.", 400);
  }

  const parsed = createEventSchema.partial().safeParse(body);

  if (!parsed.success) {
    return apiError("Invalid event updates.", 400);
  }

  if (Object.keys(parsed.data).length === 0) {
    return apiError("No fields provided for update.", 400);
  }

  const payload = parsed.data;
  const updatePayload: Record<string, unknown> = {};

  if (payload.title !== undefined) updatePayload.title = payload.title;
  if (payload.description !== undefined) updatePayload.description = payload.description;
  if (payload.location !== undefined) updatePayload.location = payload.location;
  if (payload.startAt !== undefined) updatePayload.start_at = payload.startAt;
  if (payload.endAt !== undefined) updatePayload.end_at = payload.endAt ?? null;
  if (payload.registrationDeadline !== undefined) {
    updatePayload.registration_deadline = payload.registrationDeadline ?? null;
  }
  if (payload.visibility !== undefined) updatePayload.visibility = payload.visibility;
  if (payload.category !== undefined) updatePayload.category = payload.category;
  if (payload.posterUrl !== undefined) updatePayload.poster_url = payload.posterUrl ?? null;
  if (payload.capacity !== undefined) updatePayload.capacity = payload.capacity ?? null;

  if (authContext.profile.role === "college") {
    updatePayload.status = "pending";
  }

  const { data, error } = await adminClient
    .from("events")
    .update(updatePayload)
    .eq("id", id)
    .select(EVENT_SELECT)
    .single();

  if (error || !data) {
    return apiError(error?.message ?? "Could not update event.", 500);
  }

  return apiOk({ event: data });
}

export async function DELETE(_: Request, { params }: RouteContext) {
  const { id } = await params;
  const authContext = await getCurrentAuthContext();

  if (!authContext.user || !authContext.profile) {
    return apiError("Unauthorized", 401);
  }

  if (!["admin", "college"].includes(authContext.profile.role)) {
    return apiError("Forbidden", 403);
  }

  const adminClient = getSupabaseAdminClient();
  const { data: existing, error: existingError } = await adminClient
    .from("events")
    .select("id,college_id")
    .eq("id", id)
    .maybeSingle();

  if (existingError) {
    return apiError(existingError.message, 500);
  }

  if (!existing) {
    return apiError("Event not found.", 404);
  }

  if (
    authContext.profile.role === "college" &&
    authContext.profile.college_id !== existing.college_id
  ) {
    return apiError("Forbidden", 403);
  }

  const { error } = await adminClient.from("events").delete().eq("id", id);

  if (error) {
    return apiError(error.message, 500);
  }

  return apiOk({ ok: true });
}
