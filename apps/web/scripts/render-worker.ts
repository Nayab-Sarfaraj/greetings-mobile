import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";
import { setTimeout as delay } from "node:timers/promises";
import { processNextRender } from "../src/server/modules/renders/render-worker.service";
import { createLocalRenderer } from "../src/server/integrations/local-render.client";
import { cleanOrphanPhotos } from "../src/server/modules/uploads/upload-cleanup.service";
import { log } from "../src/server/lib/logger";
loadEnvConfig(process.cwd());
let stopping = false;
process.on("SIGINT", () => {
  stopping = true;
});
process.on("SIGTERM", () => {
  stopping = true;
});
async function main() {
  const renderer = await createLocalRenderer();
  await cleanOrphanPhotos();
  try {
    do {
      const worked = await processNextRender(renderer);
      if (process.argv.includes("--once")) break;
      if (!worked) await delay(1000);
    } while (!stopping);
  } finally {
    await mongoose.disconnect();
  }
}
main().catch(() => {
  log("error", "render.worker.stopped");
  process.exitCode = 1;
});
