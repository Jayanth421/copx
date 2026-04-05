import Link from "next/link";

const highlights = [
  {
    title: "Discover Across Campuses",
    tag: "01",
    description:
      "Browse events from multiple colleges with local and global visibility controls.",
  },
  {
    title: "Role-Based Workflows",
    tag: "02",
    description:
      "Admins manage governance, colleges publish events, and students register safely.",
  },
  {
    title: "Realtime + Automation",
    tag: "03",
    description:
      "Supabase real-time updates, Cloudinary media delivery, and SMTP notifications.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-6 md:space-y-9">
      <section className="glass-card animate-fade-up relative p-6 md:p-9">
        <div className="pointer-events-none absolute -right-16 -top-16 h-60 w-60 rounded-full bg-[radial-gradient(circle,#d3ff28_0%,rgba(211,255,40,0)_68%)]" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-[radial-gradient(circle,#43c7ff_0%,rgba(67,199,255,0)_72%)]" />

        <div className="relative grid gap-7 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-700">
              College Event Platform
            </p>
            <h1 className="font-display text-4xl font-semibold leading-[1.03] tracking-tight text-slate-900 md:text-6xl">
              Campus social energy, organized.
            </h1>
            <p className="max-w-2xl text-base text-slate-700 md:text-lg">
              COPX brings college events, registrations, approvals, and notifications into one
              clean experience for students, admins, and campus organizers.
            </p>
            <div className="flex flex-wrap gap-2.5 pt-1">
              <Link
                href="/events"
                className="ui-primary-btn inline-flex items-center justify-center px-5"
              >
                Explore Events
              </Link>
              <Link
                href="/auth/student-sign-up"
                className="ui-secondary-btn inline-flex items-center justify-center px-5"
              >
                Student Sign Up
              </Link>
            </div>
          </div>

          <div className="grid gap-3 text-sm md:grid-cols-3 lg:grid-cols-1">
            <article className="rounded-2xl border border-slate-900/10 bg-white p-4 shadow-[0_10px_24px_rgba(14,18,35,0.11)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Stack
              </p>
              <p className="mt-1.5 text-[15px] font-semibold text-slate-900">
                Next.js + Supabase + Cloudinary
              </p>
            </article>
            <article className="rounded-2xl border border-slate-900/10 bg-[#121625] p-4 text-white shadow-[0_12px_26px_rgba(14,18,35,0.3)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                Access
              </p>
              <p className="mt-1.5 text-[15px] font-semibold">Admin, College, Student</p>
            </article>
            <article className="rounded-2xl border border-slate-900/10 bg-[#d3ff28] p-4 shadow-[0_12px_26px_rgba(138,170,0,0.25)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-900/70">
                Reach
              </p>
              <p className="mt-1.5 text-[15px] font-semibold text-slate-900">
                Local Groups + Global Feed
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {highlights.map((item) => (
          <article key={item.title} className="glass-card animate-fade-up p-5">
            <div className="inline-flex rounded-full border border-slate-900/10 bg-white px-2.5 py-1 text-[11px] font-bold tracking-[0.14em] text-slate-500">
              STEP {item.tag}
            </div>
            <h2 className="mt-3 text-xl font-semibold text-slate-900">{item.title}</h2>
            <p className="mt-1.5 text-sm text-slate-700">{item.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
