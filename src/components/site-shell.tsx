import Link from "next/link";
import type { ReactNode } from "react";
import { getCurrentAuthContext } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";

export async function SiteShell({ children }: { children: ReactNode }) {
  const authContext = await getCurrentAuthContext();
  const role = authContext.profile?.role;

  return (
    <div className="app-chrome text-slate-900">
      <header className="sticky top-0 z-40 px-3 pt-3 md:px-5 md:pt-5">
        <div className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-900/10 bg-white/72 shadow-[0_16px_40px_rgba(14,18,35,0.14)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 px-3 py-2.5 md:px-5 md:py-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl px-1 py-1 transition hover:bg-white/70"
            >
              <span className="animate-glow inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#d3ff28] text-sm font-black text-slate-900">
                C
              </span>
              <span className="font-display text-xl font-semibold tracking-tight text-slate-900">
                COPX
              </span>
            </Link>

            <nav className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/events"
                className="rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-900/10"
              >
                Events
              </Link>

              {authContext.user && role ? (
                <>
                  <Link
                    href="/dashboard"
                    className="rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-900/10"
                  >
                    Dashboard
                  </Link>
                  <span className="hidden rounded-full border border-slate-900/15 bg-[#d3ff28] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.11em] text-slate-900 sm:inline-flex">
                    {role}
                  </span>
                  <SignOutButton />
                </>
              ) : (
                <>
                  <Link
                    href="/auth/sign-in"
                    className="rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-900/10"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/student-sign-up"
                    className="rounded-xl bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    Student Sign Up
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-12 pt-8 md:px-6 md:pb-16 md:pt-10">
        {children}
      </main>
    </div>
  );
}
