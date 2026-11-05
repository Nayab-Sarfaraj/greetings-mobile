import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";
import path from "node:path";
import { access, mkdir, rm, writeFile } from "node:fs/promises";
import { templates } from "@greetings/remotion/templates";
import { connectDb } from "../src/server/lib/db";
import { localRenderConfig } from "../src/server/lib/config";
import { log } from "../src/server/lib/logger";
import { invitationService } from "../src/server/modules/invitations/invitation.service";
import { guestService } from "../src/server/modules/guests/guest.service";
import { Guest } from "../src/server/modules/guests/guest.model";
import { Invitation } from "../src/server/modules/invitations/invitation.model";
import { Render } from "../src/server/modules/renders/render.model";
import { NotFoundError } from "../src/server/lib/errors";
import { Counter } from "../src/server/modules/rate-limits/rate-limit.model";

loadEnvConfig(process.cwd());

async function verify() {
  const uri = process.env.MONGODB_URI ?? "";
  const mediaRoot = path.resolve(localRenderConfig().root);
  if (!uri.includes("greetings_stage8_test"))
    throw new Error("Stage 8 verification requires greetings_stage8_test");
  if (!mediaRoot.endsWith(".media-stage8-test"))
    throw new Error("Stage 8 verification requires .media-stage8-test");
  await connectDb();
  await Promise.all([
    Guest.deleteMany({}),
    Invitation.deleteMany({}),
    Render.deleteMany({}),
    Counter.deleteMany({}),
  ]);
  await rm(mediaRoot, { recursive: true, force: true });
  const owner = "stage8-owner";
  const input = {
    templateId: templates[1].id,
    props: templates[1].defaultProps,
    hostContact: { method: "email" as const, value: "host@example.com" },
  };
  const invitation = await invitationService.create(owner, input);
  const id = String(invitation._id);
  const imported = await guestService.import(
    owner,
    id,
    Array.from({ length: 20 }, (_, index) => ({ name: `Guest ${index + 1}` })),
  );
  if (imported.created !== 20 || imported.guests.length !== 20)
    throw new Error("Expected 20 imported guests");
  const tokens = new Set(imported.guests.map((item) => item.token));
  if (tokens.size !== 20) throw new Error("Guest tokens are not unique");
  for (const guest of imported.guests) {
    const publicItem = await guestService.public(guest.token, "127.0.0.1");
    if (publicItem.guestName !== guest.name || publicItem.props.guestName !== guest.name)
      throw new Error("Guest personalization mismatch");
  }
  const token = imported.guests[0].token;
  const altered = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;
  try {
    await guestService.public(altered, "127.0.0.2");
    throw new Error("Altered token unexpectedly resolved");
  } catch (error) {
    if (!(error instanceof NotFoundError)) throw error;
  }
  const hash = "8".repeat(64);
  const renderPath = path.join(mediaRoot, "renders", hash);
  await mkdir(renderPath, { recursive: true });
  await writeFile(path.join(renderPath, "video.mp4"), "fixture");
  await Render.create({
    tier: "free",
    chargeSequence: 0,
    ownerClerkId: owner,
    invitationId: id,
    invitationIds: [id],
    propsHash: hash,
    status: "ready",
    input,
    attempts: 1,
  });
  await invitationService.delete(owner, id);
  const remaining = await Promise.all([
    Guest.countDocuments({ invitationId: id }),
    Render.countDocuments({ invitationIds: id }),
    Invitation.countDocuments({ _id: id }),
  ]);
  if (remaining.some(Boolean)) throw new Error("Cascade deletion was incomplete");
  try {
    await access(renderPath);
    throw new Error("Render fixture was not removed");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  log("info", "stage8.verification.passed", {
    imported: imported.guests.length,
    uniqueTokens: tokens.size,
  });
}

verify()
  .finally(async () => {
    if (mongoose.connection.readyState)
      await Promise.all([
        Guest.deleteMany({}),
        Invitation.deleteMany({}),
        Render.deleteMany({}),
        Counter.deleteMany({}),
      ]);
    const root = path.resolve(localRenderConfig().root);
    if (root.endsWith(".media-stage8-test"))
      await rm(root, { recursive: true, force: true });
    await mongoose.disconnect();
  })
  .catch(() => {
    log("error", "stage8.verification.failed");
    process.exitCode = 1;
  });
