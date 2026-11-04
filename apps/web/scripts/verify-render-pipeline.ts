import { loadEnvConfig } from "@next/env";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { renderRepository } from "../src/server/modules/renders/render.repository";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import sharp from "sharp";
import { getConfig } from "../src/server/lib/config";
import { invitationService } from "../src/server/modules/invitations/invitation.service";
import {
  requestRender,
  getRender,
} from "../src/server/modules/renders/render.service";
import { processNextRender } from "../src/server/modules/renders/render-worker.service";
import { createLocalRenderer } from "../src/server/integrations/local-render.client";
import { uploadPhoto } from "../src/server/modules/uploads/upload.service";
import {
  assertOwnedPhoto,
  readMedia,
} from "../src/server/integrations/local-storage.client";
import { purgeAccount } from "../src/server/modules/accounts/account.service";
import { log } from "../src/server/lib/logger";
loadEnvConfig(process.cwd());
async function main() {
  if (!getConfig().MONGODB_URI.endsWith("/greetings_stage4_test"))
    throw new Error("Use the isolated greetings_stage4_test database");
  const owner = `qa-${randomUUID()}`;
  try {
    const jpg = await sharp({
      create: { width: 2000, height: 1000, channels: 3, background: "white" },
    })
      .jpeg()
      .toBuffer();
    const uploaded = await uploadPhoto(
      owner,
      new File([new Uint8Array(jpg)], "photo.jpg", { type: "image/jpeg" }),
    );
    await assertOwnedPhoto(uploaded.url, owner);
    await assert.rejects(assertOwnedPhoto(uploaded.url, "other"));
    const photo = await readMedia(
      new URL(uploaded.url).pathname.slice("/api/media/".length),
    );
    assert.equal((await sharp(photo).metadata()).width, 1600);
    await assert.rejects(
      uploadPhoto(
        owner,
        new File(["<svg/>"], "fake.jpg", { type: "image/jpeg" }),
      ),
    );
    const input = {
      templateId: "harvest-card",
      props: {
        type: "card" as const,
        themeId: "thanksgiving" as const,
        senderName: "Local QA",
        message: "A real queued render.",
      },
    };
    const invitation = await invitationService.create(owner, input);
    const id = String(invitation._id);
    const first = await requestRender(owner, id);
    assert(first);
    const cached = await requestRender(owner, id);
    assert.equal(String(cached?._id), String(first._id));
    const renderer = await createLocalRenderer();
    let renderFailure: unknown;
    assert(
      await processNextRender(
        {
          render: async (...args) => {
            try {
              await renderer.render(...args);
            } catch (error) {
              renderFailure = error;
              throw error;
            }
          },
        },
        (error) => {
          renderFailure = error;
        },
      ),
    );
    const ready = await getRender(owner, String(first._id));
    assert.equal(ready.status, "ready", String(renderFailure));
    assert(ready.fileUrl && ready.posterUrl);
    const poster = await readMedia(
      new URL(ready.posterUrl).pathname.slice("/api/media/".length),
    );
    const metadata = await sharp(poster).metadata();
    assert.equal(metadata.width, 720);
    assert.equal(metadata.height, 1280);
    const video = await readMedia(
      new URL(ready.fileUrl).pathname.slice("/api/media/".length),
    );
    assert(video.length > 1000);
    const artifacts = path.resolve("../../artifacts/local-renders");
    await mkdir(artifacts, { recursive: true });
    await writeFile(path.join(artifacts, "stage4-watermarked.png"), poster);
    await writeFile(path.join(artifacts, "stage4-watermarked.mp4"), video);
    await assert.rejects(getRender("other", String(first._id)));
    const failedDraft = await invitationService.create(owner, {
      ...input,
      props: { ...input.props, message: "A forced failure" },
    });
    const failed = await requestRender(owner, String(failedDraft._id));
    assert(failed);
    await processNextRender({
      render: async () => {
        throw new Error("forced");
      },
    });
    assert.equal((await getRender(owner, String(failed._id))).status, "failed");
    for (let attempt = 0; attempt < 2; attempt++) {
      await requestRender(owner, String(failedDraft._id));
      const claimed = await renderRepository.claim();
      assert(claimed?.attemptId);
      const stale = await renderRepository.complete(
        String(claimed._id),
        "stale-attempt",
        "invalid",
        "invalid",
        0,
      );
      assert.equal(stale.modifiedCount, 0);
      await renderRepository.fail(String(claimed._id), claimed.attemptId);
    }
    await assert.rejects(
      requestRender(owner, String(failedDraft._id)),
      /retry limit/,
    );
    log("info", "qa.render-pipeline.passed", {
      videoBytes: video.length,
      width: metadata.width!,
      height: metadata.height!,
    });
  } finally {
    await purgeAccount(owner);
    await mongoose.disconnect();
  }
}
main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : "Verification failed"}\n`,
  );
  process.exitCode = 1;
});
