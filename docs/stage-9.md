# Stage 9 — Remaining themes and polish

Stage 9 completes the launch template set: three holiday themes with one card
and one invitation each. All six use the same parameterized Remotion
composition and server validation path.

## Themes and templates

| Theme          | Card             | Invitation          | Palette                    |
| -------------- | ---------------- | ------------------- | -------------------------- |
| Thanksgiving   | Harvest greeting | Harvest gathering   | Oxblood, marigold, olive   |
| Christmas      | Evergreen wishes | Evergreen gathering | Cranberry, pine, gold      |
| New Year’s Eve | Midnight toast   | Midnight gathering  | Teal, champagne, rose gold |

Theme IDs are validated props, not UI-only values. The composition chooses the
correct scene list from the card/invitation type and theme. This keeps preview,
local worker renders, public result pages, and personal guest links on the same
code path.

New inline SVG flora includes poinsettia, hellebore, holly, pine, eucalyptus,
anemone, ranunculus, and pampas alongside the existing harvest flora. The
New Year palette deliberately contains no purple.

## Picker and editor

The picker has type and holiday filters. Within either type, templates are
ordered by the nearest upcoming holiday (Thanksgiving, Christmas, then New
Year in early November). New posters were generated for every tile.

The editor, invitation API, render hashing, result pages, guests, and AI writer
all accept the same theme IDs. Curated AI fallbacks now use the selected holiday
rather than describing Christmas or New Year content as Thanksgiving.

## Accessibility and copy

- Global keyboard focus is visible for interactive controls.
- Reduced-motion preferences disable UI transitions and animation loops.
- Picker controls expose pressed state and named type/theme groups.
- Theme, type, and duration are explicit on every template tile.
- Primary picker copy now describes all holiday greetings rather than only
  Thanksgiving.

## Rendering and review

All six posters and MP4s were regenerated locally. Frame counts, durations,
wall times, and output sizes are in `docs/cost-benchmarks.md`. The six posters
were inspected at phone proportions for contrast, safe margins, and no-purple
New Year output. Template tests assert that each holiday has both a card and an
invitation, all default props validate, invitation guest names remain the final
scene, and no duration exceeds 90 seconds.

A production-server smoke check returned 200 for the picker, the Christmas
poster asset, and the New Year invitation editor. The picker source contains all
four new template identifiers.

The remaining external checks are a production Lambda cost run and playback on a
physical mid-range Android device. They require deployment/device access and do
not change the local implementation.
