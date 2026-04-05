"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { EventRecord, RegistrationRecord } from "@/lib/types";

type StudentDashboardProps = {
  studentName: string;
};

type CategoryFilter = "all" | "tech" | "non-tech";
type VisibilityFilter = "all" | "local" | "global";

export function StudentDashboard({ studentName }: StudentDashboardProps) {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [visibility, setVisibility] = useState<VisibilityFilter>("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const registrationSet = useMemo(
    () => new Set(registrations.map((registration) => registration.event_id)),
    [registrations],
  );

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (category !== "all" && event.category !== category) {
        return false;
      }

      if (visibility !== "all" && event.visibility !== visibility) {
        return false;
      }

      if (query.trim()) {
        const haystack = `${event.title} ${event.description} ${event.location}`.toLowerCase();
        if (!haystack.includes(query.trim().toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [category, events, query, visibility]);

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel("student-events")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => {
        void loadEvents();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "registrations" }, () => {
        void loadRegistrations();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  async function loadAll() {
    try {
      setLoading(true);
      setError("");
      await Promise.all([loadEvents(), loadRegistrations()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  async function loadEvents() {
    const response = await fetch("/api/events", { cache: "no-store" });
    const data = (await response.json()) as { events?: EventRecord[]; error?: string };

    if (!response.ok) {
      throw new Error(data.error ?? "Could not load events.");
    }

    setEvents(data.events ?? []);
  }

  async function loadRegistrations() {
    const response = await fetch("/api/registrations", { cache: "no-store" });
    const data = (await response.json()) as { registrations?: RegistrationRecord[]; error?: string };

    if (!response.ok) {
      throw new Error(data.error ?? "Could not load registrations.");
    }

    setRegistrations(data.registrations ?? []);
  }

  async function handleRegister(eventId: string) {
    try {
      setBusyId(eventId);
      setError("");

      const response = await fetch(`/api/events/${eventId}/register`, {
        method: "POST",
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not register.");
      }

      await loadRegistrations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not register.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="glass-card p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Student Dashboard</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-900">
          Welcome, {studentName}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Discover events, filter by type, and register with one click.
        </p>
      </section>

      <section className="glass-card grid gap-4 p-5 md:grid-cols-4">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search events"
          className="h-10 rounded-xl border border-slate-300 px-3 text-sm outline-none ring-sky-300 focus:ring-2 md:col-span-2"
        />
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value as CategoryFilter)}
          className="h-10 rounded-xl border border-slate-300 px-3 text-sm outline-none ring-sky-300 focus:ring-2"
        >
          <option value="all">All categories</option>
          <option value="tech">Tech</option>
          <option value="non-tech">Non-tech</option>
        </select>
        <select
          value={visibility}
          onChange={(event) => setVisibility(event.target.value as VisibilityFilter)}
          className="h-10 rounded-xl border border-slate-300 px-3 text-sm outline-none ring-sky-300 focus:ring-2"
        >
          <option value="all">All visibility</option>
          <option value="global">Global</option>
          <option value="local">Local</option>
        </select>
      </section>

      {error ? <p className="rounded-xl bg-rose-100 px-4 py-2 text-sm text-rose-700">{error}</p> : null}

      <section className="grid gap-4">
        {loading ? (
          <p className="glass-card p-6 text-sm text-slate-600">Loading events...</p>
        ) : filteredEvents.length === 0 ? (
          <p className="glass-card p-6 text-sm text-slate-600">No events match your filters.</p>
        ) : (
          filteredEvents.map((event) => {
            const alreadyRegistered = registrationSet.has(event.id);

            return (
              <article key={event.id} className="glass-card grid gap-3 p-5 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
                      {event.visibility}
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {event.category}
                    </span>
                    <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {event.colleges?.name ?? "Unknown College"}
                    </span>
                  </div>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">{event.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">{event.description}</p>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {new Date(event.start_at).toLocaleString()} • {event.location}
                  </p>
                </div>

                <div className="flex flex-col gap-2 md:items-end">
                  <Link
                    href={`/events/${event.id}`}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    View Details
                  </Link>
                  <button
                    type="button"
                    disabled={alreadyRegistered || busyId === event.id}
                    onClick={() => void handleRegister(event.id)}
                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-65"
                  >
                    {alreadyRegistered ? "Registered" : busyId === event.id ? "Registering..." : "Register"}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
