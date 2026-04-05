import type { EventRecord, Profile } from "@/lib/types";

export function canStudentViewEvent(event: EventRecord, profile: Profile | null) {
  if (!profile?.colleges?.group_code || !event.colleges?.group_code) {
    return event.visibility === "global";
  }

  if (event.visibility === "global") {
    return true;
  }

  return profile.colleges.group_code === event.colleges.group_code;
}
