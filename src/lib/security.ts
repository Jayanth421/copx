import crypto from "node:crypto";

export function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function hashOtp(email: string, code: string) {
  return crypto
    .createHash("sha256")
    .update(`${email.toLowerCase().trim()}:${code}`)
    .digest("hex");
}

export function generateSecurePassword(length = 14) {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";

  const bytes = crypto.randomBytes(length);
  let password = "";

  for (let index = 0; index < bytes.length; index += 1) {
    password += alphabet[bytes[index] % alphabet.length];
  }

  return password;
}
