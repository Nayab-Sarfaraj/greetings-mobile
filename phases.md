# PHASES.md — Development Plan

Companion to `CLAUDE.md`. `CLAUDE.md` defines the rules and decisions. This file defines the order of work. If the two differ, **this file wins on sequencing**, and `CLAUDE.md` wins on architecture and design rules.

Work one phase at a time. Do not start a phase until the previous phase's **Done when** checks pass. No dates are set on purpose.

## Decisions that need confirming

These are defaults used in the phases below. Flag them to the owner at the start of the phase where they matter.

1. **Video size:** 1080×1920 (9:16) for both cards and invitations, since they are mostly shared to WhatsApp Status and Stories. Free tier renders at 720×1280. Frame rate 30.
2. **AI message generation requires sign-in** (it costs money per call). This overrides the "sign in only at export/save/purchase" line in `CLAUDE.md` section 10.
3. **Free-tier limits and pack prices** are set after the Phase 2 cost test, not before.
4. **Max guests per invitation:** 200.
5. **Retention:** invitations, guests, and rendered files are deleted 90 days after the event date (cards: 90 days after creation), unless the owner deletes them sooner.
6. **Rate limiting store:** a Mongo-backed TTL counter behind a `rate-limit` interface, to avoid new infrastructure. Swappable later.

## Definition of done (applies to every phase)

- Typecheck, lint, format, and tests all pass with one command.
- New backend code follows `router → service → repository → model` with zod validation at the router and ownership checks in the service.
- No `TODO` placeholders, `console.log`, commented-out code, or hard-coded secrets.
- `.env.example` updated for any new variable. Config validated in the config module.
- Loading, empty, error, and success states exist for every new screen.
- `CLAUDE.md` or this file updated if a decision changed.
- A short manual QA checklist was run and the result reported.

---

## Phase 0 — Foundation

**Goal:** a clean, enforced skeleton so every later phase follows the same rules automatically.

**Build**

- pnpm workspace with Turborepo. Packages: `apps/web` (Next.js App Router), `apps/mobile` (empty placeholder), `packages/remotion`, `packages/shared`.
- Strict TypeScript base config, ESLint, Prettier, Vitest. One root command (`pnpm check`) runs typecheck, lint, and tests.
- `packages/shared`: `design-tokens.ts` with the three holiday palettes and type roles from `CLAUDE.md` section 15, plus constants (`MAX_VIDEO_SECONDS = 90`, `FPS = 30`, video dimensions).
- Tailwind wired to the tokens. Fonts loaded (display serif, body sans).
- Server foundations under `apps/web/src/server/lib`: validated `config` (zod over env), structured `logger`, `AppError` and subclasses, `errorHandler` producing `{ error: { code, message } }`, request-validation helper, cached Mongo connection that is safe for serverless and hot reload.
- `GET /api/health` that reports app and database status.
- `.env.example` and a short README with run instructions.

**Rules and edge cases**

- `process.env` is read only in the config module.
- Missing or malformed env vars must fail at startup with a message naming the variable.

**Done when**

- The web app boots and `/api/health` returns OK with DB connected.
- A deliberately thrown `AppError` returns the standard envelope with the right status code.
- Removing a required env var stops startup with a clear message.
- `pnpm check` passes.

---

## Phase 1 — Remotion core and the first theme (Thanksgiving)

**Goal:** the two compositions, the template system, and one complete theme, proven in Remotion Studio.

**Build**

- Remotion Studio script in `packages/remotion`.
- **Props schema (zod).**
  - Card: `senderName`, `recipientName` (optional), `message`, `photoUrl` (optional), `themeId`.
  - Invitation: `eventTitle`, `hostName`, `dateTime` (ISO plus timezone), `locationText`, `mapUrl` (optional), `message` (optional), `photoUrl` (optional), `guestName` (optional; only set on the guest page), `themeId`.
  - Hard character limits in the schema for every text field. The editor mirrors them.
  - The watermark flag is **not** a user prop. The server injects it.
