import { bundle } from "@remotion/bundler";
import {
  makeCancelSignal,
  selectComposition,
  renderMedia,
  renderStill,
} from "@remotion/renderer";
import path from "node:path";
import { mkdir } from "node:fs/promises";
import type { RenderTier } from "../modules/renders/render.model";
import type { InvitationInput } from "../modules/invitations/invitation.schema";
import { mediaPath } from "./local-storage.client";
export interface RenderClient {
  render(
    input: InvitationInput,
    videoKey: string,
    posterKey: string,
    tier?: RenderTier,
  ): Promise<void>;
}
export async function createLocalRenderer(): Promise<RenderClient> {
  const serveUrl = await bundle({
    entryPoint: path.resolve("../../packages/remotion/src/root.tsx"),
  });
  return {
    async render(input, videoKey, posterKey, tier = "free") {
      const inputProps = {
        // Null survives JSON serialization and clears Studio's example defaults.
        recipientName: null,
        message: null,
        photoUrl: null,
        mapUrl: null,
        guestName: null,
        ...input.props,
        watermark: tier !== "hd",
      };
      const composition = await selectComposition({
        serveUrl,
        id: input.templateId,
        inputProps,
      });
      const { cancelSignal, cancel } = makeCancelSignal();
      const timer = setTimeout(cancel, 9 * 60000);
      try {
        await mkdir(path.dirname(mediaPath(videoKey)), { recursive: true });
        await renderMedia({
          serveUrl,
          composition,
          inputProps,
          codec: "h264",
          outputLocation: mediaPath(videoKey),
          scale: tier === "hd" ? 1 : 2 / 3,
          concurrency: 2,
          cancelSignal,
        });
        await renderStill({
          serveUrl,
          composition,
          inputProps,
          output: mediaPath(posterKey),
          frame: Math.min(120, composition.durationInFrames - 1),
          scale: tier === "hd" ? 1 : 2 / 3,
          cancelSignal,
        });
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
