# Render benchmarks

Local Remotion CLI renders on the development Mac, using H.264 and concurrency 2. These measure local rendering only; they do not predict AWS Lambda cost.

| Template                | Frames | Video duration | Wall time | Output size |
| ----------------------- | -----: | -------------: | --------: | ----------: |
| Thanksgiving card       |    210 |      7 seconds | 10.85 sec |    261.0 KB |
| Thanksgiving invitation |    750 |     25 seconds | 23.99 sec |    596.5 KB |
| Christmas card          |    210 |      7 seconds |  9.62 sec |    357.4 KB |
| Christmas invitation    |    750 |     25 seconds | 22.48 sec |    912.6 KB |
| New Year card           |    240 |      8 seconds | 14.98 sec |    250.0 KB |
| New Year invitation     |    750 |     25 seconds | 22.54 sec |    572.8 KB |

All six MP4s are in `artifacts/local-renders/`, which is ignored by Git. Posters were generated locally into `apps/web/public/posters/`. The six 1080×1920 poster frames were reviewed at phone proportions. Text fitting is shared across all templates and continues to enforce the card/invitation schema limits, five-line clamp, safe margins, and ellipsis for long copy.

The Lambda benchmark remains deployment work until AWS is configured. No pack-price adjustment was made from local-only timings. Record memory, `framesPerLambda`, render duration, and estimated or actual cost for each template before changing paid-pack pricing.
