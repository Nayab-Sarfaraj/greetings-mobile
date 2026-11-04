import { describe, expect, it, vi } from "vitest";
import { createRenderService, canonical } from "./render.service";
import { NotFoundError } from "../../lib/errors";
import { templates } from "@greetings/remotion/templates";
function setup() {
  const invitations = {
    get: vi.fn().mockResolvedValue({
      templateId: "harvest-card",
      props: templates[0].defaultProps,
    }),
  };
  const renders = {
    attach: vi.fn(),
    find: vi.fn().mockResolvedValue(null),
    enqueue: vi.fn().mockResolvedValue({ status: "queued" }),
    retry: vi.fn(),
    get: vi.fn(),
    sweep: vi.fn(),
  };
  const limit = vi.fn();
  const checkPhoto = vi.fn();
  const deps = { invitations, renders, limit, checkPhoto };
  return {
    ...deps,
    service: createRenderService(
      deps as unknown as Parameters<typeof createRenderService>[0],
    ),
  };
}
describe("render safeguards", () => {
  it("canonicalizes object key order", () => {
    expect(canonical({ b: 1, a: { d: 2, c: 3 } })).toBe(
      canonical({ a: { c: 3, d: 2 }, b: 1 }),
    );
  });
  it("returns cached jobs without enqueueing or consuming quota", async () => {
    const t = setup();
    const cached = { status: "ready" };
    t.renders.find.mockResolvedValue(cached);
    expect(await t.service.request("owner", "id")).toBe(cached);
    expect(t.renders.enqueue).not.toHaveBeenCalled();
    expect(t.limit).not.toHaveBeenCalled();
  });
  it("rejects foreign photos before starting work", async () => {
    const t = setup();
    t.invitations.get.mockResolvedValue({
      templateId: "harvest-card",
      props: {
        ...templates[0].defaultProps,
        photoUrl: "https://foreign.invalid/photo.jpg",
      },
    });
    t.checkPhoto.mockRejectedValue(new Error("foreign"));
    await expect(t.service.request("owner", "id")).rejects.toThrow(
      "Photo does not belong",
    );
    expect(t.renders.enqueue).not.toHaveBeenCalled();
  });
  it("keeps denied ownership checks ahead of rendering", async () => {
    const t = setup();
    t.invitations.get.mockRejectedValue(new NotFoundError());
    await expect(t.service.request("other", "id")).rejects.toThrow("Not found");
    expect(t.renders.find).not.toHaveBeenCalled();
  });
  it("blocks over-limit requests before enqueueing", async () => {
    const t = setup();
    t.limit.mockRejectedValue(new Error("limited"));
    await expect(t.service.request("owner", "id")).rejects.toThrow("limited");
    expect(t.renders.enqueue).not.toHaveBeenCalled();
  });
  it("rejects invalid saved props before enqueueing", async () => {
    const t = setup();
    t.invitations.get.mockResolvedValue({
      templateId: "harvest-card",
      props: { ...templates[0].defaultProps, message: "x".repeat(241) },
    });
    await expect(t.service.request("owner", "id")).rejects.toThrow();
    expect(t.renders.enqueue).not.toHaveBeenCalled();
  });
  it("caps failed-job retries", async () => {
    const t = setup();
    t.renders.find.mockResolvedValue({ status: "failed" });
    t.renders.retry.mockResolvedValue(null);
    await expect(t.service.request("owner", "id")).rejects.toThrow(
      "retry limit",
    );
  });
  it("separates render hashes by owner", async () => {
    const t = setup();
    await t.service.request("one", "id");
    await t.service.request("two", "id");
    expect(t.renders.enqueue.mock.calls[0][2]).not.toBe(
      t.renders.enqueue.mock.calls[1][2],
    );
  });
});
