import { clerkClient } from "@clerk/nextjs/server";
import { requireUser } from "../../middleware/auth";
import { errorResponse } from "../../lib/errors";
import { purgeAccount } from "./account.service";
export async function remove() {
  try {
    const owner = await requireUser();
    await (await clerkClient()).users.deleteUser(owner);
    await purgeAccount(owner);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
