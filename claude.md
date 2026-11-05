# CLAUDE.md — CherryQube (Seasonal Cards & Video Invitations)

Read this whole file before writing code. It records every product and technical decision made so far. If a request conflicts with this file, say so and ask before deviating. When a decision changes, update this file in the same commit.

Sections marked **LOCKED** were decided by the owner. Sections marked **DEFAULT** are recommended defaults that have not been explicitly confirmed. Follow them unless told otherwise, and flag when you deviate.

---

## 1. Product (LOCKED)

An app for creating **animated greeting cards** and **video invitations** from pre-made templates, for the US/UK/EU holiday season: **Thanksgiving (Nov 26, 2026), Christmas, and New Year's Eve**.

- **Animated card** = a short video (about 5–8 sec) from a card template. It is not a static image and there is no separate still-image system.
- **Video invitation** = a longer video. 20–30 sec is the sweet spot. Each template defines its own length. **No video may exceed 90 sec.**
- There is **no AI video generation**. Everything is template-driven. AI is only used to write the message text.
- Both formats are offered for every holiday theme. One template list, filtered by type (Card / Invitation). The type changes the fields shown and the duration, not the pipeline.
- Rendering uses **Remotion**. Preview uses the **Remotion Player** before any render happens.
- The finished card or video is shown on a shareable web page.

### Launch content

