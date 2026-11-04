import { clerkMiddleware } from "@clerk/nextjs/server";
import {
  NextResponse,
  type NextRequest,
  type NextFetchEvent,
} from "next/server";
import { authEnabled, getAuthConfig } from "./server/lib/config";
export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (!authEnabled()) return NextResponse.next();
  return clerkMiddleware({
    publishableKey: getAuthConfig().publishableKey,
    secretKey: getAuthConfig().secretKey,
  })(request, event);
}
export const config = {
  matcher: ["/((?!_next|.*\\.(?:png|jpg|jpeg|webp|svg|css|js|woff2|mp4)$).*)"],
};
