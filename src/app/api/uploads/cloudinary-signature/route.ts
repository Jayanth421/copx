import { apiError, apiOk } from "@/lib/http";
import { getCurrentAuthContext } from "@/lib/auth";
import { createCloudinarySignature, getCloudinaryPublicConfig } from "@/lib/cloudinary";

export async function POST(request: Request) {
  const authContext = await getCurrentAuthContext();

  if (!authContext.profile || !["admin", "college"].includes(authContext.profile.role)) {
    return apiError("Forbidden", 403);
  }

  let body: unknown = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const folderOverride = (body as { folder?: string }).folder;
  const { cloudName, apiKey, folder } = getCloudinaryPublicConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const activeFolder = folderOverride || folder;

  const signature = createCloudinarySignature({
    timestamp,
    folder: activeFolder,
  });

  return apiOk({
    cloudName,
    apiKey,
    folder: activeFolder,
    timestamp,
    signature,
  });
}
