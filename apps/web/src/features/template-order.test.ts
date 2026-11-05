import { describe, expect, it } from "vitest";
import { templates } from "@greetings/remotion/templates";
import { orderTemplates } from "./template-order";

describe("template holiday ordering", () => {
  it("puts the nearest upcoming holiday first", () => {
    const ordered = orderTemplates(templates, new Date("2026-11-05T12:00:00"));
    expect(
      ordered.slice(0, 2).every((item) => item.themeId === "thanksgiving"),
    ).toBe(true);
    expect(
      ordered.slice(2, 4).every((item) => item.themeId === "christmas"),
    ).toBe(true);
  });
});
