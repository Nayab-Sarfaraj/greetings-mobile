import { describe, expect, it } from "vitest";
import { FPS, MAX_VIDEO_SECONDS } from "@greetings/shared";
import { cardSchema, invitationSchema } from "./schema";
import { durationInFrames, templates } from "./templates";
describe("template contract", () => {
  it("keeps every composition under 90 seconds", () => {
    for (const template of templates)
      expect(durationInFrames(template)).toBeLessThanOrEqual(
        MAX_VIDEO_SECONDS * FPS,
      );
  });
  it("validates the sample props", () => {
    for (const template of templates)
      expect(
        (template.type === "card" ? cardSchema : invitationSchema).safeParse(
          template.defaultProps,
        ).success,
      ).toBe(true);
  });
  it("rejects long messages", () => {
    const card = templates[0].defaultProps;
    expect(
      cardSchema.safeParse({ ...card, message: "x".repeat(241) }).success,
    ).toBe(false);
  });
});
