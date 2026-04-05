import { requireRole } from "@/lib/auth";
import { CollegeDashboard } from "@/components/college-dashboard";

export default async function CollegeDashboardPage() {
  const { profile } = await requireRole(["college"]);

  return <CollegeDashboard collegeName={profile.colleges?.name ?? "College"} />;
}
