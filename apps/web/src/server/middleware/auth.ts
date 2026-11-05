import { cookies } from "next/headers";
import { accountRepository } from "../modules/accounts/account.repository";
import { auth } from "@clerk/nextjs/server";
import { AppError } from "../lib/errors";
import { getAuthConfig, authEnabled } from "../lib/config";

export async function requireUser(): Promise<string> {
  if (authEnabled()) {
    getAuthConfig();
    const { userId } = await auth();
    if (!userId)
      throw new AppError("UNAUTHENTICATED", "Sign in to continue", 401);
    await accountRepository.upsert(userId);
    return userId;
  }

  if (process.env.NODE_ENV !== "production") {
    let devStatus: string | undefined;
    try {
      const cookieStore = await cookies();
      devStatus = cookieStore.get("dev_user_id")?.value;
    } catch {
      // Fallback if called outside request context
    }

    if (devStatus === "signed_out") {
      throw new AppError("UNAUTHENTICATED", "Sign in to continue", 401);
    }

    const devUserId = devStatus || "dev_local_user";
    await accountRepository.upsert(devUserId);
    return devUserId;
  }

  throw new AppError("UNAVAILABLE", "Saving is temporarily unavailable", 503);
}
