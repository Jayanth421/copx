"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type CollegeOption = {
  id: string;
  name: string;
  code: string;
  group_code: string;
};

export function StudentSignUpForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [otp, setOtp] = useState("");
  const [loadingColleges, setLoadingColleges] = useState(true);
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [colleges, setColleges] = useState<CollegeOption[]>([]);

  useEffect(() => {
    void loadColleges();
  }, []);

  async function loadColleges() {
    try {
      setLoadingColleges(true);
      const response = await fetch("/api/colleges", { cache: "no-store" });
      const data = (await response.json()) as { colleges?: CollegeOption[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not load colleges.");
      }

      setColleges(data.colleges ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load colleges.");
    } finally {
      setLoadingColleges(false);
    }
  }

  async function handleRequestOtp() {
    try {
      setRequestingOtp(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Could not send OTP.");
      }

      setMessage("OTP sent to your email via SMTP.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not request OTP.");
    } finally {
      setRequestingOtp(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/auth/student-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          password,
          collegeId,
          otp,
        }),
      });

      const data = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Could not register student.");
      }

      const supabase = getSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      router.push("/dashboard/student");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card mx-auto grid w-full max-w-2xl gap-4 p-6 md:p-7">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Student Onboarding</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-slate-900">
          Student Sign Up
        </h1>
        <p className="mt-1 text-sm text-slate-700">
          Self-registration is available only for students. Verify your email using OTP.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700">Full Name</span>
          <input
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="ui-input"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700">College</span>
          <select
            required
            value={collegeId}
            onChange={(event) => setCollegeId(event.target.value)}
            className="ui-select"
          >
            <option value="">
              {loadingColleges ? "Loading colleges..." : "Select your college"}
            </option>
            {colleges.map((college) => (
              <option key={college.id} value={college.id}>
                {college.name} ({college.code}) - {college.group_code}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="ui-input"
          />
        </label>

        <button
          type="button"
          onClick={() => void handleRequestOtp()}
          disabled={requestingOtp || !email}
          className="ui-secondary-btn mt-auto disabled:cursor-not-allowed disabled:opacity-70"
        >
          {requestingOtp ? "Sending..." : "Send OTP"}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700">OTP</span>
          <input
            required
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
            className="ui-input"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700">Password</span>
          <input
            required
            type="password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="ui-input"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="ui-primary-btn disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? "Creating Account..." : "Create Student Account"}
      </button>

      {message ? <p className="ui-msg-success">{message}</p> : null}
      {error ? <p className="ui-msg-error">{error}</p> : null}
    </form>
  );
}
