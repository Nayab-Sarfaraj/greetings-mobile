# Phase 1–2 local QA

- Passed: Remotion lists `harvest-card` at 210 frames and `harvest-invitation` at 750 frames, both 1080×1920 at 30 fps.
- Passed: Both compositions rendered to local H.264 MP4 files.
- Passed: Still images at 360 px width were reviewed for a maximum-length card message, invitation location, and guest name. Long copy is kept inside the frame and ellipsized where necessary.
- Passed: `pnpm check` and `pnpm --filter @greetings/web build`.
- Pending: interactive editor check on a 360 px browser viewport, including photo selection, draft reload, controls, and form errors. The browser approval gate declined access to the local origin; no interactive browser review was performed.
- Deferred by owner: Lambda timing and cost comparison until AWS is configured for the Phase 4 render pipeline.
