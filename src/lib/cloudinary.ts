import crypto from "node:crypto";
import { requireEnv } from "@/lib/env";

type SignatureParams = Record<string, string | number | undefined | null>;

function serializeForSignature(params: SignatureParams) {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

type CloudinaryCredentials = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

function parseCloudinaryUrl(url: string): CloudinaryCredentials {
  const cleaned = url.trim();
  const parsed = /^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/.exec(cleaned);

  if (!parsed) {
    throw new Error(
      "Invalid CLOUDINARY_URL. Expected format: cloudinary://<api_key>:<api_secret>@<cloud_name>",
    );
  }

  const [, rawApiKey, rawApiSecret, rawCloudName] = parsed;

  return {
    cloudName: decodeURIComponent(rawCloudName),
    apiKey: decodeURIComponent(rawApiKey),
    apiSecret: decodeURIComponent(rawApiSecret),
  };
}

function getCloudinaryCredentials() {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;

  if (cloudinaryUrl) {
    return parseCloudinaryUrl(cloudinaryUrl);
  }

  return {
    cloudName: requireEnv("CLOUDINARY_CLOUD_NAME"),
    apiKey: requireEnv("CLOUDINARY_API_KEY"),
    apiSecret: requireEnv("CLOUDINARY_API_SECRET"),
  };
}

export function createCloudinarySignature(params: SignatureParams) {
  const payload = serializeForSignature(params);
  const { apiSecret } = getCloudinaryCredentials();

  return crypto.createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
}

export function getCloudinaryPublicConfig() {
  const { cloudName, apiKey } = getCloudinaryCredentials();

  return {
    cloudName,
    apiKey,
    folder: process.env.CLOUDINARY_UPLOAD_FOLDER ?? "copx/events",
  };
}