- **Template registry:** each entry has `id`, `type`, `themeId`, scene list, default props, and duration. Cards run about 5–8 sec, invitations about 20–30 sec. `calculateMetadata` derives duration from the scene list. A test fails if any template exceeds 90 sec.
- **Scenes:** `Intro`, `Details`, `GuestName`, `Closing`. Invitations compose several scenes. Cards use a shorter two-scene layout.
  - If `guestName` is present, `GuestName` shows it at the end in the script font. If absent, the closing scene shows the host's name instead. Duration stays deterministic either way.
- **Theme object** per holiday: palette, fonts, flora set, motion timing.
- **Floral SVG components:** `Bloom` (dahlia, chrysanthemum, sunflower variants), `Leaf` (maple, oak), `Wheat`, `Vine`, `CornerCluster`, `Wreath`. All inline SVG, variant-driven.
- **Motion:** one orchestrated moment per template (flowers bloom around the title). Calm, sparse leaf drift in the background. The guest name reveals as if written in script.
- **Text fitting helper:** max lines, shrink down to a minimum size, then ellipsis. Long names, long messages, and long locations must never overflow.
- Fonts loaded through `@remotion/google-fonts` and awaited before frame 0.

**Rules and edge cases**

- Compositions are deterministic: seeded randomness only, no network calls, no `Date.now()`.
- Missing photo shows a designed placeholder, not an empty hole.
- Respect safe margins for Stories and Status UI: keep key text out of roughly the top and bottom 250 px of the 1080×1920 frame.
- Contrast between text and artwork must stay readable on every frame.

**Done when**

- Both compositions render in Studio from sample props, at full size.
- Stress cases render cleanly: longest allowed name, longest message, no photo, very long location.
- The 90-sec cap test passes. Props schema tests pass.
- Screenshots of key frames reviewed at phone size.

---

## Phase 2 — Editor and live preview (web, no login)

**Goal:** a visitor picks a template, edits it, and sees it live. Nothing is saved to the server yet.

**Build**

- **Picker `/`:** filter by type (Card / Invitation) and theme. Template tiles use static poster images generated locally with Remotion stills and stored in `public/`. Do not mount a live Player per tile.
- **Editor `/create/[templateId]`:** form generated from the template's zod schema. Fields per type, character counters, inline validation messages in plain language. Host contact method (email, WhatsApp, or SMS) and value for invitations.
- **Photo:** chosen locally and previewed through an object URL. Client-side downscale to about 1600 px on the long edge and re-encode, which also strips EXIF. **No upload in this phase** (upload needs an account and arrives in Phase 4).
- **Player:** `@remotion/player` in a lazy-loaded client component. Looping, muted autoplay with tap-to-unmute, play/pause, restart. Memoized `inputProps`, edits debounced about 250 ms.
- **Draft persistence:** text fields saved to `localStorage` so a refresh keeps them. The photo is kept in memory only.
- Responsive layout: Player above the form on phones, side by side on desktop.
- **Local render test (final task):** render each Thanksgiving template as an MP4 and review key and stress-case frames at phone size. Record local render time in `docs/cost-benchmarks.md`. Defer Lambda cost testing until AWS is configured for the render pipeline in Phase 4.

**Rules and edge cases**

- The Player and the future Lambda render must use the same composition import from `packages/remotion`.
- No server calls in this phase except fonts and static assets.

**Done when**

- A visitor can go from the picker to a live preview on a 360 px-wide screen.
- Every field's limits match the schema. Invalid input shows a helpful message and never crashes the Player.
- `docs/cost-benchmarks.md` contains measured local render times. Lambda costs, free limits, and pack prices are decided during Phase 4 and Phase 6.

---

## Phase 3 — Accounts, drafts, and the dashboard

**Goal:** creators can sign in, save work, and manage it. Guests still never need an account.

**Build**

- **Clerk** in Next.js middleware. Public routes: `/`, `/create/*`, `/c/*`, `/i/*`, auth pages, and public API routes. Protected: `/dashboard` and all other `/api/*`.
- **users module:** upsert the user on first authenticated request. Clerk webhook (signature verified) for `user.created` and `user.deleted`.
- `requireUser()` guard and an `assertOwner` helper used by services.
- **invitations module (CRUD, owner only):** create, list, get, update, delete. Status `draft`. Props validated with the template's zod schema. Fields include `shareId` (nanoid, created later), `hostContact`, `type`, `templateId`.
- **Sign-in at save/export:** show Clerk's modal so in-memory state (including the photo) is not lost. Text drafts are restored from `localStorage` if the page reloads.
- **Dashboard `/dashboard`:** list of the user's creations (title, type, theme, status, date), open to edit, delete with confirmation.
- **Delete my account:** removes the Clerk user and purges the user's invitations, guests, renders, and stored files. Financial ledger entries are kept but detached from personal identifiers. This is also required later for the Play Store.

