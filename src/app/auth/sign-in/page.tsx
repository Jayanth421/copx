import { redirect } from "next/navigation";
import { SignInForm } from "@/components/sign-in-form";
import { dashboardPathForRole, getCurrentAuthContext } from "@/lib/auth";

export default async function SignInPage() {
  const authContext = await getCurrentAuthContext();

  if (authContext.profile) {
    redirect(dashboardPathForRole(authContext.profile.role));
  }

  return <SignInForm />;
}
