import { randomBytes } from "node:crypto";
import { resultRepository } from "./result.repository";
import { renderRepository } from "../renders/render.repository";
import type { RenderRecord } from "../renders/render.model";
export async function publishResults(owner: string, renderId: string) {
  const current = await renderRepository.get(owner, renderId);
  if (current?.status !== "ready") return;
  for (const item of await resultRepository.pending(owner, renderId)) {
    const id = String(item._id);
    if (!item.shareId)
      await resultRepository.assignShareId(
        owner,
        id,
        renderId,
        randomBytes(16).toString("base64url"),
      );
    await resultRepository.setPublished(owner, id, renderId);
  }
}
export async function bindResult(
  owner: string,
  invitationId: string,
  job: Pick<RenderRecord, "status"> & { _id: unknown },
) {
  const id = String(job._id);
  await resultRepository.setPending(owner, invitationId, id);
  await publishResults(owner, id);
}
