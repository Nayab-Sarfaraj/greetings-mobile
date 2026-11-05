import { clerkMiddleware } from "@clerk/nextjs/server";
import {
  NextResponse,
  type NextRequest,
  type NextFetchEvent,
} from "next/server";
import { authEnabled, getAuthConfig } from "./server/lib/config";
import { NotFoundError } from "./server/lib/errors";
import { resultService } from "./server/modules/results/result.service";
import { guestService } from "./server/modules/guests/guest.service";
export default async function proxy(
  request: NextRequest,
  event: NextFetchEvent,
) {
  const guestPath = /^\/i\/([^/]+)$/.exec(request.nextUrl.pathname);
  if (guestPath) {
    try {
      await guestService.public(
        guestPath[1],
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          request.headers.get("x-real-ip")?.trim() ||
          "unidentified",
      );
      return NextResponse.next();
    } catch (error) {
      if (error instanceof NotFoundError) {
        const url = request.nextUrl.clone();
        url.pathname = "/i-not-found";
        const response = NextResponse.rewrite(url, { status: 404 });
        response.headers.set("Cache-Control", "no-store");
        return response;
      }
    }
  }
  const resultPath = /^\/c\/([^/]+)$/.exec(request.nextUrl.pathname);
  if (resultPath) {
    let ready = false;
    let status = 200;
    try {
      ready = (await resultService.get(resultPath[1])).status === "ready";
    } catch (error) {
      status = error instanceof NotFoundError ? 404 : 500;
    }
    if (!ready) {
      const url = request.nextUrl.clone();
      url.pathname = `/c-live/${resultPath[1]}`;
      const response = NextResponse.rewrite(url, { status });
      response.headers.set("Cache-Control", "no-store");
      return response;
    }
    return NextResponse.next();
  }
  if (!authEnabled()) return NextResponse.next();
  return clerkMiddleware({
    publishableKey: getAuthConfig().publishableKey,
    secretKey: getAuthConfig().secretKey,
  })(request, event);
}
export const config = {
  matcher: ["/((?!_next|.*\\.(?:png|jpg|jpeg|webp|svg|css|js|woff2|mp4)$).*)"],
};
