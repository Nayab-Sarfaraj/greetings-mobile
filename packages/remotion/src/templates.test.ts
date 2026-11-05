import { describe, expect, it } from "vitest";
import { FPS, MAX_VIDEO_SECONDS, THEME_IDS } from "@greetings/shared";
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
  it("ships a card and invitation for every holiday", () => {
    expect(templates).toHaveLength(6);
    for (const themeId of THEME_IDS) {
      expect(
        templates.some(
          (item) => item.themeId === themeId && item.type === "card",
        ),
      ).toBe(true);
      expect(
        templates.some(
          (item) => item.themeId === themeId && item.type === "invitation",
        ),
      ).toBe(true);
    }
  });
  it("shows the guest name in the final scene", () => {
    expect(
      templates
        .find((template) => template.type === "invitation")
        ?.scenes.at(-1)?.id,
    ).toBe("guest-name");
  });
  it("rejects long messages", () => {
    const card = templates[0].defaultProps;
    expect(
      cardSchema.safeParse({ ...card, message: "x".repeat(241) }).success,
    ).toBe(false);
  });
});
