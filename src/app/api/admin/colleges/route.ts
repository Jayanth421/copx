import { apiError, apiOk } from "@/lib/http";
import { getCurrentAuthContext } from "@/lib/auth";
import { createCollegeAccountSchema } from "@/lib/validators";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateSecurePassword } from "@/lib/security";
import { sendCredentialEmail } from "@/lib/mailer";

export async function GET() {
  const authContext = await getCurrentAuthContext();

  if (!authContext.profile || authContext.profile.role !== "admin") {
    return apiError("Forbidden", 403);
  }

  const adminClient = getSupabaseAdminClient();

  const { data, error } = await adminClient
    .from("colleges")
    .select("id,name,code,group_code,contact_email,created_at")
    .order("name", { ascending: true });

  if (error) {
    return apiError(error.message, 500);
  }

  return apiOk({ colleges: data ?? [] });
}

export async function POST(request: Request) {
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

  const parsed = createCollegeAccountSchema.safeParse(body);

  if (!parsed.success) {
    return apiError("Invalid college account details.", 400);
  }

  const payload = parsed.data;
  const adminClient = getSupabaseAdminClient();

  let collegeId: string | null = null;

  const { data: existingCollege, error: existingCollegeError } = await adminClient
    .from("colleges")
    .select("id")
    .eq("code", payload.collegeCode.toUpperCase())
    .maybeSingle();

  if (existingCollegeError) {
    return apiError(existingCollegeError.message, 500);
  }

  if (existingCollege) {
    collegeId = existingCollege.id;
  } else {
    const { data: insertedCollege, error: insertCollegeError } = await adminClient
      .from("colleges")
      .insert({
        name: payload.collegeName,
        code: payload.collegeCode.toUpperCase(),
        group_code: payload.groupCode.toUpperCase(),
        contact_email: payload.contactEmail,
      })
      .select("id")
      .single();

    if (insertCollegeError || !insertedCollege) {
      return apiError(insertCollegeError?.message ?? "Could not create college.", 500);
    }

    collegeId = insertedCollege.id;
  }

  const { data: existingProfile, error: existingProfileError } = await adminClient
    .from("profiles")
    .select("id")
    .eq("college_id", collegeId)
    .eq("role", "college")
    .maybeSingle();

  if (existingProfileError) {
    return apiError(existingProfileError.message, 500);
  }

  if (existingProfile) {
    return apiError("A college account already exists for this college.", 409);
  }

  const temporaryPassword = generateSecurePassword();
  const { data: createdUser, error: createUserError } =
    await adminClient.auth.admin.createUser({
      email: payload.accountEmail,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        role: "college",
      },
    });

  if (createUserError || !createdUser.user) {
    return apiError(createUserError?.message ?? "Could not create user.", 400);
  }

  const { error: profileError } = await adminClient.from("profiles").insert({
    id: createdUser.user.id,
    full_name: payload.accountName,
    role: "college",
    college_id: collegeId,
  });

  if (profileError) {
    await adminClient.auth.admin.deleteUser(createdUser.user.id);
    return apiError(profileError.message, 500);
  }

  await sendCredentialEmail({
    to: payload.accountEmail,
    fullName: payload.accountName,
    role: "college",
    temporaryPassword,
  });

  return apiOk(
    {
      ok: true,
      userId: createdUser.user.id,
      temporaryPassword,
    },
    201,
  );
}
