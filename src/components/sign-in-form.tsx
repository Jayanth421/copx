"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      const supabase = getSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card mx-auto grid w-full max-w-md gap-4 p-6 md:p-7">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Welcome Back</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-slate-900">
          Sign in to COPX
        </h1>
        <p className="mt-1 text-sm text-slate-700">
          Students can self-register. College and admin accounts are created by admin.
        </p>
      </div>

      <label className="grid gap-1 text-sm">
        <span className="font-medium text-slate-700">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="ui-input"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium text-slate-700">Password</span>
        <input
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="ui-input"
        />
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="ui-primary-btn disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? "Signing in..." : "Sign In"}
      </button>

      {error ? <p className="ui-msg-error">{error}</p> : null}

      <p className="text-sm text-slate-700">
        New student?{" "}
        <Link href="/auth/student-sign-up" className="font-semibold text-slate-900 hover:underline">
          Create account
        </Link>
      </p>
    </form>
  );
}
