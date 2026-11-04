import { rm } from "node:fs/promises";
import path from "node:path";
import { localRenderConfig } from "../../lib/config";
import { removeInvitationChildren } from "./invitation-cleanup.repository";
export async function cleanInvitation(owner: string, id: string) {
  const hashes = await removeInvitationChildren(owner, id);
  for (const hash of hashes) {
    if (/^[a-f0-9]{64}$/.test(hash))
      await rm(
        path.join(path.resolve(localRenderConfig().root), "renders", hash),
        { recursive: true, force: true },
      );
  }
}
