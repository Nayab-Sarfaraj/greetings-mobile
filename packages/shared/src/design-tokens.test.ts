import { describe, expect, it } from "vitest";
import { FPS, MAX_VIDEO_SECONDS, palettes } from "./index";
describe("design system", () => {
  it("defines video constraints and three palettes", () => {
    expect(FPS).toBe(30);
    expect(MAX_VIDEO_SECONDS).toBe(90);
    expect(Object.keys(palettes)).toHaveLength(3);
  });
});
