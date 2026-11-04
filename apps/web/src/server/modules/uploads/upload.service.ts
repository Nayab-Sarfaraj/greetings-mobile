import { randomUUID, createHash } from "node:crypto";
import sharp from "sharp";
import { ownerPrefix, putMedia } from "../../integrations/local-storage.client";
import { ValidationError } from "../../lib/errors";
import { rateLimit } from "../../lib/rate-limit";
export async function uploadPhoto(owner: string, file: File, ip?: string) {
  await rateLimit(`upload:${owner}`, 30);
  if (ip)
    await rateLimit(
      `upload-ip:${createHash("sha256").update(ip).digest("hex")}`,
      90,
    );
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 8 * 1024 * 1024
  )
    throw new ValidationError(
      "Choose a JPEG, PNG, or WebP photo smaller than 8 MB",
    );
  let bytes: Buffer;
  try {
    const source = sharp(Buffer.from(await file.arrayBuffer()), {
      limitInputPixels: 40000000,
    });
    const metadata = await source.metadata();
    if (!["jpeg", "png", "webp"].includes(metadata.format ?? ""))
      throw new Error("Unsupported photo");
    bytes = await source
      .rotate()
      .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
  } catch {
    throw new ValidationError("This photo could not be opened");
  }
  return {
    url: await putMedia(
      `photos/${ownerPrefix(owner)}/${randomUUID()}.jpg`,
      bytes,
    ),
  };
}
