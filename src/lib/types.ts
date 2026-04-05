export type AppRole = "admin" | "college" | "student";

export type EventVisibility = "local" | "global";
export type EventCategory = "tech" | "non-tech";
export type EventStatus = "pending" | "approved" | "rejected" | "published";

export type College = {
  id: string;
  name: string;
  code: string;
  group_code: string;
  contact_email: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  full_name: string;
  role: AppRole;
  college_id: string | null;
  created_at: string;
  colleges?: College | null;
};

export type EventRecord = {
  id: string;
  title: string;
  description: string;
  location: string;
  start_at: string;
  end_at: string | null;
  visibility: EventVisibility;
  category: EventCategory;
  status: EventStatus;
  poster_url: string | null;
  registration_deadline: string | null;
  capacity: number | null;
  created_at: string;
  college_id: string;
  created_by: string;
  colleges?: College | null;
};

export type RegistrationRecord = {
  id: string;
  event_id: string;
  student_id: string;
  status: "confirmed" | "cancelled";
  registered_at: string;
  events?: EventRecord | null;
  profiles?: Profile | null;
};
