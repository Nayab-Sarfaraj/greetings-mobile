# Stage 5 public results

Creators get a stable `/c/[shareId]` link after the first successful render. The share ID is 16 cryptographically random bytes encoded as base64url. It never changes for that creation. Later exports keep the link and expose processing, ready, or generic failure states. Draft edits do not change the public content until an export is requested.

The public page and polling API use an explicit DTO: share ID, status, type, title, theme, video URL, and poster URL. Internal identifiers, owner identity, host contact, raw input props, and render diagnostics are excluded. Metadata includes Open Graph and Twitter large-image tags using the poster, plus noindex/nofollow. Guests do not need an account.

Ready HTML uses 60-second ISR caching; the public ready API permits 60 seconds of CDN caching. The proxy rewrites processing, failed, and missing results to the dynamic `/c-live/[id]` rendering route while keeping the normal public URL in the address bar. Those responses use no-store. This split avoids Next.js's dynamic-rendering error when a processing result is requested on an ISR route. The client polls the public API and stops when ready or failed. Creator deletions invalidate the public page cache.

Download uses a public server endpoint that redirects to the media adapter's attachment response, including support for HTTP byte ranges. Sharing uses the native Web Share API when available, with a copy-link fallback. File sharing uses a prepare step followed by a fresh tap, so the share sheet retains the browser's required user activation. The page always includes a Make your own link with a recipient campaign parameter.

Verification uses an isolated `greetings_stage5_test` database and local production server. It creates a real render, checks the public DTO, verifies HTML metadata and privacy, follows the attachment redirect, checks byte-range playback responses, checks that unpublished edits stay private, exercises failure/retry and stable links, verifies uncached processing HTML and unknown-link 404s, and deletes its own fixtures.

Real iPhone Safari / Android Chrome share sheets and link previews in WhatsApp, iMessage, and X still need device QA with an externally reachable HTTPS URL. A localhost result cannot be fetched by those services.
