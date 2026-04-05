import { requireRole } from "@/lib/auth";
import { AdminDashboard } from "@/components/admin-dashboard";

export default async function AdminDashboardPage() {
  await requireRole(["admin"]);
  return <AdminDashboard />;
}
