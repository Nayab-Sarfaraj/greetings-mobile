import { incrementCounter } from "../modules/rate-limits/rate-limit.repository";
import { RateLimitError } from "./errors";
export async function rateLimit(key: string, max: number, windowMs = 3600000) {
  const bucket = Math.floor(Date.now() / windowMs);
  const counter = await incrementCounter(
    `${key}:${bucket}`,
    new Date((bucket + 1) * windowMs),
  );
  if (!counter || counter.count > max) throw new RateLimitError();
}
