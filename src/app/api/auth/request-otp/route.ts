import { apiError, apiOk } from "@/lib/http";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateOtpCode, hashOtp } from "@/lib/security";
import { sendOtpEmail } from "@/lib/mailer";
import { otpRequestSchema } from "@/lib/validators";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON payload.", 400);
  }

  const parsed = otpRequestSchema.safeParse(body);

  if (!parsed.success) {
    return apiError("Please provide a valid email.", 400);
  }

  const email = parsed.data.email;
  const otp = generateOtpCode();
  const otpHash = hashOtp(email, otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const adminClient = getSupabaseAdminClient();
  const { error } = await adminClient.from("email_otps").upsert(
    {
      email,
      otp_hash: otpHash,
      expires_at: expiresAt,
      consumed_at: null,
    },
    { onConflict: "email" },
  );

  if (error) {
    return apiError(error.message, 500);
  }

  await sendOtpEmail(email, otp);

  return apiOk({ ok: true });
}
