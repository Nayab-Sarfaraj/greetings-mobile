import { clerkMiddleware } from "@clerk/nextjs/server";
import {
  NextResponse,
  type NextRequest,
  type NextFetchEvent,
} from "next/server";
import { authEnabled, getAuthConfig } from "./server/lib/config";
import { NotFoundError } from "./server/lib/errors";
import { resultService } from "./server/modules/results/result.service";
import { shouldServeMarkdown } from "./lib/md/negotiate";

const EXCLUDED_EXACT_OR_PREFIX = [
  "/_next",
  "/api",
  "/.well-known",
  "/llms.txt",
  "/llms-full.txt",
  "/ai.txt",
  "/robots.txt",
  "/sitemap.xml",
];

const NEGOTIATION_ALLOWLIST = [
  "/",
  "/terms",
  "/privacy",
  "/support",
  "/create",
];

function isAllowlistedForNegotiation(pathname: string): boolean {
  return (
    NEGOTIATION_ALLOWLIST.includes(pathname) ||
    pathname.startsWith("/create/")
  );
}

function withDescribedBy<T extends Response>(response: T, origin: string): T {
  response.headers.set(
    "Link",
    `<${origin}/llms.txt>; rel="describedby", <${origin}/llms-full.txt>; rel="describedby", <${origin}/ai.txt>; rel="describedby"`,
  );
  return response;
}

export default async function proxy(
  request: NextRequest,
  event: NextFetchEvent,
) {
  const { pathname } = request.nextUrl;
  const origin = request.nextUrl.origin;

  const isExcluded = EXCLUDED_EXACT_OR_PREFIX.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  // 1. .md suffix rewrite
  if (!isExcluded && pathname.endsWith(".md")) {
    const clean = pathname.slice(0, -3).replace(/\/$/, "");
    const targetPath =
      clean === "" || clean === "/index" ? "/api/md" : `/api/md${clean}`;
    const url = request.nextUrl.clone();
    url.pathname = targetPath;
    return NextResponse.rewrite(url);
  }

  // 2. Content negotiation rewrite (Accept: text/markdown)
  if (!isExcluded && isAllowlistedForNegotiation(pathname)) {
    if (shouldServeMarkdown(request.headers.get("accept"))) {
      const url = request.nextUrl.clone();
      url.pathname = pathname === "/" ? "/api/md" : `/api/md${pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  const guestPath = /^\/i\/([^/]+)$/.exec(pathname);
  if (guestPath) {
    // Public guest invitation pages do not require Clerk authentication.
    // Full rate limiting and token validation are performed by the Server Component.
    return withDescribedBy(NextResponse.next(), origin);
  }

  const resultPath = /^\/c\/([^/]+)$/.exec(pathname);
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
      return withDescribedBy(response, origin);
    }
    return withDescribedBy(NextResponse.next(), origin);
  }

  if (!authEnabled()) {
    return withDescribedBy(NextResponse.next(), origin);
  }

  const clerkRes = await clerkMiddleware({
    publishableKey: getAuthConfig().publishableKey,
    secretKey: getAuthConfig().secretKey,
  })(request, event);

  if (clerkRes) {
    return withDescribedBy(clerkRes, origin);
  }

  return withDescribedBy(NextResponse.next(), origin);
}

export const config = {
  matcher: ["/((?!_next|.*\\.(?:png|jpg|jpeg|webp|svg|css|js|woff2|mp4)$).*)"],
};
