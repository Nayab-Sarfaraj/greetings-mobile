import { describe, expect, it, vi } from "vitest";
import { getConfig } from "./config";
describe("config", () => {
  it("names a missing required variable", () => {
    vi.stubEnv("MONGODB_URI", "");
    expect(() => getConfig()).toThrow("MONGODB_URI");
    vi.unstubAllEnvs();
  });
});
