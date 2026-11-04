# Stage 4 local render pipeline

The development adapter uses authenticated multipart photo upload, local files, a MongoDB queue, and a separate Remotion worker. It runs the same compositions used by the browser Player. The server injects the watermark and fixes output scale at 720×1280. The browser cannot choose a paid tier.

Each job has a canonical content hash scoped to its owner and output tier. Identical exports reuse the job, including across saved invitations belonging to that owner. Job claiming is atomic. Attempts have unique IDs, so an expired worker cannot overwrite the outcome of a retry. Failed jobs allow at most three total attempts. Queued and rendering jobs older than ten minutes are marked failed. The worker cancels rendering at nine minutes.

Uploads are capped at 8 MB, decoded and re-encoded as JPEG without metadata, and downscaled to 1600 px. Both the declared and decoded formats must be JPEG, PNG, or WebP. Render requests reject foreign origins, another owner's photo prefix, missing files, invalid props, and ownership failures. Local safety quotas are 10 render starts and 30 uploads per user per hour, with additional IP quotas. These are provisional development defaults, not a pricing decision.

Media URLs are public and use opaque paths. Video responses support HTTP byte ranges and attachment downloads. Deletion removes unreferenced render files; startup cleanup removes photo uploads older than seven days when no draft or render references them.

Verified with the isolated `greetings_stage4_test` MongoDB database: photo normalization, rejection of spoofed/foreign photos, identical-job caching, a real queued MP4 and 720×1280 poster, forced render failure, ownership rejection, retry caps, and rejection of stale completion attempts. Synthetic rendered fixtures are copied to `artifacts/local-renders/stage4-watermarked.*` for review. The test removes its own database records and stored files.

Clerk keys are still needed to exercise browser sign-in, upload, and export together. The backend pipeline test invokes the services with synthetic owners; it does not bypass authentication in any shipped route.

S3 presigned uploads and lifecycle rules, Lambda/webhook integration, cloud cost measurement, AWS budget alarms, and concurrency provisioning remain pending for cloud deployment. Local storage and worker processes cannot be deployed as-is to Vercel's ephemeral runtime.
