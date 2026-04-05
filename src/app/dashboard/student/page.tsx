import { requireRole } from "@/lib/auth";
import { StudentDashboard } from "@/components/student-dashboard";

export default async function StudentDashboardPage() {
  const { profile } = await requireRole(["student"]);
  return <StudentDashboard studentName={profile.full_name} />;
}
