# Stage 6 — web payments and HD exports

## Configuration

Clerk must be configured for a creator to save a draft and start checkout. Set these in `apps/web/.env.local`:

- `POLAR_ENVIRONMENT=sandbox` while testing.
- `POLAR_ACCESS_TOKEN`: an organization token with product-read and checkout-write access.
- `POLAR_WEBHOOK_SECRET`: the signing secret for `/api/webhooks/polar`.
- `POLAR_PACKS`: JSON array of `{ "id": "single", "productId": "<actual Polar UUID>", "credits": 1 }` entries. Each product must be an active, non-recurring product with one fixed price. Prices and names are fetched from Polar, rather than invented in the app.
- `BILLING_SELLER_NAME` and `SUPPORT_EMAIL`: the real seller identity and support contact used by `/terms`, `/privacy`, and `/support`.
- `APP_BASE_URL`: this app's origin, used for checkout return URLs.

Configure the Polar webhook endpoint with API version **2026-10**, matching the SDK import. Subscribe to `order.paid`, `order.refunded`, and `order.updated`. During local development, forward signed sandbox webhooks to the local endpoint. Paid checkout remains unavailable until products, keys, and seller/support details are configured. Existing free previews and watermarked exports continue to work.

The local MongoDB container is now a single-node replica set, initialized by its health check. `docker compose up -d --wait` retains the existing `mongo-data` volume. MongoDB transactions are required for billing; an Atlas replica set also supports them. Use separate databases and credentials for production and sandbox, even though ledger balances and paid render hashes are additionally isolated by billing environment.

## Credit and render invariants

The `entitlements` collection is an append-only credit ledger. Balance reads aggregate that ledger. A materialized account balance is maintained in the same transaction so two concurrent consumers cannot both spend the last credit. Ledger references, provider order receipts, and `(provider, eventId)` webhook records have unique indexes.

Checkout sessions are created only for authenticated creators and owned drafts. The server stores the product, credit count, and owner before redirecting to Polar. Verified order events must match that checkout and the customer's Clerk external ID. Client metadata, payment flags, redirects, and credit counts are not trusted. A successful return URL alone grants nothing.

Signed webhook handling, the order grant/revocation, and the delivery record commit together. Duplicate deliveries and different event IDs for the same order do not grant twice. Refunded credit totals are monotonic, so an older paid or partial-refund event cannot restore revoked credits. Partial refunds revoke a proportional number of whole credits, rounded up; a full refund revokes the whole pack. Already-spent refunds may create a negative internal balance, which blocks new paid exports until settled. The public balance never displays a negative spendable amount. This policy appears on the Terms page and should be reviewed together with the final packs before launch.

A new HD render is queued and charged atomically. Concurrent identical requests share one job and one charge. Ready or in-progress cached jobs cost no additional credit. Each retry has a new funding sequence; failures and timeouts return that sequence's credit in the same transaction as the failed status. Stale workers cannot refund or finish a newer attempt. The worker uses the stored server tier to choose 1080p without watermark or free 720p with watermark.

Account deletion detaches raw account identifiers from financial records and closes hashed balance records in both billing environments. Deleted-account webhook replays cannot recreate a credit balance.

## UI and endpoints

The editor offers free and HD export choices, available balance, and real configured packs. Purchases require Terms acceptance and save/upload the draft before leaving the editor. Checkout returns to that saved draft. TanStack Query polls the owned checkout status for up to 30 seconds and refreshes the balance only after server confirmation; a manual recheck handles delayed webhooks.

- `GET /api/packs`: public pack catalog and availability.
- `POST /api/checkout`: authenticated checkout creation for a configured pack and owned invitation.
- `GET /api/checkout/[id]`: owned checkout confirmation and current balance.
- `GET /api/entitlements`: authenticated credit balance.
- `POST /api/webhooks/polar`: raw-body signature verification and idempotent order settlement.
- `POST /api/invitations/[id]/renders`: accepts only the requested quality; the server funds and selects the actual render tier.

Terms, Privacy, and Support are linked in the site footer and pack purchase area. The worker now runs hourly expiration cleanup for creations older than 90 days after card creation or an invitation's event date. This makes the privacy retention text match the implemented local service; the worker must remain running.

## Verification and remaining setup

`pnpm check` covers webhook validation, checkout ownership, Terms acceptance, client paid-flag rejection, public results, and render safeguards. `pnpm --filter @greetings/web build` verifies the production bundle.

The isolated local billing test signs fixture events using the real Polar verification helper and uses real MongoDB transactions and Remotion rendering:

```sh
MONGODB_URI=mongodb://127.0.0.1:27017/greetings_stage6_test LOCAL_MEDIA_DIR=./.media-stage6-test POLAR_ENVIRONMENT=sandbox POLAR_WEBHOOK_SECRET=stage6-local-test-secret pnpm --filter @greetings/web exec tsx scripts/verify-billing.ts
```

It checks replayed and out-of-order deliveries, two HD requests competing for one credit, cache reuse, 1080×1920 output, failure and timeout refunds, duplicate refund safety, partial refunds, negative-balance enforcement, free-tier flag handling, retention, and account-data detachment. Synthetic MP4/poster artifacts are saved under `artifacts/local-renders/stage6-hd.*`; fixture records and media are cleaned up. `--http` sends the same signed fixtures through a production server using the same isolated database, media directory, and test secret; it also checks legal routes and disabled-catalog behavior.

A real hosted Polar sandbox purchase and the signed-in browser checkout round trip have **not** been performed. They require the owner's sandbox products, keys, and seller/support details. Local signed fixtures verify our code, not Polar's hosted payment UI. Final pack prices and the legal contact/identity must be supplied before enabling checkout.
