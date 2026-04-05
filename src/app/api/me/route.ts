import { apiOk } from "@/lib/http";
import { getCurrentAuthContext } from "@/lib/auth";

export async function GET() {
  const context = await getCurrentAuthContext();
  return apiOk(context);
}
