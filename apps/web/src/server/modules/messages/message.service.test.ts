import { describe, expect, it, vi } from "vitest";
import { createMessageService } from "./message.service";
import type { MessageInput } from "./message.schema";

const base: MessageInput = {
  type: "card",
  themeId: "thanksgiving",
  tone: "warm",
  spelling: "us",
  senderName: "Alex",
  recipientName: "Sam",
};

function setup(generate?: () => Promise<never>) {
  const limit = vi.fn();
  const record = vi.fn();
  const client = generate
    ? { generate }
    : {
        generate: vi.fn().mockResolvedValue({
          variants: [
            "*Warm Thanksgiving wishes*",
            "Grateful to celebrate with you",
            "Wishing you a happy Thanksgiving",
          ],
          inputTokens: 42,
          outputTokens: 18,
          model: "test-model",
        }),
      };
  return {
    limit,
    record,
    service: createMessageService({
      client: () => client,
      limit,
      record,
      now: (() => {
        let now = 100;
        return () => (now += 10);
      })(),
    }),
  };
}

describe("message generation", () => {
  it("returns three distinct, bounded curated variants for every tone", async () => {
    for (const tone of ["warm", "funny", "formal", "short-sweet"] as const) {
      const test = setup(async () => {
        throw new Error("offline");
      });
      const result = await test.service.generate("owner", "127.0.0.1", {
        ...base,
        tone,
      });
      expect(result.source).toBe("curated");
      expect(result.variants).toHaveLength(3);
      expect(new Set(result.variants).size).toBe(3);
      expect(result.variants.every((item) => item.length <= 240)).toBe(true);
    }
  });

  it("uses the selected holiday in curated fallbacks", async () => {
    const test = setup(async () => {
      throw new Error("offline");
    });
    const result = await test.service.generate("owner", undefined, {
      ...base,
      themeId: "christmas",
    });
    expect(result.variants.every((item) => /christmas/i.test(item))).toBe(true);
    expect(result.variants.join(" ")).not.toMatch(/thanksgiving/i);
  });

  it("cleans valid provider output and records token usage", async () => {
    const test = setup();
    const result = await test.service.generate("owner", undefined, base);
    expect(result).toEqual({
      source: "ai",
      variants: [
        "Warm Thanksgiving wishes",
        "Grateful to celebrate with you",
        "Wishing you a happy Thanksgiving",
      ],
    });
    expect(test.record).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "anthropic",
        inputTokens: 42,
        outputTokens: 18,
        outcome: "generated",
      }),
    );
  });

  it("falls back on unsafe or duplicate output", async () => {
    const test = setup();
    const client = {
      generate: vi.fn().mockResolvedValue({
        variants: ["https://bad.example", "same", "same"],
        inputTokens: 1,
        outputTokens: 1,
        model: "test-model",
      }),
    };
    const service = createMessageService({
      client: () => client,
      limit: test.limit,
      record: test.record,
      now: Date.now,
    });
    expect((await service.generate("owner", undefined, base)).source).toBe(
      "curated",
    );
    expect(test.record).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: "fallback" }),
    );
  });

  it("enforces user and IP limits before provider work", async () => {
    const test = setup();
    await test.service.generate("owner", "203.0.113.4", base);
    const ownerHash =
      "4c1029697ee358715d3a14a2add817c4b01651440de808371f78165ac90dc581";
    const ipHash =
      "5aa23fc6904a74c72a2a2a9067fc55d767282046799c2e98a281bb73575ce65d";
    expect(test.limit.mock.calls).toEqual([
      [`messages:user:${ownerHash}`, 12],
      [`messages:ip:${ipHash}`, 30],
    ]);
  });

  it("does not call the provider after a rate-limit rejection", async () => {
    const generate = vi.fn();
    const service = createMessageService({
      client: () => ({ generate }),
      limit: vi.fn().mockRejectedValue(new Error("limited")),
      record: vi.fn(),
      now: Date.now,
    });
    await expect(service.generate("owner", undefined, base)).rejects.toThrow(
      "limited",
    );
    expect(generate).not.toHaveBeenCalled();
  });
});