**Rules and edge cases**

- Every service method checks ownership. Another user's id must return 404, not 403, to avoid confirming existence.
- Webhook handlers are idempotent (`webhook_events` unique on provider + eventId).

**Done when**

- Anonymous users can pick, edit, and preview. Save or export prompts sign-in and returns to the same editor state.
- The dashboard shows only the signed-in user's items.
- Account deletion removes all of that user's data (verified in the database).
- Ownership tests pass for every module method.

---

## Phase 4 — Render pipeline

Development uses a local file-storage adapter and MongoDB-backed Remotion worker so the export pipeline can be built and tested without AWS. The cloud tasks below remain pending for deployment; local implementation and QA are documented in `docs/stage-4.md`.

**Goal:** a signed-in user can export a real MP4 and poster, safely and cheaply.

**Build**

- **uploads module:** `POST /api/uploads/presign` (auth, rate limited). Validates MIME (jpeg, png, webp) and size (about 8 MB max). Returns a presigned S3 PUT URL under `photos/{clerkId}/{uuid}`. Bucket CORS configured. Lifecycle rule deletes orphan uploads after a set number of days.
- **Export flow in the editor:** upload the photo, save the invitation, request a render, show progress, then show the result link.
- **renders module:** `POST /api/invitations/:id/renders`.
  1. Authenticate, check ownership, validate props with zod.
  2. Confirm `photoUrl` belongs to our bucket and to this user's prefix.
  3. Determine tier. In this phase every render is the free tier: watermarked, 720×1280. The server sets the watermark flag.
  4. Compute `propsHash` (SHA-256 of canonical JSON of template id, props, tier).
  5. If a finished render with that hash exists, return it. If one is in progress, return that one.
  6. Otherwise create a `renders` row (queued), start the Lambda render with a webhook and the render id as custom data, and return the render id.
- **Webhook `POST /api/webhooks/remotion`:** verify the signature, handle success, error, and timeout, idempotent per render id and status. On success, store the file URL and status.
- **Poster:** render a still on Lambda from a representative frame and store it as kind `poster`.
- **Status endpoint** `GET /api/renders/:id` (owner only). The client polls every 2 sec with backoff.
- **Stuck-render sweeper:** a scheduled route marks renders older than about 10 minutes in `queued` or `rendering` as `failed`.
- **Rate limits:** per user and per IP on render requests. Numbers come from the Phase 2 cost test.
- **Cost logging:** store estimated or actual cost on each render row.
- **Infrastructure tasks:** AWS budget alarm, request a Lambda concurrency limit increase, set Lambda memory and `framesPerLambda` from the benchmark.
- **Lambda cost test:** deploy the function and site, render each Thanksgiving template at two or three memory and `framesPerLambda` settings, and record actual times and estimated costs in `docs/cost-benchmarks.md` before setting free limits and pack prices.

**Rules and edge cases**

- Rendered files are public by unguessable key (includes the hash). Note this in the privacy policy.
- Never start a Lambda render for props that failed validation or when a rate limit is hit.
- A failed render shows a clear message and a retry button. Cap retries per invitation.
- Changing any prop changes the hash and triggers a new render.

**Done when**

- Export produces a watermarked MP4 and a poster, visible in the dashboard.
- Re-exporting identical content returns instantly from cache and starts no Lambda run.
- Invalid props, foreign photo URLs, and over-limit requests are rejected before reaching Lambda.
- A forced Lambda failure ends in a `failed` state with a visible error, not an endless spinner.
- Budget alarm exists and the concurrency request is filed.

---

## Phase 5 — Result page and sharing

**Goal:** the public page every recipient sees. This is the growth loop.

**Build**

