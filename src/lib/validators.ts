import { z } from "zod";
import { EVENT_CATEGORIES, EVENT_STATUSES, EVENT_VISIBILITIES } from "@/lib/constants";

export const otpRequestSchema = z.object({
  email: z.string().email().toLowerCase(),
});

export const studentRegistrationSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(72),
  collegeId: z.string().uuid(),
  otp: z.string().regex(/^\d{6}$/),
});

export const createCollegeAccountSchema = z.object({
  collegeName: z.string().trim().min(2).max(120),
  collegeCode: z.string().trim().min(2).max(25),
  groupCode: z.string().trim().min(2).max(25),
  contactEmail: z.string().email().toLowerCase(),
  accountName: z.string().trim().min(2).max(80),
  accountEmail: z.string().email().toLowerCase(),
});

export const createEventSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(2000),
  location: z.string().trim().min(2).max(140),
  startAt: z.string().datetime(),
  endAt: z.string().datetime().nullable().optional(),
  registrationDeadline: z.string().datetime().nullable().optional(),
  visibility: z.enum(EVENT_VISIBILITIES),
  category: z.enum(EVENT_CATEGORIES),
  posterUrl: z.string().url().nullable().optional(),
  capacity: z.number().int().positive().max(5000).nullable().optional(),
});

export const updateEventStatusSchema = z.object({
  status: z.enum(EVENT_STATUSES),
});
