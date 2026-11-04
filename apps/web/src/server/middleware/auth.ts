import { accountRepository } from "../modules/accounts/account.repository";
import { auth } from "@clerk/nextjs/server";
import { AppError } from "../lib/errors";
import { getAuthConfig, authEnabled } from "../lib/config";
export async function requireUser() {
  if (!authEnabled())
    throw new AppError("UNAVAILABLE", "Saving is temporarily unavailable", 503);
  getAuthConfig();
  const { userId } = await auth();
  if (!userId)
    throw new AppError("UNAUTHENTICATED", "Sign in to continue", 401);
  await accountRepository.upsert(userId);
  return userId;
}