- **`/c/[id]`** (by `shareId`), for both cards and invitations. Server-rendered from a public DTO that exposes only what the page needs: type, title, video URL, poster URL, theme. No owner IDs, contact details, or other internal fields.
- **States:** ready, still processing (poll until done), failed (generic message), not found (404).
- **Player area:** `<video>` with muted autoplay, tap to unmute, poster image, controls.
- **Buttons:** Download, Share, and "Make your own".
  - Download goes through a server route that redirects to a signed URL with a `Content-Disposition` attachment header, because cross-origin `download` attributes do not work.
  - Share uses the Web Share API with the link, and shares the file where `navigator.canShare` supports files. Fallback: copy link.
  - "Make your own" links to `/` with a campaign parameter.
- **Open Graph and Twitter tags:** title, description, `og:image` set to the poster, `twitter:card` set to large image. `og:video` is optional.
- Public pages are `noindex` so private invitations do not appear in search.

**Rules and edge cases**

- The `shareId` is created on the first successful render and never changes.
- Cache headers allow CDN caching of ready pages, not of processing pages.

**Done when**

- Link previews show the poster and title correctly in WhatsApp, iMessage, and X, tested on real devices and with a link-preview debugger.
- Download works on iPhone Safari and Android Chrome.
- A processing page switches to ready without a manual refresh.
- Inspecting the page source and network calls shows no private data.

---

## Phase 6 — Payments and entitlements (Polar, web)

The configurable implementation and local verification are documented in `docs/stage-6.md`. Actual Polar sandbox checkout remains a required external integration check once products, credentials, and seller/support details are supplied. Partial refunds currently revoke credits proportionally, rounded up to whole credits; review this default with the final pack pricing before launch.

**Goal:** users can buy packs, and paid exports are clean and HD.

**Build**

- **Polar setup:** create the pack products in Polar. Product IDs live in config.
- **entitlements module as a ledger:** entries for grant, consume, and refund, each with a unique reference (for example Polar order id, or render id) so every operation is idempotent. Balance is derived from the ledger. Methods: `getBalance`, `grant`, `consume(renderId)`, `refund(renderId)`.
- **`POST /api/checkout`** (auth): creates a Polar checkout with the user's Clerk id as the external customer id. Success and cancel URLs return to the editor.
- **Webhook `POST /api/webhooks/polar`:** verify the signature. On paid orders, grant credits. On refunds, revoke. Idempotent through `webhook_events`.
- **Render tier:** if the user chooses "HD, no watermark" and has a credit, the render service consumes one credit atomically and starts a 1080×1920, watermark-free render. A cached identical render never costs a credit. A failed render refunds its credit.
- **Paywall UI:** shows packs, prices, and exactly what is included. After checkout the UI polls the balance for up to about 30 sec, since the webhook can arrive after the redirect.
- **Legal pages:** `/terms`, `/privacy`, `/support` (contact email). The privacy policy must cover guest data, public render URLs, retention, and deletion.

**Rules and edge cases**

- The server decides the tier. The client only expresses a choice.
- Two simultaneous consume requests with one credit must result in exactly one success.
- Replayed or out-of-order webhooks must never double-grant.

**Done when**

- A test purchase unlocks a clean HD render and the balance decreases once.
- Replaying the same webhook changes nothing.
- A refund removes the credit.
- A client that sends a fake "paid" flag still gets a watermarked render.
- Legal pages are live and linked from the footer and checkout.

---

## Launch checkpoint (web, Thanksgiving only)

Before going live, confirm:

- Production environment variables set and validated. Mongo Atlas production cluster with backups.
- Remotion license terms verified for commercial use.
- Polar payouts confirmed for the owner's country.
- AWS budget alarm active, concurrency limit approved.
- Link previews verified in the real chat apps.
- Rate limits active on renders, uploads, and checkout.
- A full end-to-end test as a brand-new user: pick, edit, sign in, pay, export, share.

If Christmas needs to be ready sooner than the later phases, pull its templates forward from Phase 9. Phases 7–9 can ship as updates after launch.

---

## Phase 7 — AI message writer

The server-side Anthropic integration, bounded curated fallback, usage logging,
and editor UI are documented in `docs/stage-7.md`. A live provider request
remains an external integration check until an Anthropic API key is configured.

