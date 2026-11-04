# Render benchmarks

Local Remotion CLI renders on the development Mac, using H.264 and concurrency 2. These measure local rendering only; they do not predict AWS Lambda cost.

| Template                | Frames | Video duration |     Wall time | Output size |
| ----------------------- | -----: | -------------: | ------------: | ----------: |
| Thanksgiving card       |    210 |      7 seconds | 14.81 seconds |    222.9 KB |
| Thanksgiving invitation |    750 |     25 seconds | 27.43 seconds |      558 KB |

Both MP4s are in `artifacts/local-renders/`, which is ignored by Git. Posters were generated locally into `apps/web/public/posters/`. Stress stills were reviewed at 360 px width: long card message, long invitation location, and a 40-character guest name. The text stays inside the frame, with longer copy ellipsized.

The Lambda benchmark moves to Phase 4 when AWS is configured. Record memory, `framesPerLambda`, render duration, and estimated or actual cost for each template there before deciding free-tier limits and pack prices.
