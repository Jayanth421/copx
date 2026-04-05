"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { EventRecord, RegistrationRecord } from "@/lib/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type CollegeDashboardProps = {
  collegeName: string;
};

type CloudinarySignatureResponse = {
  cloudName: string;
  apiKey: string;
  folder: string;
  timestamp: number;
  signature: string;
};

const initialForm = {
  title: "",
  description: "",
  location: "",
  startAt: "",
  endAt: "",
  registrationDeadline: "",
  visibility: "local",
  category: "tech",
  capacity: "",
  posterUrl: "",
};

export function CollegeDashboard({ collegeName }: CollegeDashboardProps) {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [form, setForm] = useState(initialForm);
  const [busy, setBusy] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const registrationCountByEvent = useMemo(() => {
    const map = new Map<string, number>();

    registrations.forEach((registration) => {
      map.set(registration.event_id, (map.get(registration.event_id) ?? 0) + 1);
    });

    return map;
  }, [registrations]);

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel("college-events")
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
    await Promise.all([loadEvents(), loadRegistrations()]);
  }

  async function loadEvents() {
    const response = await fetch("/api/events?scope=mine", { cache: "no-store" });
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

  async function handlePosterUpload(file: File) {
    try {
      setUploadingPoster(true);
      setError("");
      setMessage("");

      const signatureResponse = await fetch("/api/uploads/cloudinary-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const signatureData = (await signatureResponse.json()) as
        | CloudinarySignatureResponse
        | { error: string };

      if (!signatureResponse.ok || !("signature" in signatureData)) {
        throw new Error(
          "error" in signatureData ? signatureData.error : "Could not sign upload.",
        );
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signatureData.apiKey);
      formData.append("timestamp", String(signatureData.timestamp));
      formData.append("signature", signatureData.signature);
      formData.append("folder", signatureData.folder);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      const uploadData = (await uploadResponse.json()) as {
        secure_url?: string;
        error?: { message?: string };
      };

      if (!uploadResponse.ok || !uploadData.secure_url) {
        throw new Error(uploadData.error?.message ?? "Poster upload failed.");
      }

      setForm((current) => ({ ...current, posterUrl: uploadData.secure_url ?? "" }));
      setMessage("Poster uploaded successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Poster upload failed.");
    } finally {
      setUploadingPoster(false);
    }
  }

  async function handleCreateEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setBusy(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          location: form.location,
          startAt: new Date(form.startAt).toISOString(),
          endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
          registrationDeadline: form.registrationDeadline
            ? new Date(form.registrationDeadline).toISOString()
            : null,
          visibility: form.visibility,
          category: form.category,
          posterUrl: form.posterUrl || null,
          capacity: form.capacity ? Number(form.capacity) : null,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not create event.");
      }

      setForm(initialForm);
      setMessage("Event created and sent for admin review.");
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create event.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="glass-card p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">College Dashboard</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-900">
          {collegeName}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Create events, upload posters to Cloudinary, and monitor registrations.
        </p>
      </section>

      <section className="glass-card p-5">
        <h2 className="text-xl font-semibold text-slate-900">Create Event</h2>
        <form onSubmit={handleCreateEvent} className="mt-4 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <input
              required
              placeholder="Event title"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none ring-sky-300 focus:ring-2"
            />
            <input
              required
              placeholder="Location"
              value={form.location}
              onChange={(event) =>
                setForm((current) => ({ ...current, location: event.target.value }))
              }
              className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none ring-sky-300 focus:ring-2"
            />
          </div>

          <textarea
            required
            rows={4}
            placeholder="Describe the event"
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-300 focus:ring-2"
          />

          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-1 text-sm">
              <span>Start</span>
              <input
                required
                type="datetime-local"
                value={form.startAt}
                onChange={(event) =>
                  setForm((current) => ({ ...current, startAt: event.target.value }))
                }
                className="h-11 rounded-xl border border-slate-300 px-3 outline-none ring-sky-300 focus:ring-2"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>End</span>
              <input
                type="datetime-local"
                value={form.endAt}
                onChange={(event) => setForm((current) => ({ ...current, endAt: event.target.value }))}
                className="h-11 rounded-xl border border-slate-300 px-3 outline-none ring-sky-300 focus:ring-2"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Registration Deadline</span>
              <input
                type="datetime-local"
                value={form.registrationDeadline}
                onChange={(event) =>
                  setForm((current) => ({ ...current, registrationDeadline: event.target.value }))
                }
                className="h-11 rounded-xl border border-slate-300 px-3 outline-none ring-sky-300 focus:ring-2"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <select
              value={form.visibility}
              onChange={(event) =>
                setForm((current) => ({ ...current, visibility: event.target.value }))
              }
              className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none ring-sky-300 focus:ring-2"
            >
              <option value="local">Local</option>
              <option value="global">Global</option>
            </select>
            <select
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none ring-sky-300 focus:ring-2"
            >
              <option value="tech">Tech</option>
              <option value="non-tech">Non-tech</option>
            </select>
            <input
              type="number"
              min={1}
              placeholder="Capacity"
              value={form.capacity}
              onChange={(event) => setForm((current) => ({ ...current, capacity: event.target.value }))}
              className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none ring-sky-300 focus:ring-2"
            />
            <input
              placeholder="Poster URL (optional)"
              value={form.posterUrl}
              onChange={(event) => setForm((current) => ({ ...current, posterUrl: event.target.value }))}
              className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none ring-sky-300 focus:ring-2"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void handlePosterUpload(file);
                  }
                }}
              />
              {uploadingPoster ? "Uploading poster..." : "Upload Poster"}
            </label>

            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-65"
            >
              {busy ? "Saving..." : "Create Event"}
            </button>
          </div>
        </form>
      </section>

      {message ? (
        <p className="rounded-xl bg-emerald-100 px-4 py-2 text-sm text-emerald-800">{message}</p>
      ) : null}
      {error ? <p className="rounded-xl bg-rose-100 px-4 py-2 text-sm text-rose-700">{error}</p> : null}

      <section className="grid gap-4">
        {events.map((event) => (
          <article key={event.id} className="glass-card grid gap-2 p-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{event.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{event.description}</p>
              <p className="mt-2 text-sm text-slate-700">
                {new Date(event.start_at).toLocaleString()} • {event.location}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {event.visibility} • {event.category} • status: {event.status}
              </p>
            </div>
            <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
              Registrations: {registrationCountByEvent.get(event.id) ?? 0}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