**Goal:** users can generate the greeting text instead of writing it.

**Build**

- **messages module:** `POST /api/messages/generate` (**sign-in required**, rate limited per user and IP).
- **Inputs:** occasion (derived from theme and type), tone (warm, funny, formal, short and sweet), optional relationship, names, and event details for invitations. English first, with US or UK spelling.
- **Output:** three variants per request, each within the character cap from the props schema. The user picks one and can always edit it.
- `llm.client.ts` behind an interface (default provider: Anthropic API). The prompt template lives in the messages module. User text is treated as data, never as instructions.
- **Fallback:** if the LLM fails or times out (about 15 sec), return curated static message templates and a friendly note.
- **Safety:** validate output length, strip unsafe or off-topic content, and reject empty results.
- **Cost logging:** record tokens per request.
- **Editor UI:** "Write it for me" button, tone picker, variant chooser, regenerate.

**Done when**

- Each tone gives visibly different output within the character cap.
- The API key never appears in client bundles or mobile code.
- Rate limits block abuse. A simulated LLM outage falls back cleanly.

---

## Phase 8 — Guests and personalization

The guest-link model, partial CSV review flow, live personalized page, RSVP
deep links, deletion cascade, and local verification are documented in
`docs/stage-8.md`.

**Goal:** per-guest links, guest-name-at-the-end, and RSVP by message.

**Build**

- **guests module:**
  - `POST /api/invitations/:id/guests` (single add).
  - `POST /api/invitations/:id/guests/import` (CSV). Parse in the browser, send validated JSON.
  - `GET` list, `DELETE` one, `DELETE` all.
- **Validation:** name required (about 40 chars max), optional email or phone validated, duplicates within an invitation merged, maximum 200 guests per invitation. Strip leading `=`, `+`, `-`, `@` from names to prevent spreadsheet formula injection if data is ever exported.
- **Tokens:** 128 bits from `crypto.randomBytes`, base64url, unique index, retry on the rare collision.
- **`/i/[token]`:** server loads the guest and invitation and returns a public DTO. The page plays the composition **live in the Remotion Player** with the guest's name as a prop. No per-guest MP4. If the Player fails to load, fall back to the generic rendered MP4 when one exists.
- **RSVP buttons:** "I'll be there" and "Can't make it". Each opens a prefilled message to the host:
  - Email: `mailto:` with subject and body.
  - WhatsApp: `wa.me/<digits>?text=`.
  - SMS or iMessage: `sms:` link. Handle the iOS and Android differences in the body separator.
  - The message includes the guest's name and the event title.
- **Open Graph:** title includes the guest name ("You're invited, Sam"); image is the shared poster. Page is `noindex`.
- **Dashboard guest manager:** table with name, link, copy button, WhatsApp/SMS share per guest, "copy all links as a list", add, import, delete one, delete all.
- **Retention job:** scheduled deletion of invitations, guests, and rendered files 90 days after the event date. Deleting an invitation cascades to guests, render rows, and stored files.
- Rate limit token lookups.

**Rules and edge cases**

- The host's contact method is visible to everyone with a guest link, since guests need it. Tell the host this clearly where they enter it.
- Unknown tokens return a generic not-found page that does not hint at valid tokens.
- Importing a file with bad rows reports which rows failed and imports the rest only if the user confirms.

**Done when**

- Importing 20 guests gives 20 unique links, each showing the correct name at the end of the video.
- Each RSVP button opens the right app with the right text on both Android and iPhone.
- Deleting an invitation removes its guests, render rows, and files.
- Guessing or altering tokens never reveals another guest's data.

---

## Phase 9 — Remaining themes and polish

The shared-theme implementation, local render evidence, accessibility pass, and
remaining device/deployment checks are documented in `docs/stage-9.md`.

**Goal:** all three themes in both formats, with production polish.

**Build**

