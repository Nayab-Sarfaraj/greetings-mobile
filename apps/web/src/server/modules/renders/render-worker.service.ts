import { publishResults } from "../results/publication.service";
import { renderRepository } from "./render.repository";
import { invitationInput } from "../invitations/invitation.schema";
import { mediaUrl, removeMedia } from "../../integrations/local-storage.client";
import type { RenderClient } from "../../integrations/local-render.client";
import { log } from "../../lib/logger";
export async function processNextRender(
  renderer: RenderClient,
  onError?: (error: unknown) => void,
) {
  await renderRepository.sweep();
  const job = await renderRepository.claim();
  if (!job) return false;
  const id = String(job._id);
  const attempt = job.attemptId!;
  const started = Date.now();
  const video = `renders/${job.propsHash}/${attempt}.mp4`;
  const poster = `renders/${job.propsHash}/${attempt}.png`;
  try {
    const input = invitationInput.parse(job.input);
    await renderer.render(input, video, poster);
    const result = await renderRepository.complete(
      id,
      attempt,
      mediaUrl(video),
      mediaUrl(poster),
      Date.now() - started,
    );
    if (!result.modifiedCount) {
      await Promise.all([removeMedia(video), removeMedia(poster)]);
    } else {
      await publishResults(job.ownerClerkId, id).catch(() =>
        log("error", "render.publication-deferred", { renderId: id }),
      );
      log("info", "render.completed", {
        renderId: id,
        elapsedMs: Date.now() - started,
      });
    }
  } catch (error) {
    onError?.(error);
    await renderRepository.fail(id, attempt);
    await Promise.all([removeMedia(video), removeMedia(poster)]);
    log("error", "render.failed", { renderId: id });
  }
  return true;
}
