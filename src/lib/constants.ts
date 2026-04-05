import type { AppRole, EventCategory, EventStatus, EventVisibility } from "@/lib/types";

export const APP_ROLES: AppRole[] = ["admin", "college", "student"];
export const EVENT_VISIBILITIES: EventVisibility[] = ["local", "global"];
export const EVENT_CATEGORIES: EventCategory[] = ["tech", "non-tech"];
export const EVENT_STATUSES: EventStatus[] = ["pending", "approved", "rejected", "published"];
