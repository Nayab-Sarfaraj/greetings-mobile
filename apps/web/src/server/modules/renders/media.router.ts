import { readMedia } from "../../integrations/local-storage.client";
export async function get(
  request: Request,
  context: { params: Promise<{ key: string[] }> },
) {
  try {
    const key = (await context.params).key.join("/");
    const bytes = await readMedia(key);
    const headers: Record<string, string> = {
      "Content-Type": key.endsWith(".mp4")
        ? "video/mp4"
        : key.endsWith(".png")
          ? "image/png"
          : "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Accept-Ranges": "bytes",
    };
    if (new URL(request.url).searchParams.has("download")) {
      const sp = new URL(request.url).searchParams;
      const raw = sp.get("filename") ?? "seasonal-card.mp4";
      // Allow only safe filename characters to prevent header injection.
      const filename = raw.replace(/[^a-z0-9._-]/gi, "-").slice(0, 64);
      headers["Content-Disposition"] = `attachment; filename="${filename}"`;
    }
    const range = request.headers.get("range");
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match || (!match[1] && !match[2]))
        return new Response(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${bytes.length}` },
        });
      const start = match[1]
        ? Number(match[1])
        : Math.max(0, bytes.length - Number(match[2]));
      const end = match[1]
        ? match[2]
          ? Math.min(Number(match[2]), bytes.length - 1)
          : bytes.length - 1
        : bytes.length - 1;
      if (
        !Number.isSafeInteger(start) ||
        !Number.isSafeInteger(end) ||
        start > end ||
        start >= bytes.length
      )
        return new Response(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${bytes.length}` },
        });
      return new Response(new Uint8Array(bytes.subarray(start, end + 1)), {
        status: 206,
        headers: {
          ...headers,
          "Content-Range": `bytes ${start}-${end}/${bytes.length}`,
          "Content-Length": String(end - start + 1),
        },
      });
    }
    return new Response(new Uint8Array(bytes), {
      headers: { ...headers, "Content-Length": String(bytes.length) },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
