"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { EventRecord, Profile } from "@/lib/types";

type MeResponse = {
  profile: Profile | null;
};

type CategoryFilter = "all" | "tech" | "non-tech";
type VisibilityFilter = "all" | "local" | "global";

export function EventsExplorer() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [visibility, setVisibility] = useState<VisibilityFilter>("all");

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [eventsResponse, meResponse] = await Promise.all([
        fetch("/api/events", { cache: "no-store" }),
        fetch("/api/me", { cache: "no-store" }),
      ]);

      const eventsPayload = (await eventsResponse.json()) as { events?: EventRecord[]; error?: string };
      const mePayload = (await meResponse.json()) as MeResponse;

      if (!eventsResponse.ok) {
        throw new Error(eventsPayload.error ?? "Could not load events.");
      }

      setEvents(eventsPayload.events ?? []);
      setProfile(mePayload.profile ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load events.");
    } finally {
      setLoading(false);
    }
  }

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

  return (
    <div className="space-y-6">
      <section className="glass-card p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Event Discovery</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-900">
          Explore College Events
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Find local and global events from participating colleges.
        </p>
      </section>

      <section className="glass-card grid gap-4 p-5 md:grid-cols-4">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search events"
          className="ui-input h-10 md:col-span-2"
        />
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value as CategoryFilter)}
          className="ui-select h-10"
        >
          <option value="all">All categories</option>
          <option value="tech">Tech</option>
          <option value="non-tech">Non-tech</option>
        </select>
        <select
          value={visibility}
          onChange={(event) => setVisibility(event.target.value as VisibilityFilter)}
          className="ui-select h-10"
        >
          <option value="all">All visibility</option>
          <option value="local">Local</option>
          <option value="global">Global</option>
        </select>
      </section>

      {error ? <p className="ui-msg-error">{error}</p> : null}

      <section className="grid gap-4">
        {loading ? (
          <p className="glass-card p-6 text-sm text-slate-600">Loading events...</p>
        ) : filteredEvents.length === 0 ? (
          <p className="glass-card p-6 text-sm text-slate-600">No events found.</p>
        ) : (
          filteredEvents.map((event) => (
            <article key={event.id} className="glass-card grid gap-3 p-5 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">
                    {event.visibility}
                  </span>
                  <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
                    {event.category}
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    {event.colleges?.name}
                  </span>
                </div>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">{event.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{event.description}</p>
                <p className="mt-2 text-sm text-slate-700">
                  {new Date(event.start_at).toLocaleString()} | {event.location}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/events/${event.id}`}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Details
                </Link>
                {profile?.role === "student" ? (
                  <Link
                    href={`/events/${event.id}`}
                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    Register
                  </Link>
                ) : null}
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

