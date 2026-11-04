import { rm } from "node:fs/promises";
import path from "node:path";
import { localRenderConfig } from "../../lib/config";
import { ownerPrefix } from "../../integrations/local-storage.client";
import { accountRepository } from "./account.repository";
export async function purgeAccount(owner: string) {
  const hashes = await accountRepository.remove(owner);
  const root = path.resolve(localRenderConfig().root);
  await rm(path.join(root, "photos", ownerPrefix(owner)), {
    recursive: true,
    force: true,
  });
  for (const hash of hashes) {
    if (/^[a-f0-9]{64}$/.test(hash))
      await rm(path.join(root, "renders", hash), {
        recursive: true,
        force: true,
      });
  }
}
