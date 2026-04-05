"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { EventRecord, Profile, RegistrationRecord } from "@/lib/types";

type EventDetailProps = {
  eventId: string;
};

type EventResponse = {
  event?: EventRecord;
  error?: string;
};

type MeResponse = {
  profile: Profile | null;
};

export function EventDetail({ eventId }: EventDetailProps) {
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isRegistered = useMemo(
    () => registrations.some((registration) => registration.event_id === eventId),
    [eventId, registrations],
  );

  useEffect(() => {
    void loadData();
  }, [eventId]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [eventResponse, meResponse, registrationsResponse] = await Promise.all([
        fetch(`/api/events/${eventId}`, { cache: "no-store" }),
        fetch("/api/me", { cache: "no-store" }),
        fetch("/api/registrations", { cache: "no-store" }),
      ]);

      const eventPayload = (await eventResponse.json()) as EventResponse;
      const mePayload = (await meResponse.json()) as MeResponse;
      const registrationPayload = (await registrationsResponse.json()) as {
        registrations?: RegistrationRecord[];
      };

      if (!eventResponse.ok || !eventPayload.event) {
        throw new Error(eventPayload.error ?? "Could not load event.");
      }

      setEvent(eventPayload.event);
      setProfile(mePayload.profile ?? null);
      setRegistrations(registrationPayload.registrations ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load event details.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    try {
      setBusy(true);
      setError("");
      setMessage("");

      const response = await fetch(`/api/events/${eventId}/register`, { method: "POST" });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not register.");
      }

      setMessage("Registration successful. Confirmation email sent.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not register.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="glass-card p-6 text-sm text-slate-600">Loading event details...</p>;
  }

  if (!event) {
    return <p className="glass-card p-6 text-sm text-slate-600">Event not found.</p>;
  }

  return (
    <article className="glass-card overflow-hidden">
      {event.poster_url ? (
        <div className="relative h-64 w-full bg-slate-200">
          <Image src={event.poster_url} alt={event.title} fill className="object-cover" />
        </div>
      ) : null}

      <div className="space-y-4 p-6">
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
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            {event.status}
          </span>
        </div>

        <h1 className="font-display text-4xl font-semibold tracking-tight text-slate-900">
          {event.title}
        </h1>

        <p className="text-slate-700">{event.description}</p>

        <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
          <p>
            <strong>Starts:</strong> {new Date(event.start_at).toLocaleString()}
          </p>
          <p>
            <strong>Ends:</strong>{" "}
            {event.end_at ? new Date(event.end_at).toLocaleString() : "Not specified"}
          </p>
          <p>
            <strong>Location:</strong> {event.location}
          </p>
          <p>
            <strong>Deadline:</strong>{" "}
            {event.registration_deadline
              ? new Date(event.registration_deadline).toLocaleString()
              : "No deadline"}
          </p>
          <p>
            <strong>Capacity:</strong> {event.capacity ?? "Open"}
          </p>
        </div>

        {profile?.role === "student" ? (
          <button
            type="button"
            disabled={busy || isRegistered || event.status !== "published"}
            onClick={() => void handleRegister()}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-65"
          >
            {isRegistered ? "Already Registered" : busy ? "Registering..." : "Register for Event"}
          </button>
        ) : null}

        {message ? (
          <p className="rounded-xl bg-emerald-100 px-4 py-2 text-sm text-emerald-800">{message}</p>
        ) : null}
        {error ? <p className="rounded-xl bg-rose-100 px-4 py-2 text-sm text-rose-700">{error}</p> : null}
      </div>
    </article>
  );
}
