import { ValidationError } from "./errors";
export async function readUploadForm(request: Request) {
  const limit = 9 * 1024 * 1024;
  if (Number(request.headers.get("content-length") ?? 0) > limit)
    throw new ValidationError("Photo is too large");
  const reader = request.body?.getReader();
  if (!reader) throw new ValidationError("Choose a photo");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) {
        await reader.cancel();
        throw new ValidationError("Photo is too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    return await new Response(body, {
      headers: { "Content-Type": request.headers.get("content-type") ?? "" },
    }).formData();
  } catch {
    throw new ValidationError("Choose a valid photo upload");
  }
}
