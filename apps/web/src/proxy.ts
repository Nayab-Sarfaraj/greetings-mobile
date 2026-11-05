import { clerkMiddleware } from "@clerk/nextjs/server";
import {
  NextResponse,
  type NextRequest,
  type NextFetchEvent,
} from "next/server";
import { authEnabled, getAuthConfig } from "./server/lib/config";
import { NotFoundError } from "./server/lib/errors";
import { resultService } from "./server/modules/results/result.service";
export default async function proxy(
  request: NextRequest,
  event: NextFetchEvent,
) {
  const guestPath = /^\/i\/([^/]+)$/.exec(request.nextUrl.pathname);
  if (guestPath) {
    // Public guest invitation pages do not require Clerk authentication.
    // Full rate limiting and token validation are performed by the Server Component.
    return NextResponse.next();
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
