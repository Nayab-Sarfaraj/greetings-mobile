import { createHash } from "node:crypto";
import path from "node:path";
import { mkdir, writeFile, readFile, unlink, access } from "node:fs/promises";
import { localRenderConfig } from "../lib/config";
export function ownerPrefix(owner: string) {
  return createHash("sha256").update(owner).digest("hex");
}
export function mediaPath(key: string) {
  if (!/^(photos|renders)\/[a-f0-9-]+\/[a-f0-9-]+\.(jpg|png|mp4)$/.test(key))
    throw new Error("Invalid media key");
  return path.join(path.resolve(localRenderConfig().root), key);
}
export function mediaUrl(key: string) {
  return `${localRenderConfig().appUrl}/api/media/${key}`;
}
export async function putMedia(key: string, bytes: Buffer) {
  const file = mediaPath(key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, bytes);
  return mediaUrl(key);
}
export async function readMedia(key: string) {
  return readFile(mediaPath(key));
}
export async function assertOwnedPhoto(url: string, owner: string) {
  const parsed = new URL(url);
  const base = new URL(localRenderConfig().appUrl);
  if (
    parsed.origin !== base.origin ||
    !parsed.pathname.startsWith(`/api/media/photos/${ownerPrefix(owner)}/`) ||
    !/^[a-f0-9-]+\.jpg$/.test(parsed.pathname.split("/").at(-1) ?? "")
  )
    throw new Error("Choose a photo uploaded by this account");
  await access(mediaPath(parsed.pathname.slice("/api/media/".length)));
}

export async function removeMedia(key: string) {
  await unlink(mediaPath(key)).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
  });
}
