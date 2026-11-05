import { expiredInvitations } from "./retention.repository";
import { invitationService } from "../invitations/invitation.service";
import { NotFoundError } from "../../lib/errors";
export async function removeExpiredCreations() {
  for (;;) {
    const items = await expiredInvitations();
    if (!items.length) return;
    for (const item of items) {
      try {
        await invitationService.delete(
          String(item.ownerClerkId),
          String(item._id),
        );
      } catch (error) {
        if (!(error instanceof NotFoundError)) throw error;
      }
    }
  }
}
