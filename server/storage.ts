/**
 * server/storage.ts
 * File storage helpers — uses Cloudinary when CLOUDINARY_CLOUD_NAME is set,
 * otherwise falls back gracefully (backup/upload features are disabled).
 *
 * Required env vars for Cloudinary:
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 */

import crypto from "crypto";

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  return { cloudName, apiKey, apiSecret };
}

function isCloudinaryConfigured(): boolean {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  return !!(cloudName && apiKey && apiSecret);
}

/**
 * Upload a file to Cloudinary.
 * relKey is used as the public_id (slashes become folder separators).
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  if (!isCloudinaryConfigured()) {
    console.warn("[Storage] Cloudinary not configured — skipping upload for:", relKey);
    return { key: relKey, url: "" };
  }

  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const key = relKey.replace(/^\/+/, "");
  const publicId = key.replace(/\.[^.]+$/, ""); // strip extension for public_id

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const resourceType = contentType.startsWith("image/") ? "image" : "raw";

  // Build signature
  const signatureStr = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(signatureStr).digest("hex");

  const formData = new FormData();
  const blobData: BlobPart = typeof data === "string" ? data : Buffer.from(data as Uint8Array);
  const blob = new Blob([blobData], { type: contentType });

  formData.append("file", blob, key.split("/").pop() ?? key);
  formData.append("public_id", publicId);
  formData.append("timestamp", timestamp);
  formData.append("api_key", apiKey!);
  formData.append("signature", signature);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
  const response = await fetch(uploadUrl, { method: "POST", body: formData });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`Cloudinary upload failed (${response.status}): ${message}`);
  }

  const result = await response.json() as { secure_url: string; public_id: string };
  return { key: result.public_id, url: result.secure_url };
}

/**
 * Get a URL for a previously uploaded file.
 */
export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  if (!isCloudinaryConfigured()) {
    console.warn("[Storage] Cloudinary not configured — cannot retrieve:", relKey);
    return { key: relKey, url: "" };
  }

  const { cloudName } = getCloudinaryConfig();
  const key = relKey.replace(/^\/+/, "");
  const publicId = key.replace(/\.[^.]+$/, "");
  const url = `https://res.cloudinary.com/${cloudName}/raw/upload/${publicId}`;
  return { key, url };
}
