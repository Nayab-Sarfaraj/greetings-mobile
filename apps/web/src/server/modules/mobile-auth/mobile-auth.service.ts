import { clerkClient } from "@clerk/nextjs/server";
import { AppError } from "../../lib/errors";

const MOBILE_TICKET_TTL_SECONDS = 120;

export async function createMobileSignInTicket(userId: string) {
  try {
    const client = await clerkClient();
    const ticket = await client.signInTokens.createSignInToken({
      userId,
      expiresInSeconds: MOBILE_TICKET_TTL_SECONDS,
    });
    return {
      ticket: ticket.token,
      expiresInSeconds: MOBILE_TICKET_TTL_SECONDS,
    };
  } catch {
    throw new AppError(
      "UNAVAILABLE",
      "Mobile sign-in is temporarily unavailable",
      503,
    );
  }
}