3 holiday themes (Thanksgiving, Christmas, New Year's Eve), each as Card and Invitation. All templates share one parameterised composition package. Do not build separate compositions per theme where props and a theme object can do it.

---

## 2. Platforms and rollout (LOCKED)

1. **Web first** (Next.js), mobile-responsive.
2. **Android app second** (React Native), a thin shell that loads the **same hosted web editor in a WebView**. No native editor screens. iOS is not planned.
3. **No marketing website and no custom domain at launch.** Host on a free `*.vercel.app` address. Web only needs these routes: template picker (`/`), editor, result page, guest page, and a creator dashboard.
4. **Android timing:** the Play developer account was created in 2026. If it is a personal account, Google requires a closed test with 12 opted-in testers for 14 continuous days before production access, plus review. Android realistically ships after Thanksgiving. Keep Android work out of the web critical path.

---

## 3. Stack (LOCKED unless marked DEFAULT)

| Area             | Choice                                                                  |
| ---------------- | ----------------------------------------------------------------------- |
| Web              | Next.js (App Router), TypeScript                                        |
| Mobile           | React Native (Expo is the DEFAULT), TypeScript                          |
| Video            | Remotion (`remotion`, `@remotion/player`, `@remotion/lambda`)           |
| Rendering        | Remotion Lambda (AWS). Output goes to S3                                |
| Auth             | Clerk                                                                   |
| Database         | MongoDB (Mongoose is the DEFAULT ODM; Atlas free tier for dev)          |
| Payments, web    | Polar                                                                   |
| Payments, app    | RevenueCat (Google Play Billing underneath)                             |
| Validation       | Zod (DEFAULT)                                                           |
| Client API state | TanStack Query (`@tanstack/react-query`, formerly React Query) (LOCKED) |
| Styling, web     | Tailwind CSS (DEFAULT) with design tokens from the shared package       |
| Monorepo         | pnpm workspaces + Turborepo (DEFAULT)                                   |
| Hosting          | Vercel for Next.js; AWS for Lambda and S3                               |

---

## 4. Repository structure (DEFAULT)

```
/
├─ CLAUDE.md
├─ apps/
│  ├─ web/                      # Next.js
│  │  └─ src/
│  │     ├─ app/                # routes only: pages + thin route.ts files
│  │     │  ├─ (public)/c/[id]/         # result page (card or video)
│  │     │  ├─ (public)/i/[token]/      # per-guest invitation page
│  │     │  ├─ (app)/page.tsx           # template picker
│  │     │  ├─ (app)/create/[templateId]/
│  │     │  ├─ (app)/dashboard/
│  │     │  └─ api/                     # route.ts files re-export module routers
│  │     ├─ components/         # shared UI primitives
│  │     ├─ features/           # feature folders (editor, preview, guests, share, paywall)
│  │     │  └─ editor/
│  │     │     ├─ components/
│  │     │     ├─ hooks/
│  │     │     └─ index.ts
│  │     ├─ server/             # all backend code (never imported by client components)
│  │     │  ├─ modules/
│  │     │  │  ├─ invitations/
│  │     │  │  │  ├─ invitation.router.ts
│  │     │  │  │  ├─ invitation.service.ts
│  │     │  │  │  ├─ invitation.repository.ts
│  │     │  │  │  ├─ invitation.model.ts
│  │     │  │  │  ├─ invitation.schema.ts     # zod: input/output
│  │     │  │  │  ├─ invitation.mapper.ts     # model → DTO
│  │     │  │  │  └─ invitation.types.ts
│  │     │  │  ├─ guests/
│  │     │  │  ├─ renders/
│  │     │  │  ├─ entitlements/
│  │     │  │  ├─ messages/                  # AI message generation
│  │     │  │  ├─ uploads/
│  │     │  │  └─ webhooks/                  # polar, revenuecat, clerk, remotion
│  │     │  ├─ integrations/    # one wrapper per external service, behind an interface
│  │     │  │  ├─ remotion-lambda.client.ts
│  │     │  │  ├─ storage.client.ts          # S3
│  │     │  │  ├─ llm.client.ts
│  │     │  │  ├─ polar.client.ts
│  │     │  │  └─ revenuecat.client.ts
│  │     │  ├─ lib/             # db connection, logger, errors, rate-limit, ids, config
│  │     │  └─ middleware/      # auth guard, error handler, request validation
│  │     └─ lib/                # client-side utilities
│  └─ mobile/                   # React Native
│     └─ src/
│        ├─ screens/            # thin: auth, home, editor-webview, paywall, share
│        ├─ components/
│        ├─ services/           # bridge, billing (RevenueCat), auth (Clerk), share, media-picker
│        ├─ hooks/
│        ├─ navigation/
│        └─ theme/
└─ packages/
   ├─ remotion/                 # compositions, scenes, templates, floral assets, themes
   │  └─ src/
   │     ├─ compositions/       # one parameterised composition per type (card, invitation)
   │     ├─ scenes/             # Intro, Details, GuestName, Closing
   │     ├─ templates/          # registry: id, type, theme, duration, default props
   │     ├─ themes/             # per-holiday theme objects
   │     ├─ assets/florals/     # inline SVG React components
   │     └─ schema/             # zod props schema
   └─ shared/                   # types, zod schemas, constants, design tokens, bridge message types
```

---

## 5. Code architecture rules (MANDATORY, production grade)

### Backend layering

`router → service → repository → model`, with external calls through `integrations/`.

- **Router** (`*.router.ts`): parse and validate input with zod, resolve the authenticated user, call one service method, map the result to a DTO, return the response. No business logic, no DB calls. `app/api/**/route.ts` files only re-export handlers from these routers.
- **Service** (`*.service.ts`): all business rules, authorization (ownership checks), orchestration across repositories and integrations. Services never import from routers and never touch Mongoose models directly.
- **Repository** (`*.repository.ts`): the only place that talks to MongoDB. Queries and persistence only, no business rules. Return plain objects or typed documents, never leak Mongoose internals above this layer.
- **Model** (`*.model.ts`): Mongoose schemas and indexes.
- **Schema** (`*.schema.ts`): zod schemas for request/response. Share them with the client via `packages/shared` where useful.
- **Mapper** (`*.mapper.ts`): model → DTO. Never return raw DB documents from an API.
- **Integrations**: each external service (Remotion Lambda, S3, LLM, Polar, RevenueCat) is wrapped in a small client with a typed interface so it can be mocked and swapped.
- Dependency direction only goes downward. No circular imports. Use dependency injection (constructor or factory arguments) for services and repositories so they are testable.

### Conventions

- TypeScript `strict`. No `any` without a comment explaining why.
- File names: kebab-case. Suffix by role: `.router.ts`, `.service.ts`, `.repository.ts`, `.model.ts`, `.schema.ts`, `.mapper.ts`, `.types.ts`, `.client.ts`.
- Limits: components under about 150 lines, other files under about 300. Split when they grow.
- Typed errors: a base `AppError` with subclasses (`NotFoundError`, `ForbiddenError`, `ValidationError`, `RateLimitError`, `PaymentRequiredError`). One error-handling middleware maps them to a consistent JSON envelope (`{ error: { code, message } }`).
- Config: a single validated `config` module reads env vars (zod-validated at startup). No `process.env` anywhere else.
- Logging: a structured logger. No `console.log` in committed code. Never log PII (guest names, emails, tokens).
- No dead code, no commented-out code, no `TODO` placeholders without an issue note.
- Add a dependency only with a clear reason. Prefer what is already in the stack.

### Frontend rules (web and mobile)

- Break UI into small components. Separate presentational components from data and logic. Put data fetching and side effects in hooks (`useInvitation`, `useRender`, `useGuests`), not inside JSX-heavy components.
- Server Components by default in Next.js. Client Components only where needed (Player, editor, interactive controls).
- Organise by feature (`features/editor`, `features/guests`, and so on) with an `index.ts` public surface. Shared primitives go in `components/`.
- No business logic in components. No duplicated fetch logic. Use one typed API client layer.
- Use TanStack Query for client-side API queries and mutations on web and mobile, through feature hooks backed by the typed API client. It owns server-state caching, loading/error states, polling, and invalidation after mutations. Server-side integrations remain in the backend layers.
- Every screen handles loading, empty, error, and success states with clear copy.
- Accessibility floor: keyboard focus visible, labels on inputs, sufficient contrast, `prefers-reduced-motion` respected for UI motion.

---

## 6. Domain model (MongoDB)

Identity is the **Clerk user ID** everywhere (LOCKED).

- `users`: `clerkId` (unique), `createdAt`.
- `invitations`: `ownerClerkId`, `type` (`card` | `invitation`), `templateId`, `props` (validated by the zod props schema), `hostContact` (`method`: `email` | `whatsapp` | `sms`, `value`), `status`, `createdAt`. Index on `ownerClerkId`.
- `guests`: `invitationId`, `name`, `token` (unique), optional `contact`, `createdAt`. Index on `token` and `invitationId`.
- `renders`: `invitationId`, `propsHash`, `kind` (`watermarked` | `final` | `poster`), `status`, `lambdaRenderId`, `bucket`, `fileUrl`, `error`, `createdAt`. Index on `propsHash`.
- `entitlements`: `clerkId`, `source` (`polar` | `revenuecat`), `productId`, `credits` or pack info, `externalId` (unique, for idempotency), `createdAt`.
- `webhook_events`: `provider`, `eventId` (unique). Used to make every webhook idempotent.

Short, opaque ids for public links: `/c/[id]` uses a nanoid. `/i/[token]` uses at least 128 bits of cryptographic randomness (`crypto.randomBytes`), base64url.

---

## 7. Remotion rules

- All compositions live in `packages/remotion` and are imported by the web app (Player), the Lambda site bundle (render), and nothing else. **The preview and the final render must come from the exact same code.**
- Two parameterised compositions: `Card` and `Invitation`. A **template** = composition + theme object + default props + duration, registered in `templates/`.
- Props are defined by a zod schema. Validate on the server before every render.
- Duration is set **per template** (cards 5–8 sec, invitations 20–30 sec typical, hard cap 90 sec). Enforce the cap in the template registry with a test. Compute duration via `calculateMetadata` so it is never hard-coded in the Player.
- Build invitations from **scenes** (Intro, Details, GuestName, Closing) so length comes from the template's scene list.
- Fonts: load with `@remotion/google-fonts` and wait for them before the first frame renders. No fallback-font flash.
- Floral artwork is authored as **inline SVG React components** (reusable `Bloom`, `Leaf`, `Vine`, `Wreath` with variant props). No stock rasters, no external image hosts. This keeps renders deterministic and small.
- Photos arrive as URLs (uploaded to S3), already downscaled. Never pass raw camera-resolution images into a composition.
- The composition must be pure and deterministic: no `Math.random()` without a seed, no network calls during render, no `Date.now()`.

---

## 8. Render pipeline (LOCKED: Remotion Lambda)

During local development, authenticated uploads use local file storage and a separate Remotion worker processes MongoDB jobs. This adapter exercises validation, ownership, caching, watermarking, retries, and polling without AWS. Lambda, S3, and webhook setup remain the production target.

- Render only when the user exports, shares, or downloads. Preview is always the Player, which costs nothing.
- Flow: client requests render → service validates props and entitlements → computes `propsHash` → returns the cached render if one exists → otherwise starts a Lambda render and stores a `renders` row → completion arrives through the Remotion webhook (verify the signature) → status updates → the client polls or subscribes for status.
- **Cache renders by props hash** so identical inputs never re-render.
- **Free tier:** watermark baked into the render (DEFAULT: 720p). **Paid:** no watermark (DEFAULT: 1080p).
- **Abuse control:** per-user and per-IP rate limits on render requests. Reject over-cap requests before touching Lambda.
- Cost control: tune Lambda memory and `framesPerLambda` using test renders; log `estimatePrice` or actual cost info per render; add an AWS budget alarm; request a Lambda concurrency limit increase before launch.
- Also render a **poster still** per invitation (Remotion still render) to use as the Open Graph image.
- Render output is stored in S3. Delivering through a CDN or R2 later is an optimisation (DEFAULT: not at launch).

---

## 9. Result and guest pages (LOCKED)

### `/c/[id]` — result page (card or video)

- One page for both types. Checks `type` and shows the rendered video with a `<video>` tag (autoplay muted, tap to unmute).
- Buttons: download, Web Share API (opens the native share sheet on phones), and a **"Make your own"** call to action (the growth loop).
- Open Graph tags (`og:title`, `og:description`, `og:image` from the poster still) so link previews work in WhatsApp, iMessage, and X. `og:video` is optional, since many apps ignore it.
- Public, no account needed.

### `/i/[token]` — per-guest invitation (LOCKED)

- Each guest gets a **unique link**. The token identifies the guest, so **no email entry or email-match gate**. An optional "private event" gate can be considered later, not now.
- The page loads the guest and plays the composition **live in the Remotion Player** with the guest's name as a prop. The name appears **at the end of the video** (LOCKED: name only for now, no other per-guest content).
- **No per-guest MP4 is rendered.** Render a generic MP4 only for download or sharing outside the page. Per-guest MP4s are a possible paid feature later.
- Open Graph title can include the guest's name; the image stays the shared poster.
- Public, no account needed.

### RSVP (LOCKED)

No RSVP tracking on our side. The page shows a button that opens a prefilled message to the host via `mailto:`, `wa.me`, or `sms:` (covers email, WhatsApp, iMessage). The host's method and value are set at creation. The prefilled message includes the guest's name.

### Creator tools for guests

- Add guests manually or by **CSV upload/paste** (LOCKED for launch). **Google Sheets import is later**, since it needs OAuth and verification.
- The dashboard lists per-guest links with **copy** and **WhatsApp/SMS share** buttons. **We do not send emails** at launch.
- Provide **delete invitation and all its guests**.

---

## 10. Auth (LOCKED: Clerk)

- Creators have accounts. **Guests never need one.**
- **Low-friction gating:** anyone can open the picker, edit, and preview without signing in. Require sign-in only at render, export, or purchase.
- Clerk user ID is the identity used in MongoDB, the Polar customer external ID, and the RevenueCat app user ID, so entitlements sync across web and app.
- **Mobile:** sign in natively with Clerk's Expo SDK, then hand a short-lived session to the WebView. Google blocks OAuth inside embedded WebViews, so never run Google sign-in inside the WebView. Verify the handoff on the server and test it on a real Android device early.
- Verify Clerk sessions in the server middleware on every protected route. Verify Clerk webhook signatures.

---

## 11. Payments (LOCKED providers)

- **Web: Polar. App: RevenueCat.** Both feed one `entitlements` collection through verified, idempotent webhooks (`webhook_events` unique on provider + eventId).
- **Model (DEFAULT):** one-time packs, not subscriptions, since the season is short. Suggested starting price points: about $3–5 per card/video, about $9–15 for a bundle. Confirm after measuring real render cost.
- Launch with Polar on web. Add RevenueCat when the Android app ships. Digital purchases inside the Play app must go through Google Play Billing.
- In the WebView editor, the paywall is **native**. On purchase success the app refreshes entitlements from the backend, and the web editor reads entitlements from the same API.
- Services check entitlements, never the client. Never trust a client-supplied "paid" flag.

---

## 12. AI message generation (DEFAULT provider)

- Server-side only. Keys never reach the client or the mobile app.
- Input: occasion, tone, names, optional details. Output: a short message with a length cap.
- Put the LLM behind `llm.client.ts` so the provider can be swapped (DEFAULT: Anthropic API).
- Validate output length, strip unsafe content, rate limit per user and IP, and let the user always edit the text.

---

## 13. Uploads

- One photo per card or invitation. Client-side downscale (about 1600px max edge), server validates MIME type (jpeg/png/webp) and size (about 8 MB max), strips EXIF location data.
- Use presigned S3 upload URLs. The composition receives only the resulting URL.
- Mobile: native photo picker uploads to the presigned URL, then passes the URL to the WebView over the bridge.

---

## 14. Mobile bridge (WebView)

- The shell loads `/create/[templateId]?embed=1`. Embed mode hides web chrome that duplicates native UI.
- Typed `postMessage` protocol defined in `packages/shared` (message types such as `PHOTO_PICKED`, `REQUEST_SHARE`, `REQUEST_PAYWALL`, `AUTH_TOKEN`, `ENTITLEMENTS_UPDATED`). Validate every message with zod on both sides. Ignore unknown messages.
- Native owns: Clerk sign-in, photo picker, share sheet, paywall and purchases.

---

## 15. Design direction (MANDATORY)

### What to avoid

**No purple.** No violet, indigo, or lavender gradients, no purple-to-blue washes, no glowing neon, no glassmorphism blobs, no generic "AI SaaS" look. Avoid the default combination of pale cream with a terracotta/clay accent. Avoid the card-grid kit where everything is an identical rounded card with the same soft grey shadow. Avoid all-caps eyebrow labels above every heading, numbered markers where content is not a sequence, and emoji used as icons.

### Concept

A warm, handmade **autumn and year-end** feel with **floral** artwork: pressed flowers, botanical illustration, gouache and paper-cut texture. Each holiday theme has its own palette and flora, all sharing one system so the app feels unified.

### Theme palettes (tokens, adjust within the spirit)

**Thanksgiving "Harvest"**

- Oxblood `#5E1F26`, marigold `#E3A72F`, olive `#6E7B3A`, pumpkin `#C9642B`, oat paper `#EFE3CC`, walnut ink `#2A1D17`
- Flora: dahlia, chrysanthemum, sunflower, wheat, oak and maple leaves

**Christmas "Evergreen & Cranberry"**

- Cranberry `#8E1B2E`, pine `#1F4B3A`, deep spruce `#12302A`, antique gold `#C9A24A`, ivory `#F3EBDD`
- Flora: holly, hellebore, poinsettia, pine and eucalyptus sprigs, berry wreaths

**New Year's Eve "Midnight & Champagne"**

- Ink teal `#0E2A2D`, champagne `#E7D3A1`, rose gold `#C98B78`, ivory `#F6F0E4`
- Flora: white anemone, ranunculus, dried pampas, winter blooms. Keep darks teal or green-black, never purple-leaning navy.

Keep one `design-tokens.ts` in `packages/shared` as the single source for web (Tailwind), mobile (theme), and Remotion (themes). No hard-coded hex values in components.

### Typography

- Display: a soft, characterful serif (DEFAULT: Fraunces; alternative: Cormorant Garamond).
- Body: a humane sans (DEFAULT: Figtree).
- Script accent, used **only** for the guest-name moment: Pinyon Script (DEFAULT).
- Define a clear type scale. Keep line lengths under about 80 characters. Give serif body text slightly more line height. Do not highlight a single word in a headline with a different color or italic.

### Layout and motion

- Florals frame the content as corner clusters, borders, and wreaths. Content stays readable on top.
- Spend boldness in one place per template: a single orchestrated moment (for example flowers blooming around the title, or the guest's name being written in script). Everything else stays calm.
- Background motion is gentle and sparse (drifting petals or leaves), never busy.
- Cards and invitations must stay legible at phone size. Test the Player at 360px wide.
- For the web UI: vary radius and shadow by hierarchy, use real content and plain, specific copy ("Download video", "Copy guest link"), and keep error and empty states helpful.
- Respect `prefers-reduced-motion` in the app UI (video content is exempt).

---

## 16. Security and privacy

- Validate all input with zod at the router. Check ownership in the service layer on every read and write of an invitation, guest, or render.
- Rate limit: render requests, AI messages, uploads, guest creation, token lookups.
- Verify signatures on all webhooks (Polar, RevenueCat, Clerk, Remotion). Make every handler idempotent.
- Public pages (`/c/[id]`, `/i/[token]`) expose only what the page needs. No owner IDs, other guests, or contact details.
- Guest data is personal data (UK/EU users): store only what is needed (name, optional contact), provide delete, never log it, and do not use it for anything else.
- Secrets only in env vars. Never commit keys. Never expose server keys to the client or mobile app.

---

## 17. Environment variables (names only)

`MONGODB_URI`, `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `REMOTION_AWS_FUNCTION_NAME`, `REMOTION_SERVE_URL`, `S3_BUCKET`, `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, `POLAR_ENVIRONMENT`, `POLAR_PACKS`, `BILLING_SELLER_NAME`, `SUPPORT_EMAIL`, `REVENUECAT_WEBHOOK_SECRET`, `REVENUECAT_API_KEY`, `LLM_API_KEY`, `APP_BASE_URL`. Validate all of them in the config module.

---

## 18. Testing and quality gates

- Unit tests for services (repositories and integrations mocked). Repository tests against an in-memory or test MongoDB. Test the zod props schema, the 90-second cap, entitlement checks, and webhook idempotency.
- Required before any commit: typecheck, lint, format, tests.
- Small, focused commits with conventional messages (`feat:`, `fix:`, `refactor:`).

---

## 19. Build order

1. Monorepo scaffold, config, logger, error handling, DB connection.
2. `packages/remotion`: theme tokens, floral SVG components, one template (card and invitation).
3. Editor and Player preview with local Remotion test renders. Measure Lambda cost and speed when AWS is configured for the Phase 4 render pipeline.
4. Render pipeline: validation, props hash cache, webhook, status.
5. Result page `/c/[id]` with Open Graph tags, download, Web Share, "Make your own".
6. Clerk auth with sign-in only at export and purchase.
7. Polar checkout plus entitlements and the watermark gate.
8. AI message generation.
9. Guests: manual add, CSV import, `/i/[token]`, RSVP button, link sharing, deletion.
10. Remaining templates (all three themes, both types).
11. Expo shell with WebView editor, native auth, picker, share, then RevenueCat.
12. Closed test and production release on Play. Start the closed test early if the account is personal.

---

## 20. Out of scope for launch

Email sending, RSVP tracking, Google Sheets import, per-guest MP4s, per-guest custom messages, custom music upload, corporate or bulk features, a static image card tier, iOS app, AI-generated video, a marketing site or custom domain, credit-based pricing, and subscriptions.

---

## 21. Verify before launch

- Remotion license terms for commercial use.
- Real Lambda cost per render for each template, then set free-tier limits and pack prices.
- Polar payout support for the owner's country.
- Play developer account type (personal vs organization) and closed-test status.
- Open Graph previews actually render in WhatsApp, iMessage, and X.
- The WebView auth handoff on a real Android device.

---

## 22. Working agreements for Claude Code

- Plan before large changes: state the files you will touch and why.
- Follow the layering rules in section 5 without exception. If a shortcut seems necessary, ask first.
- Keep files and components small. Extract before they grow.
- Do not add features outside this file's scope. Raise them instead.
- Do not leave placeholders, mocked production paths, or hard-coded secrets.
- Run typecheck, lint, and tests before declaring a task done, and say what you ran.
- When a decision here is unclear, ask a short question instead of guessing.
