export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      colleges: {
        Row: {
          id: string;
          name: string;
          code: string;
          group_code: string;
          contact_email: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          group_code: string;
          contact_email?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          group_code?: string;
          contact_email?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: "admin" | "college" | "student";
          college_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role: "admin" | "college" | "student";
          college_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: "admin" | "college" | "student";
          college_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string;
          location: string;
          start_at: string;
          end_at: string | null;
          registration_deadline: string | null;
          visibility: "local" | "global";
          category: "tech" | "non-tech";
          status: "pending" | "approved" | "rejected" | "published";
          poster_url: string | null;
          capacity: number | null;
          college_id: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          location: string;
          start_at: string;
          end_at?: string | null;
          registration_deadline?: string | null;
          visibility: "local" | "global";
          category: "tech" | "non-tech";
          status?: "pending" | "approved" | "rejected" | "published";
          poster_url?: string | null;
          capacity?: number | null;
          college_id: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          location?: string;
          start_at?: string;
          end_at?: string | null;
          registration_deadline?: string | null;
          visibility?: "local" | "global";
          category?: "tech" | "non-tech";
          status?: "pending" | "approved" | "rejected" | "published";
          poster_url?: string | null;
          capacity?: number | null;
          college_id?: string;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      registrations: {
        Row: {
          id: string;
          event_id: string;
          student_id: string;
          status: "confirmed" | "cancelled";
          registered_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          student_id: string;
          status?: "confirmed" | "cancelled";
          registered_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          student_id?: string;
          status?: "confirmed" | "cancelled";
          registered_at?: string;
        };
        Relationships: [];
      };
      email_otps: {
        Row: {
          id: string;
          email: string;
          otp_hash: string;
          expires_at: string;
          consumed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          otp_hash: string;
          expires_at: string;
          consumed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          otp_hash?: string;
          expires_at?: string;
          consumed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
