import { redirect } from "next/navigation";
import { dashboardPathForRole, getCurrentAuthContext } from "@/lib/auth";

export default async function DashboardRouterPage() {
  const authContext = await getCurrentAuthContext();

  if (!authContext.profile) {
    redirect("/auth/sign-in");
  }

  redirect(dashboardPathForRole(authContext.profile.role));
}
