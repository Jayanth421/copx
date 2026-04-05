import nodemailer, { type Transporter } from "nodemailer";
import { optionalEnv } from "@/lib/env";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

let transporter: Transporter | null = null;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  return transporter;
}

async function sendEmail(payload: EmailPayload) {
  const activeTransporter = getTransporter();

  if (!activeTransporter) {
    return { sent: false, skipped: true as const };
  }

  await activeTransporter.sendMail({
    from: optionalEnv("SMTP_FROM", "COPX <no-reply@copx.local>"),
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });

  return { sent: true, skipped: false as const };
}

export async function sendOtpEmail(recipient: string, otp: string) {
  return sendEmail({
    to: recipient,
    subject: "Your COPX OTP Code",
    text: `Your OTP is ${otp}. It expires in 10 minutes.`,
    html: `<p>Your COPX OTP is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
  });
}

export async function sendCredentialEmail(payload: {
  to: string;
  fullName: string;
  role: "college" | "admin";
  temporaryPassword: string;
}) {
  return sendEmail({
    to: payload.to,
    subject: `COPX ${payload.role} account credentials`,
    text: `Hello ${payload.fullName}, your ${payload.role} account is ready.\nEmail: ${payload.to}\nTemporary password: ${payload.temporaryPassword}\nPlease sign in and change your password.`,
    html: `<p>Hello ${payload.fullName},</p><p>Your <strong>${payload.role}</strong> account is ready.</p><p>Email: <strong>${payload.to}</strong><br/>Temporary password: <strong>${payload.temporaryPassword}</strong></p><p>Please sign in and change your password.</p>`,
  });
}

export async function sendRegistrationConfirmation(payload: {
  to: string;
  fullName: string;
  eventTitle: string;
  startAt: string;
}) {
  return sendEmail({
    to: payload.to,
    subject: `Registration confirmed: ${payload.eventTitle}`,
    text: `Hi ${payload.fullName}, your registration for ${payload.eventTitle} is confirmed.\nStarts at: ${payload.startAt}`,
    html: `<p>Hi ${payload.fullName},</p><p>Your registration for <strong>${payload.eventTitle}</strong> is confirmed.</p><p>Starts at: ${payload.startAt}</p>`,
  });
}

export async function sendEventNotification(payload: {
  to: string;
  eventTitle: string;
  action: "published" | "approved" | "rejected";
}) {
  return sendEmail({
    to: payload.to,
    subject: `COPX event ${payload.action}: ${payload.eventTitle}`,
    text: `Your event "${payload.eventTitle}" has been ${payload.action}.`,
    html: `<p>Your event <strong>${payload.eventTitle}</strong> has been <strong>${payload.action}</strong>.</p>`,
  });
}
