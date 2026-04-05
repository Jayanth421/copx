import { redirect } from "next/navigation";
import { StudentSignUpForm } from "@/components/student-sign-up-form";
import { dashboardPathForRole, getCurrentAuthContext } from "@/lib/auth";

export default async function StudentSignUpPage() {
  const authContext = await getCurrentAuthContext();

  if (authContext.profile) {
    redirect(dashboardPathForRole(authContext.profile.role));
  }

  return <StudentSignUpForm />;
}