- **Christmas "Evergreen & Cranberry"** and **New Year's Eve "Midnight & Champagne"** themes, each as Card and Invitation. New flora components (holly, hellebore, poinsettia, pine and eucalyptus sprigs, anemone, ranunculus, pampas). One orchestrated moment per template. No purple anywhere.
- Per-template durations set and covered by the 90-sec test.
- Picker orders themes by how close the holiday is.
- Poster stills regenerated for all templates.
- Accessibility pass on the web UI: focus states, labels, contrast, reduced motion for UI animation.
- Copy review of every message, button, error, and empty state (plain, specific, action-first).
- Cost check per template against the benchmark. Adjust pack prices if needed.
- Player performance check on a mid-range Android phone.

**Done when**

- All 6 templates (3 themes × 2 types) preview and render identically, and costs are recorded.
- Stress cases from Phase 1 pass for every template.
- The accessibility checklist passes.

---

## Phase 10 — Android shell

**Goal:** a React Native app that wraps the same hosted editor and adds native capabilities.

**Build**

- **Expo app** with TypeScript, a themed icon and splash, a package name, and EAS Build configured with Play App Signing.
- **Native Clerk sign-in** (Expo SDK, secure token storage).
- **WebView root** loading `/?embed=1` and `/create/[templateId]?embed=1`. Embed mode hides web chrome that duplicates native UI and hides web checkout.
- **Auth handoff:** after native sign-in, the app asks the backend for a one-time sign-in ticket (authenticated by the native session). The WebView opens a small `/mobile-auth?ticket=…` route that completes the web sign-in using Clerk's ticket flow. Confirm the exact flow in Clerk's docs and test it early.
- **Typed bridge** (schemas in `packages/shared`, validated with zod on both sides). Messages: `AUTH_TOKEN`, `PHOTO_PICKED`, `REQUEST_SHARE`, `REQUEST_PAYWALL`, `ENTITLEMENTS_UPDATED`. Ignore unknown messages.
- **Native photo picker:** pick, downscale, upload to the presigned URL, send the resulting URL to the WebView. If the WebView's own file input works reliably on Android, it is an acceptable simpler fallback, but confirm with the owner first.
- **Native share:** download the MP4 to cache and open the Android share sheet with the file and link.
- **WebView hardening:** allow only our origin for in-WebView navigation. Open `mailto:`, `sms:`, and `wa.me` links through the OS. Handle the hardware back button, offline and error screens, and autoplay of muted video.
- **Closed testing:** upload the first build to the Play **closed test** track as early as possible. Recruit at least 12 testers who stay opted in for 14 continuous days and actually use the app.

**Rules and edge cases**

- Google blocks OAuth in embedded WebViews, so never start Google sign-in inside the WebView.
- The WebView must never receive secrets. Only short-lived, single-use tickets.

**Done when**

- On a real Android device: sign in, pick a template, add a photo, preview, export, and share to WhatsApp, end to end.
- The WebView cannot navigate to foreign origins.
- The closed test is live and the 14-day clock is running.

---

## Phase 11 — Android billing and Play release

**Goal:** in-app purchases with the same account and entitlements, then production.

**Build**

- **Play Console products:** consumable in-app products that mirror the Polar packs.
- **RevenueCat:** products and offerings configured. The RevenueCat app user ID is set to the Clerk user ID at sign-in.
- **Native paywall screen** opened by the `REQUEST_PAYWALL` bridge message. After purchase, send `ENTITLEMENTS_UPDATED` so the web editor refetches the balance.
- **Webhook `POST /api/webhooks/revenuecat`:** verify, grant credits to the same entitlements ledger keyed by the store transaction id, idempotent.
- Web checkout stays hidden in embed mode. Digital purchases in the app go through Play Billing only.
- **Play listing:** store assets, short and full description, content rating, target audience (not children), data safety form, privacy policy URL, and the account-deletion requirement (in-app delete plus a web page for deletion).
- **Production access:** after the closed test completes, answer the production-access questionnaire and submit.

**Done when**

- A purchase on Android shows up on the web for the same account, and the reverse.
- Replayed RevenueCat webhooks never double-grant.
- Account deletion works from inside the app.
- The app is approved and live in production.

---

## Out of scope (do not build unless the owner asks)

Email sending, RSVP tracking, Google Sheets import, per-guest MP4s, per-guest custom messages, custom music upload, corporate or bulk features, a static image card tier, an iOS app, AI-generated video, a marketing site or custom domain, subscriptions, credit-based marketplace pricing.
