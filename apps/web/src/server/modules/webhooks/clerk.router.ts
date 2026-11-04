import { revalidatePath } from "next/cache";
import { Webhook } from "svix";
import { getAuthConfig } from "../../lib/config";
import { errorResponse, ValidationError } from "../../lib/errors";
import { accountRepository } from "../accounts/account.repository";
import { purgeAccount } from "../accounts/account.service";
export async function receive(request: Request) {
  try {
    const secret = getAuthConfig().webhookSecret;
    if (!secret) throw new Error("Configure CLERK_WEBHOOK_SECRET");
    const headers = {
      "svix-id": request.headers.get("svix-id") ?? "",
      "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
      "svix-signature": request.headers.get("svix-signature") ?? "",
    };
    let event: unknown;
    try {
      event = new Webhook(secret).verify(await request.text(), headers);
    } catch {
      throw new ValidationError("Invalid webhook signature");
    }
    const parsed = event as { type?: string; data?: { id?: string } };
    if (!parsed.data?.id) throw new ValidationError("Invalid event");
    if (parsed.type === "user.created")
      await accountRepository.upsert(parsed.data.id);
    if (parsed.type === "user.deleted") {
      await purgeAccount(parsed.data.id);
      revalidatePath("/c/[id]", "page");
    }
    return Response.json({ received: true });
  } catch (error) {
    return errorResponse(error);
  }
}
