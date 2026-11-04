# Seasonal Cards

pnpm workspace for the web editor, Remotion compositions, shared types, and the Expo Android shell.

## Local development

1. Start Docker Desktop and run `docker compose up -d` for MongoDB.
2. Copy `.env.example` to `apps/web/.env.local`.
3. Run `pnpm install`, then `pnpm --filter @greetings/web dev`.
4. Visit `http://localhost:3000/api/health` to check the app and database.

Run `pnpm check` for typecheck, lint, tests, and formatting. The existing Expo app is in `apps/mobile`; run it with `pnpm --filter @greetings/mobile start`.

## Thanksgiving templates

The picker is at `http://localhost:3000/`. It links to the card and invitation editors, which preview the shared Remotion compositions before export. Text drafts stay in browser storage; photos remain in memory during preview.

Run Remotion Studio with `pnpm --filter @greetings/remotion studio`. For a local MP4, first run `mkdir -p artifacts/local-renders`, then `pnpm --filter @greetings/remotion exec remotion render src/root.tsx harvest-card ../../artifacts/local-renders/harvest-card.mp4` from the repo root. Replace `harvest-card` with `harvest-invitation` for the longer template. Local render measurements are in `docs/cost-benchmarks.md`.

## Saved drafts and local exports

Add Clerk development keys to `apps/web/.env.local` to enable sign-in, saved drafts, and export. The picker and preview work without keys. Run MongoDB and the web app as above, then start the durable render worker in a second terminal:

```sh
pnpm --filter @greetings/web worker
```

`APP_BASE_URL` must match the web server address so Chromium can read uploaded photos. Both web and worker run from `apps/web` and share `LOCAL_MEDIA_DIR` (default `.media`). Uploaded photos and generated files stay on this Mac. The worker reads jobs from MongoDB, writes watermarked 720p MP4s and posters, and removes unreferenced photos older than seven days at startup. Export status and downloads appear in the editor and dashboard.

The local adapter is intended for development. S3 uploads, Lambda execution/webhooks, and AWS operational setup remain deployment work. Clerk webhook delivery goes to `/api/webhooks/clerk` and needs `CLERK_WEBHOOK_SECRET`.

To exercise the real local pipeline against a separate test database, with fixture cleanup:

```sh
MONGODB_URI=mongodb://127.0.0.1:27017/greetings_stage4_test LOCAL_MEDIA_DIR=./.media-stage4-test pnpm --filter @greetings/web exec tsx scripts/verify-render-pipeline.ts
```
