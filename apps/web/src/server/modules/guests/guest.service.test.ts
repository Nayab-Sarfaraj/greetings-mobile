import { describe, expect, it, vi } from "vitest";
import { templates } from "@greetings/remotion/templates";
import { createGuestService } from "./guest.service";
import { GuestCapacityError } from "./guest.repository";

function setup() {
  const repository = {
    list: vi.fn().mockResolvedValue([]),
    saveBatch: vi
      .fn()
      .mockResolvedValue({ guests: [], created: 1, updated: 0 }),
    remove: vi.fn(),
    removeAll: vi.fn(),
    findPublic: vi.fn(),
  };
  const invitations = {
    get: vi.fn().mockResolvedValue({ props: templates[1].defaultProps }),
  };
  const limit = vi.fn();
  let sequence = 0;
  return {
    repository,
    invitations,
    limit,
    service: createGuestService({
      repository: repository as never,
      invitations: invitations as never,
      limit,
      token: () => `token-${sequence++}`,
    }),
  };
}

describe("guest service", () => {
  it("strips formula prefixes and merges duplicate names", async () => {
    const test = setup();
    await test.service.import("owner", "a".repeat(24), [
      { name: "=Sam" },
      {
        name: " sam ",
        contact: { method: "email", value: "sam@example.com" },
      },
    ]);
    expect(test.repository.saveBatch).toHaveBeenCalledWith(
      "a".repeat(24),
      [
        {
          name: "sam",
          nameKey: "sam",
          contact: { method: "email", value: "sam@example.com" },
          token: "token-0",
        },
      ],
      200,
    );
  });

  it("checks invitation ownership before guest queries", async () => {
    const test = setup();
    test.invitations.get.mockRejectedValue(new Error("not owned"));
    await expect(test.service.list("other", "a".repeat(24))).rejects.toThrow(
      "not owned",
    );
    expect(test.repository.list).not.toHaveBeenCalled();
  });

  it("maps transactional capacity failures to a validation error", async () => {
    const test = setup();
    test.repository.saveBatch.mockRejectedValue(new GuestCapacityError());
    await expect(
      test.service.add("owner", "a".repeat(24), { name: "Sam" }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("returns only the public invitation fields with the guest name", async () => {
    const test = setup();
    test.repository.findPublic.mockResolvedValue({
      guest: { name: "Sam" },
      invitation: {
        templateId: templates[1].id,
        props: templates[1].defaultProps,
        hostContact: { method: "email", value: "host@example.com" },
      },
      render: { fileUrl: "/video.mp4", posterUrl: "/poster.jpg" },
    });
    const result = await test.service.public("a".repeat(22), "203.0.113.4");
    expect(result.props.guestName).toBe("Sam");
    expect(result).not.toHaveProperty("contact");
    expect(result).not.toHaveProperty("invitationId");
    expect(test.limit).toHaveBeenCalledWith(
      expect.stringMatching(/^guest-link:[a-f0-9]{64}$/),
      120,
    );
  });

  it("rejects malformed tokens before querying Mongo", async () => {
    const test = setup();
    await expect(
      test.service.public("bad", "203.0.113.4"),
    ).rejects.toMatchObject({ status: 404 });
    expect(test.repository.findPublic).not.toHaveBeenCalled();
  });
});
