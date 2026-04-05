"use client";

import { FormEvent, useEffect, useState } from "react";
import type { EventRecord, Profile } from "@/lib/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type CollegeRecord = {
  id: string;
  name: string;
  code: string;
  group_code: string;
  contact_email: string | null;
};

const initialCollegeForm = {
  collegeName: "",
  collegeCode: "",
  groupCode: "",
  contactEmail: "",
  accountName: "",
  accountEmail: "",
};

export function AdminDashboard() {
  const [collegeForm, setCollegeForm] = useState(initialCollegeForm);
  const [colleges, setColleges] = useState<CollegeRecord[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel("admin-events")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => {
        void loadEvents();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  async function loadAll() {
    await Promise.all([loadColleges(), loadUsers(), loadEvents()]);
  }

  async function loadColleges() {
    const response = await fetch("/api/admin/colleges", { cache: "no-store" });
    const data = (await response.json()) as { colleges?: CollegeRecord[]; error?: string };

    if (!response.ok) {
      throw new Error(data.error ?? "Could not load colleges.");
    }

    setColleges(data.colleges ?? []);
  }

  async function loadUsers() {
    const response = await fetch("/api/admin/users", { cache: "no-store" });
    const data = (await response.json()) as { users?: Profile[]; error?: string };

    if (!response.ok) {
      throw new Error(data.error ?? "Could not load users.");
    }

    setUsers(data.users ?? []);
  }

  async function loadEvents() {
    const response = await fetch("/api/events", { cache: "no-store" });
    const data = (await response.json()) as { events?: EventRecord[]; error?: string };

    if (!response.ok) {
      throw new Error(data.error ?? "Could not load events.");
    }

    setEvents(data.events ?? []);
  }

  async function handleCreateCollegeAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setBusy(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/admin/colleges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(collegeForm),
      });

      const data = (await response.json()) as { temporaryPassword?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not create college account.");
      }

      setCollegeForm(initialCollegeForm);
      setMessage(
        `College account created successfully. Temporary password: ${data.temporaryPassword ?? "sent by email"}`,
      );
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create college account.");
    } finally {
      setBusy(false);
    }
  }

  async function handleStatusChange(eventId: string, status: "approved" | "rejected" | "published") {
    try {
      setBusy(true);
      setError("");
      setMessage("");

      const response = await fetch(`/api/events/${eventId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not update status.");
      }

      setMessage(`Event ${status} successfully.`);
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="glass-card p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Admin Panel</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-900">
          COPX Governance Console
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage colleges, user access, event moderation, and publication flow.
        </p>
      </section>

      <section className="glass-card p-5">
        <h2 className="text-xl font-semibold text-slate-900">Create College Account</h2>
        <form onSubmit={handleCreateCollegeAccount} className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            required
            placeholder="College name"
            value={collegeForm.collegeName}
            onChange={(event) =>
              setCollegeForm((current) => ({ ...current, collegeName: event.target.value }))
            }
            className="h-10 rounded-xl border border-slate-300 px-3 text-sm outline-none ring-sky-300 focus:ring-2"
          />
          <input
            required
            placeholder="College code (e.g., CMRIT)"
            value={collegeForm.collegeCode}
            onChange={(event) =>
              setCollegeForm((current) => ({ ...current, collegeCode: event.target.value }))
            }
            className="h-10 rounded-xl border border-slate-300 px-3 text-sm outline-none ring-sky-300 focus:ring-2"
          />
          <input
            required
            placeholder="Group code (e.g., CMR)"
            value={collegeForm.groupCode}
            onChange={(event) =>
              setCollegeForm((current) => ({ ...current, groupCode: event.target.value }))
            }
            className="h-10 rounded-xl border border-slate-300 px-3 text-sm outline-none ring-sky-300 focus:ring-2"
          />
          <input
            required
            type="email"
            placeholder="College contact email"
            value={collegeForm.contactEmail}
            onChange={(event) =>
              setCollegeForm((current) => ({ ...current, contactEmail: event.target.value }))
            }
            className="h-10 rounded-xl border border-slate-300 px-3 text-sm outline-none ring-sky-300 focus:ring-2"
          />
          <input
            required
            placeholder="Account owner name"
            value={collegeForm.accountName}
            onChange={(event) =>
              setCollegeForm((current) => ({ ...current, accountName: event.target.value }))
            }
            className="h-10 rounded-xl border border-slate-300 px-3 text-sm outline-none ring-sky-300 focus:ring-2"
          />
          <input
            required
            type="email"
            placeholder="Account login email"
            value={collegeForm.accountEmail}
            onChange={(event) =>
              setCollegeForm((current) => ({ ...current, accountEmail: event.target.value }))
            }
            className="h-10 rounded-xl border border-slate-300 px-3 text-sm outline-none ring-sky-300 focus:ring-2"
          />
          <button
            type="submit"
            disabled={busy}
            className="h-10 rounded-xl bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-65 md:col-span-2"
          >
            {busy ? "Processing..." : "Create College Account"}
          </button>
        </form>
      </section>

      {message ? (
        <p className="rounded-xl bg-emerald-100 px-4 py-2 text-sm text-emerald-800">{message}</p>
      ) : null}
      {error ? <p className="rounded-xl bg-rose-100 px-4 py-2 text-sm text-rose-700">{error}</p> : null}

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="glass-card p-5">
          <h3 className="text-lg font-semibold text-slate-900">Colleges ({colleges.length})</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            {colleges.map((college) => (
              <p key={college.id}>
                {college.name} ({college.code}) • {college.group_code}
              </p>
            ))}
          </div>
        </article>

        <article className="glass-card p-5">
          <h3 className="text-lg font-semibold text-slate-900">Users ({users.length})</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            {users.slice(0, 12).map((user) => (
              <p key={user.id}>
                {user.full_name} • {user.role}
              </p>
            ))}
          </div>
        </article>

        <article className="glass-card p-5">
          <h3 className="text-lg font-semibold text-slate-900">Events ({events.length})</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            {events.slice(0, 12).map((event) => (
              <p key={event.id}>
                {event.title} • {event.status}
              </p>
            ))}
          </div>
        </article>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900">Moderate Events</h2>
        {events.map((event) => (
          <article key={event.id} className="glass-card grid gap-3 p-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{event.title}</h3>
              <p className="mt-1 text-sm text-slate-600">
                {event.colleges?.name ?? "Unknown"} • {event.visibility} • {event.category}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status: {event.status}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleStatusChange(event.id, "approved")}
                className="rounded-lg border border-emerald-300 px-3 py-1.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleStatusChange(event.id, "published")}
                className="rounded-lg border border-sky-300 px-3 py-1.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-50 disabled:opacity-60"
              >
                Publish
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleStatusChange(event.id, "rejected")}
                className="rounded-lg border border-rose-300 px-3 py-1.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
              >
                Reject
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
