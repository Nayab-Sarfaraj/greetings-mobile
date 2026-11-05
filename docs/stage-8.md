# Stage 8 — Guests and personalization

Stage 8 adds stable personal links for invitation guests without creating a
guest account or rendering one MP4 per person.

## Creator flow

The dashboard shows a guest manager for invitations only. Creators can:

- add a guest with an optional email address or phone number;
- paste or upload CSV containing a required `name` column and optional
  `contact` column;
- review row-numbered errors before importing and explicitly confirm that bad
  rows should be skipped;
- copy one link, copy all links as a named list, or open WhatsApp/SMS sharing
  for guests with a phone number;
- delete one link or every guest link for the invitation.

CSV parsing runs in the browser and supports commas, escaped quotes, CRLF, and
UTF-8 BOMs. The API validates the accepted rows again. Names are normalized and
leading `=`, `+`, `-`, and `@` characters are removed to prevent spreadsheet
formula injection. Names that differ only by case are merged. Adding contact
information to an existing name updates that guest without changing the token.

## API and persistence

- `GET|POST|DELETE /api/invitations/:id/guests`
- `POST /api/invitations/:id/guests/import`
- `DELETE /api/invitations/:id/guests/:guestId`

Every route requires Clerk and checks invitation ownership in the service.
Guest tokens contain 128 random bits encoded as 22 base64url characters. Mongo
enforces unique tokens and one normalized name per invitation. Token collisions
are retried. A transaction reserves new guest slots on the invitation before
insertion, so concurrent imports cannot exceed 200 guests.

The optional guest contact remains in the creator API only. The public lookup
returns the guest name, validated invitation props, template, host RSVP contact,
and generic ready-render fallback URLs. It never returns creator identity,
guest contact, database IDs, or internal render state.

## Public invitation and RSVP

`/i/[token]` is dynamic, public, `noindex`, and has an Open Graph title such as
“You’re invited, Sam.” It plays the shared Remotion composition live with
`guestName`; the deterministic guest-name scene remains at the end. If the live
Player throws, the page shows the generic invitation MP4 when one exists.

The RSVP buttons open a prefilled message and do not send or record anything:

- email uses `mailto:` with subject and body;
- WhatsApp uses `wa.me` with normalized digits;
- SMS uses the commonly supported `&body=` form on iOS and `?body=` on Android
  and other platforms as a best-effort prefill.

The host contact is displayed because anyone with the guest link needs it to
reply. Unknown, malformed, or altered tokens use the same generic not-found
page. Lookups are limited to 120 per hashed IP per hour.

## Retention and deletion

The existing hourly retention worker deletes invitations 90 days after their
event date. Invitation deletion removes its guests, removes or detaches related
render rows, and deletes render files that no other creation references.
Account deletion also removes guest rows and stored creation data.

## Verification

- Unit tests cover CSV quoting and bad-row reporting, formula-prefix removal,
  duplicate merging, ownership, capacity errors, public DTO boundaries,
  malformed tokens, and email/WhatsApp/iOS SMS/Android SMS links.
- `scripts/verify-guests.ts` uses the isolated `greetings_stage8_test` database
  and `.media-stage8-test` directory. It imports 20 guests, confirms 20 unique
  tokens and correct per-token names, rejects an altered token, and verifies
  invitation deletion removes guest records, render rows, and the render file.
  The script cleans its database fixtures and local media afterward.
- A production-server smoke check confirmed an unknown 22-character token
  returns HTTP 404 with only the generic not-found copy and no private fields.
- Run the integration check with:

```sh
MONGODB_URI='mongodb://127.0.0.1:27017/greetings_stage8_test?replicaSet=rs0' \
LOCAL_MEDIA_DIR='./.media-stage8-test' \
pnpm --filter @greetings/web exec tsx scripts/verify-guests.ts
```

Opening the prefilled RSVP drafts in the installed WhatsApp, Messages, and mail
apps still needs final QA on a physical iPhone and Android device. The URL
builders and their platform-specific separators are covered by unit tests.
Apple's published `sms:` URL documentation only guarantees the recipient and
does not formally guarantee message-body parameters, so the user can still
review or type the response if an iOS version omits the prefill.
