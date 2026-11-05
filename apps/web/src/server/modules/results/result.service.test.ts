import { describe, expect, it, vi } from "vitest";
import { createResultService } from "./result.service";
import { resultCache } from "./result.router";
const id = "A".repeat(22);
function setup(status = "ready") {
  const find = vi.fn().mockResolvedValue({
    shareId: id,
    ownerClerkId: "private-owner",
    render: {
      status,
      fileUrl: "https://media.test/video.mp4",
      posterUrl: "https://media.test/poster.png",
      error: "private diagnostics",
      input: {
        hostContact: { value: "private@example.test" },
        props: {
          type: "invitation",
          eventTitle: "Dinner together",
          themeId: "thanksgiving",
          hostName: "Private host",
          locationText: "Private location",
        },
      },
    },
  });
  return {
    find,
    service: createResultService({ find } as unknown as Parameters<
      typeof createResultService
    >[0]),
  };
}
describe("public results", () => {
  it("returns an explicit public DTO without private data", async () => {
    const t = setup();
    expect(await t.service.get(id)).toEqual({
      shareId: id,
      status: "ready",
      type: "invitation",
      title: "Dinner together",
      theme: "thanksgiving",
      videoUrl: "https://media.test/video.mp4",
      posterUrl: "https://media.test/poster.png",
    });
  });
  it("hides file URLs and diagnostic errors until ready", async () => {
    for (const state of ["queued", "rendering", "failed"]) {
      const t = setup(state);
      const result = await t.service.get(id);
      expect(result).not.toHaveProperty("videoUrl");
      expect(result).not.toHaveProperty("posterUrl");
      expect(result).not.toHaveProperty("error");
      expect(result.status).toBe(state === "failed" ? "failed" : "processing");
    }
  });
  it("rejects malformed and missing tokens generically", async () => {
    const t = setup();
    await expect(t.service.get("bad")).rejects.toThrow("Not found");
    expect(t.find).not.toHaveBeenCalled();
    t.find.mockResolvedValue(null);
    await expect(t.service.get(id)).rejects.toThrow("Not found");
  });
  it("caches only ready responses", () => {
    expect(resultCache("ready")).toContain("s-maxage=60");
    expect(resultCache("processing")).toBe("no-store");
    expect(resultCache("failed")).toBe("no-store");
  });
});
