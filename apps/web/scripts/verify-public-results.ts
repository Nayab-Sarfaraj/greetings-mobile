import { loadEnvConfig } from "@next/env";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { getConfig, localRenderConfig } from "../src/server/lib/config";
import { invitationService } from "../src/server/modules/invitations/invitation.service";
import { requestRender } from "../src/server/modules/renders/render.service";
import { processNextRender } from "../src/server/modules/renders/render-worker.service";
import { createLocalRenderer } from "../src/server/integrations/local-render.client";
import { resultService } from "../src/server/modules/results/result.service";
import { get, download } from "../src/server/modules/results/result.router";
import { purgeAccount } from "../src/server/modules/accounts/account.service";
import { log } from "../src/server/lib/logger";
loadEnvConfig(process.cwd());
async function main() {
  if (!getConfig().MONGODB_URI.endsWith("/greetings_stage5_test"))
    throw new Error("Use the isolated greetings_stage5_test database");
  const owner = `qa-${randomUUID()}`;
  try {
    const input = {
      templateId: "harvest-card",
      props: {
        type: "card" as const,
        themeId: "thanksgiving" as const,
        senderName: "Stage 5 QA",
        message: "A public greeting",
      },
    };
    const invitation = await invitationService.create(owner, input);
    const id = String(invitation._id);
    await requestRender(owner, id);
    assert(!(await invitationService.get(owner, id)).shareId);
    const renderer = await createLocalRenderer();
    await processNextRender(renderer);
    const published = await invitationService.get(owner, id);
    const shareId = String(published.shareId);
    assert.match(shareId, /^[A-Za-z0-9_-]{22}$/);
    const first = await resultService.get(shareId);
    assert.equal(first.status, "ready");
    assert(!JSON.stringify(first).includes(owner));
    assert.deepEqual(
      Object.keys(first).sort(),
      [
        "shareId",
        "status",
        "type",
        "title",
        "theme",
        "videoUrl",
        "posterUrl",
      ].sort(),
    );
    const context = { params: Promise.resolve({ id: shareId }) };
    const response = await get(new Request("http://localhost"), context);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("cache-control") ?? "", /s-maxage=60/);
    const redirect = await download(new Request("http://localhost"), context);
    assert.equal(redirect.status, 302);
    assert.equal(
      new URL(redirect.headers.get("location")!).searchParams.get("download"),
      "1",
    );
    if (process.argv.includes("--http")) {
      const page = await fetch(`${localRenderConfig().appUrl}/c/${shareId}`, {
        headers: { "User-Agent": "Twitterbot/1.0" },
      });
      assert.equal(page.status, 200);
      assert.match(page.headers.get("cache-control") ?? "", /s-maxage=60/);
      const html = await page.text();
      assert(html.includes("og:image"));
      assert(html.includes("twitter:card"));
      assert(html.includes("noindex"));
      assert(!html.includes(owner));
      assert(!html.includes("ownerClerkId"));
      const media = await fetch(redirect.headers.get("location")!, {
        headers: { Range: "bytes=0-31" },
      });
      assert.equal(media.status, 206);
      assert.match(
        media.headers.get("content-disposition") ?? "",
        /attachment/,
      );
      assert.equal((await media.arrayBuffer()).byteLength, 32);
    }
    await invitationService.update(owner, id, {
      ...input,
      props: { ...input.props, senderName: "Unpublished edit" },
    });
    assert.equal((await resultService.get(shareId)).title, first.title);
    await requestRender(owner, id);
    assert.equal((await resultService.get(shareId)).status, "processing");
    assert.equal(
      (await get(new Request("http://localhost"), context)).headers.get(
        "cache-control",
      ),
      "no-store",
    );
    await processNextRender({
      render: async () => {
        throw new Error("forced");
      },
    });
    assert.equal((await resultService.get(shareId)).status, "failed");
    await requestRender(owner, id);
    await processNextRender(renderer);
    assert.equal(
      String((await invitationService.get(owner, id)).shareId),
      shareId,
    );
    assert.equal(
      (await resultService.get(shareId)).title,
      "A greeting from Unpublished edit",
    );
    if (process.argv.includes("--http")) {
      const clone = await invitationService.create(owner, input);
      await requestRender(owner, String(clone._id));
      const cloneShare = String(
        (await invitationService.get(owner, String(clone._id))).shareId,
      );
      await invitationService.update(owner, String(clone._id), {
        ...input,
        props: { ...input.props, senderName: "Processing view" },
      });
      await requestRender(owner, String(clone._id));
      const processing = await fetch(
        `${localRenderConfig().appUrl}/c/${cloneShare}`,
      );
      assert.equal(processing.status, 200);
      assert.match(processing.headers.get("cache-control") ?? "", /no-store/);
      assert(
        (await processing.text()).includes("Your video is being prepared"),
      );
      assert.equal(
        (
          await fetch(
            `${localRenderConfig().appUrl}/api/public/cards/${cloneShare}/download`,
            { redirect: "manual" },
          )
        ).status,
        409,
      );
      assert.equal(
        (await fetch(`${localRenderConfig().appUrl}/c/${"Z".repeat(22)}`))
          .status,
        404,
      );
    }
    await invitationService.delete(owner, id);
    await assert.rejects(resultService.get(shareId));
    log("info", "qa.public-results.passed");
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
