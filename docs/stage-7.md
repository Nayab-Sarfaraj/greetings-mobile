# Stage 7 — AI message writer

Stage 7 adds an authenticated message writer to both Thanksgiving editors. It
uses the same 240-character cap as the Remotion props schema and always returns
three editable suggestions.

## Configuration

The provider is optional in local development:

```env
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-haiku-5-5
```

When the key is absent, invalid, unavailable, or slower than 15 seconds, the
API returns curated suggestions with a visible fallback note. The key is read
only by the server config module and never enters client props or bundles.

## Request flow

- `POST /api/messages/generate` requires a Clerk session.
- The router accepts at most 16 KiB and validates a strict Zod schema.
- Theme and creation type determine the occasion; callers cannot provide an
  arbitrary prompt.
- User data is JSON-serialized and identified as inert data in the system
  instruction. The provider must return a JSON-schema-constrained object.
- The service normalizes text and rejects empty, over-cap, duplicate, URL,
  markup, prompt-injection-like, or overtly unsafe results.
- User limits are 12 requests per hour; IP limits are 30 per hour. Mongo TTL
  counters enforce both before the provider is called.
- The `message_usage` collection stores the account identifier, provider,
  model, input/output token counts, latency, outcome, and timestamp. It does not
  store prompts, names, event details, or generated suggestions. Account
  deletion removes these usage rows.

## Editor behavior

The writer appears directly under the message field. Anonymous visitors are
asked to sign in without losing their current editor state. Signed-in users can
choose warm, funny, formal, or short-and-sweet tone; US or UK spelling; and an
optional relationship. Selecting an idea copies it into the normal editable
message field and updates the live Remotion preview.

The client mutation uses TanStack Query. It exposes loading, error, fallback,
success, selection, and regeneration states.

## Verification

- Unit coverage exercises every curated tone, length and uniqueness checks,
  provider token accounting, unsafe and duplicate output rejection, provider
  outage fallback, missing-key behavior, and user/IP rate limits.
- The integration client test verifies the current Anthropic Messages request,
  structured-output schema, version header, server authorization header, and
  usage mapping without making a network request.
- `pnpm check` covers typecheck, lint, tests, formatting, and React singleton
  resolution. `pnpm --filter @greetings/web exec next build --webpack`
  validated the production route and client bundle; webpack was used because
  this execution sandbox prevents Turbopack's CSS worker from binding a port.
- A local production smoke check returned 200 for the card editor and showed
  the explicit unavailable state expected when Clerk is not configured. The
  unauthenticated message endpoint returned the standard 503 envelope in that
  configuration instead of exposing generation publicly.

A real Anthropic response remains to be checked after a development API key is
added. No provider credential was available during this implementation.
