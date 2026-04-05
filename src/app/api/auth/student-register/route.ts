import { apiError, apiOk } from "@/lib/http";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { hashOtp } from "@/lib/security";
import { studentRegistrationSchema } from "@/lib/validators";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON payload.", 400);
  }

  const parsed = studentRegistrationSchema.safeParse(body);

  if (!parsed.success) {
    return apiError("Please provide valid registration details.", 400);
  }

  const { fullName, email, password, collegeId, otp } = parsed.data;
  const adminClient = getSupabaseAdminClient();

  const otpHash = hashOtp(email, otp);
  const { data: otpRow, error: otpError } = await adminClient
    .from("email_otps")
    .select("id,otp_hash,expires_at,consumed_at")
    .eq("email", email)
    .maybeSingle();

  if (otpError) {
    return apiError(otpError.message, 500);
  }

  if (!otpRow) {
    return apiError("OTP not found. Request a new OTP.", 400);
  }

  if (otpRow.consumed_at) {
    return apiError("OTP is already used. Request a new OTP.", 400);
  }

  if (new Date(otpRow.expires_at).getTime() < Date.now()) {
    return apiError("OTP has expired. Request a new OTP.", 400);
  }

  if (otpRow.otp_hash !== otpHash) {
    return apiError("Invalid OTP.", 400);
  }

  const { data: college, error: collegeError } = await adminClient
    .from("colleges")
    .select("id")
    .eq("id", collegeId)
    .maybeSingle();

  if (collegeError) {
    return apiError(collegeError.message, 500);
  }

  if (!college) {
    return apiError("Selected college was not found.", 400);
  }

  const { data: createdUser, error: createUserError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: "student",
      },
    });

  if (createUserError || !createdUser.user) {
    return apiError(createUserError?.message ?? "Could not create account.", 400);
  }

  const { error: profileError } = await adminClient.from("profiles").insert({
    id: createdUser.user.id,
    full_name: fullName,
    role: "student",
    college_id: collegeId,
  });

  if (profileError) {
    await adminClient.auth.admin.deleteUser(createdUser.user.id);
    return apiError(profileError.message, 500);
  }

  await adminClient
    .from("email_otps")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", otpRow.id);

  return apiOk({ ok: true, userId: createdUser.user.id }, 201);
}
