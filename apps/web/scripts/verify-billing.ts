import { order, deliver } from "./billing-fixtures";
import { loadEnvConfig } from "@next/env";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import sharp from "sharp";
import {
  getConfig,
  paymentSettings,
  localRenderConfig,
} from "../src/server/lib/config";
import { entitlementService } from "../src/server/modules/entitlements/entitlement.service";
import {
  Ledger,
  CreditAccount,
} from "../src/server/modules/entitlements/entitlement.model";
import { creditAccountKey } from "../src/server/modules/entitlements/entitlement.repository";
import { OrderReceiptModel } from "../src/server/modules/payments/payment.model";
import { invitationService } from "../src/server/modules/invitations/invitation.service";
import { Invitation } from "../src/server/modules/invitations/invitation.model";
import { requestRender } from "../src/server/modules/renders/render.service";
import { Render } from "../src/server/modules/renders/render.model";
import { renderRepository } from "../src/server/modules/renders/render.repository";
import { renderChoice } from "../src/server/modules/renders/render.schema";
import { processNextRender } from "../src/server/modules/renders/render-worker.service";
import { createLocalRenderer } from "../src/server/integrations/local-render.client";
import { readMedia } from "../src/server/integrations/local-storage.client";
import { purgeAccount } from "../src/server/modules/accounts/account.service";
import { removeExpiredCreations } from "../src/server/modules/retention/retention.service";
import { log } from "../src/server/lib/logger";
loadEnvConfig(process.cwd());
const owners = [`qa-billing-${randomUUID()}`, `qa-refunds-${randomUUID()}`];
async function main() {
  if (
    !getConfig().MONGODB_URI.endsWith("/greetings_stage6_test") ||
    paymentSettings().environment !== "sandbox" ||
    !paymentSettings().webhookSecret
  )
    throw new Error(
      "Use the isolated greetings_stage6_test database and a local test webhook secret",
    );
  try {
    if (process.argv.includes("--http")) {
      for (const route of ["/terms", "/privacy", "/support"]) {
        const page = await fetch(`${localRenderConfig().appUrl}${route}`);
        assert.equal(page.status, 200);
        const html = await page.text();
        assert(
          html.includes("/terms") &&
            html.includes("/privacy") &&
            html.includes("/support"),
        );
      }
      const packs = await fetch(`${localRenderConfig().appUrl}/api/packs`);
      assert.equal(packs.status, 200);
      assert.deepEqual(await packs.json(), { enabled: false, packs: [] });
      const unverified = await fetch(
        `${localRenderConfig().appUrl}/api/webhooks/polar`,
        { method: "POST", body: "{}" },
      );
      assert.equal(unverified.status, 400);
    }
    const purchase = await order(owners[0]);
    const event = await deliver(purchase);
    await deliver(purchase, event);
    await deliver(purchase);
    assert.equal(await entitlementService.getBalance(owners[0]), 1);
    const input = {
      templateId: "harvest-card",
      props: {
        type: "card" as const,
        themeId: "thanksgiving" as const,
        senderName: "Stage 6 QA",
        message: "A paid HD export.",
      },
    };
    const a = await invitationService.create(owners[0], input);
    const b = await invitationService.create(owners[0], {
      ...input,
      props: { ...input.props, message: "A simultaneous export." },
    });
    const race = await Promise.allSettled([
      requestRender(owners[0], String(a._id), undefined, "hd"),
      requestRender(owners[0], String(b._id), undefined, "hd"),
    ]);
    assert.equal(race.filter((item) => item.status === "fulfilled").length, 1);
    const rejected = race.find(
      (item) => item.status === "rejected",
    ) as PromiseRejectedResult;
    assert.equal(rejected.reason.status, 402);
    const accepted = race.find(
      (item) => item.status === "fulfilled",
    ) as PromiseFulfilledResult<Awaited<ReturnType<typeof requestRender>>>;
    assert(accepted.value);
    const hd = accepted.value;
    assert.equal(await entitlementService.getBalance(owners[0]), 0);
    const cached = await requestRender(
      owners[0],
      hd.invitationId,
      undefined,
      "hd",
    );
    assert.equal(String(cached?._id), String(hd._id));
    assert.equal(await entitlementService.getBalance(owners[0]), 0);
    const renderer = await createLocalRenderer();
    await processNextRender(renderer);
    const ready = await renderRepository.get(owners[0], String(hd._id));
    assert.equal(ready?.status, "ready");
    assert.equal(ready?.tier, "hd");
    const poster = await readMedia(
      new URL(ready!.posterUrl!).pathname.slice("/api/media/".length),
    );
    const meta = await sharp(poster).metadata();
    assert.equal(meta.width, 1080);
    assert.equal(meta.height, 1920);
    const video = await readMedia(
      new URL(ready!.fileUrl!).pathname.slice("/api/media/".length),
    );
    await mkdir(path.resolve("../../artifacts/local-renders"), {
      recursive: true,
    });
    await writeFile(
      path.resolve("../../artifacts/local-renders/stage6-hd.png"),
      poster,
    );
    await writeFile(
      path.resolve("../../artifacts/local-renders/stage6-hd.mp4"),
      video,
    );
    const second = await order(owners[0]);
    await deliver(second);
    const failedDraft = await invitationService.create(owners[0], {
      ...input,
      props: { ...input.props, message: "A forced paid failure." },
    });
    const failed = await requestRender(
      owners[0],
      String(failedDraft._id),
      undefined,
      "hd",
    );
    assert(failed);
    await processNextRender({
      render: async () => {
        throw new Error("forced");
      },
    });
    assert.equal(await entitlementService.getBalance(owners[0]), 1);
    const failedRecord = await renderRepository.get(
      owners[0],
      String(failed._id),
    );
    await renderRepository.fail(String(failed._id), failedRecord!.attemptId!);
    assert.equal(await entitlementService.getBalance(owners[0]), 1);
    await requestRender(owners[0], String(failedDraft._id), undefined, "hd");
    assert.equal(await entitlementService.getBalance(owners[0]), 0);
    await Render.updateOne(
      { _id: failed._id },
      { $set: { updatedAt: new Date(Date.now() - 660000) } },
      { timestamps: false },
    );
    await renderRepository.sweep();
    assert.equal(await entitlementService.getBalance(owners[0]), 1);
    await renderRepository.sweep();
    assert.equal(await entitlementService.getBalance(owners[0]), 1);
    await deliver({
      ...second,
      type: "order.refunded",
      data: { ...second.data, status: "refunded", refunded_amount: 1000 },
    });
    assert.equal(await entitlementService.getBalance(owners[0]), 0);
    await deliver(second);
    assert.equal(await entitlementService.getBalance(owners[0]), 0);
    await deliver({
      ...purchase,
      type: "order.refunded",
      data: { ...purchase.data, status: "refunded", refunded_amount: 1000 },
    });
    assert.equal(await entitlementService.getBalance(owners[0]), 0);
    assert.equal(
      (await CreditAccount.findById(creditAccountKey(owners[0])).lean())
        ?.balance,
      -1,
    );
    const debtor = await invitationService.create(owners[0], {
      ...input,
      props: { ...input.props, message: "A balance adjustment check" },
    });
    await assert.rejects(
      requestRender(owners[0], String(debtor._id), undefined, "hd"),
    );
    const reversed = await order(owners[1], 5);
    await deliver({
      ...reversed,
      type: "order.refunded",
      data: { ...reversed.data, status: "refunded", refunded_amount: 1000 },
    });
    await deliver(reversed);
    assert.equal(await entitlementService.getBalance(owners[1]), 0);
    const partial = await order(owners[1], 5);
    await deliver(partial);
    await deliver({
      ...partial,
      type: "order.refunded",
      data: {
        ...partial.data,
        status: "partially_refunded",
        refunded_amount: 200,
      },
    });
    assert.equal(await entitlementService.getBalance(owners[1]), 4);
    await deliver({
      ...partial,
      type: "order.refunded",
      data: {
        ...partial.data,
        status: "partially_refunded",
        refunded_amount: 300,
      },
    });
    assert.equal(await entitlementService.getBalance(owners[1]), 3);
    await deliver({
      ...partial,
      type: "order.refunded",
      data: {
        ...partial.data,
        status: "partially_refunded",
        refunded_amount: 100,
      },
    });
    assert.equal(await entitlementService.getBalance(owners[1]), 3);
    const materialized = await CreditAccount.findById(
      creditAccountKey(owners[1]),
    ).lean();
    assert.equal(materialized?.balance, 3);
    const free = await requestRender(
      owners[0],
      String(a._id),
      undefined,
      renderChoice.parse({ paid: true, watermark: false }).quality,
    );
    assert.equal(free?.tier, "free");
    const stale = await invitationService.create(owners[1], input);
    await Invitation.collection.updateOne(
      { _id: stale._id },
      { $set: { createdAt: new Date(Date.now() - 91 * 86400000) } },
    );
    await removeExpiredCreations();
    await assert.rejects(invitationService.get(owners[1], String(stale._id)));
    await purgeAccount(owners[1]);
    await deliver(partial);
    assert.equal(await Ledger.countDocuments({ clerkId: owners[1] }), 0);
    assert.equal(
      await OrderReceiptModel.countDocuments({ clerkId: owners[1] }),
      0,
    );
    log("info", "qa.billing.passed", {
      width: meta.width!,
      height: meta.height!,
      videoBytes: video.length,
    });
  } finally {
    for (const owner of owners) await purgeAccount(owner);
    await mongoose.disconnect();
  }
}
main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.stack : "Billing verification failed"}\n`,
  );
  process.exitCode = 1;
});
