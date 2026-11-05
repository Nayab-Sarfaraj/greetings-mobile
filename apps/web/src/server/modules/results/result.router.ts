import { resultService } from "./result.service";
import { errorResponse, AppError } from "../../lib/errors";
export const resultCache = (status: string) =>
  status === "ready"
    ? "public, max-age=0, s-maxage=60, stale-while-revalidate=30"
    : "no-store";
type Context = { params: Promise<{ id: string }> };
export async function get(_request: Request, context: Context) {
  try {
    const result = await resultService.get((await context.params).id);
    return Response.json(result, {
      headers: {
        "Cache-Control": resultCache(result.status),
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch (error) {
    const response = errorResponse(error);
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("X-Robots-Tag", "noindex");
    return response;
  }
}
export async function download(_request: Request, context: Context) {
  try {
    const result = await resultService.get((await context.params).id);
    if (result.status !== "ready" || !result.videoUrl)
      throw new AppError(
        "NOT_READY",
        "This video is not ready to download",
        409,
      );
    const target = new URL(result.videoUrl);
    target.searchParams.set("download", "1");
    target.searchParams.set("filename", `${result.theme}-${result.type}.mp4`);
    return new Response(null, {
      status: 302,
      headers: {
        Location: target.toString(),
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
