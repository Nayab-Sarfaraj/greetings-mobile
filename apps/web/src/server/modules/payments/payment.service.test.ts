import { describe, expect, it, vi, afterEach } from "vitest";
import { createHmac, randomUUID } from "node:crypto";
import { createPaymentService } from "./payment.service";
import { createCheckoutService } from "./checkout.service";
import { checkoutInput } from "./checkout.schema";
import { webhook } from "./payment.router";
const productId = randomUUID(),
  checkoutId = randomUUID(),
  orderId = randomUUID();
function payload() {
  return {
    type: "order.paid",
    api_version: "2026-10",
    data: {
      id: orderId,
      checkout_id: checkoutId,
      product_id: productId,
      customer: { external_id: "owner" },
      subscription_id: null,
      paid: true,
      status: "paid",
      net_amount: 1000,
      refunded_amount: 0,
      currency: "usd",
    },
  };
}
function setup() {
  const get = vi
    .fn()
    .mockResolvedValue({ clerkId: "owner", productId, credits: 5 });
  const settle = vi.fn().mockResolvedValue(true);
  const service = createPaymentService({
    checkouts: { get },
    repository: { settle },
    environment: () => "sandbox",
  } as unknown as Parameters<typeof createPaymentService>[0]);
  return { get, settle, service };
}
afterEach(() => vi.unstubAllEnvs());
describe("Polar event validation", () => {
  it("uses the server checkout grant, not client metadata", async () => {
    const t = setup();
    await t.service.receive("event", {
      ...payload(),
      metadata: { credits: 999 },
    });
    expect(t.settle.mock.calls[0][0].credits).toBe(5);
    expect(t.settle.mock.calls[0][0].order.owner).toBe("owner");
  });
  it("ignores unpaid orders and checkouts from outside this app", async () => {
    const t = setup();
    const input = payload();
    input.data.paid = false;
    await t.service.receive("event", input);
    expect(t.settle).not.toHaveBeenCalled();
    t.get.mockResolvedValue(null);
    await t.service.receive("other", payload());
    expect(t.settle).not.toHaveBeenCalled();
  });
  it("rejects a mismatched customer identity", async () => {
    const t = setup();
    const input = payload();
    input.data.customer.external_id = "another-owner";
    await expect(t.service.receive("event", input)).rejects.toThrow(
      "does not match",
    );
    expect(t.settle).not.toHaveBeenCalled();
  });
  it("calculates partial and full refund adjustments", async () => {
    const t = setup();
    const input = payload();
    input.type = "order.refunded";
    input.data.refunded_amount = 201;
    await t.service.receive("event", input);
    expect(t.settle.mock.calls[0][0].revokedCredits).toBe(2);
    input.data.status = "refunded";
    await t.service.receive("event2", input);
    expect(t.settle.mock.calls[1][0].revokedCredits).toBe(5);
  });
  it("rejects a request with a missing or invalid signature before applying it", async () => {
    vi.stubEnv("POLAR_WEBHOOK_SECRET", "unit-test-secret");
    const response = await webhook(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify(payload()),
      }),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: {
        code: "INVALID_SIGNATURE",
        message: "Invalid webhook signature",
      },
    });
  });
  it("rejects signed malformed order data", async () => {
    const secret = "unit-test-secret";
    vi.stubEnv("POLAR_WEBHOOK_SECRET", secret);
    const id = randomUUID();
    const timestamp = String(Math.floor(Date.now() / 1000));
    const body = JSON.stringify({
      type: "order.paid",
      api_version: "2026-10",
      data: { paid: true },
    });
    const signature = createHmac("sha256", secret)
      .update(`${id}.${timestamp}.${body}`)
      .digest("base64");
    const response = await webhook(
      new Request("http://localhost", {
        method: "POST",
        body,
        headers: {
          "webhook-id": id,
          "webhook-timestamp": timestamp,
          "webhook-signature": `v1,${signature}`,
        },
      }),
    );
    expect(response.status).toBe(400);
  });
});
describe("server checkout", () => {
  function checkoutSetup(enabled = true) {
    const client = {
      offer: vi.fn().mockResolvedValue({
        id: "single",
        productId,
        credits: 1,
        name: "One export",
        amount: 499,
        currency: "usd",
      }),
      checkout: vi.fn().mockResolvedValue({
        id: checkoutId,
        url: "https://sandbox.polar.sh/checkout/example",
      }),
    };
    const invitations = {
      get: vi.fn().mockResolvedValue({ templateId: "harvest-card" }),
    };
    const repository = { save: vi.fn() };
    const settings = () => ({
      packs: [{ id: "single", productId, credits: 1 }],
      environment: "sandbox" as const,
    });
    return {
      client,
      invitations,
      repository,
      service: createCheckoutService({
        client,
        invitations,
        repository,
        enabled: () => enabled,
        settings,
        appUrl: () => "http://localhost:3000",
        limit: vi.fn(),
      } as unknown as Parameters<typeof createCheckoutService>[0]),
    };
  }
  it("requires terms acceptance and rejects arbitrary redirects", () => {
    expect(
      checkoutInput.safeParse({
        packId: "single",
        invitationId: "a".repeat(24),
        acceptTerms: false,
      }).success,
    ).toBe(false);
    expect(
      checkoutInput.safeParse({
        packId: "single",
        invitationId: "a".repeat(24),
        acceptTerms: true,
        returnUrl: "https://foreign.invalid",
      }).success,
    ).toBe(false);
  });
  it("creates a checkout tied to the authenticated creator and saved draft", async () => {
    const t = checkoutSetup();
    await t.service.create("owner", {
      packId: "single",
      invitationId: "a".repeat(24),
      acceptTerms: true,
    });
    expect(t.client.checkout.mock.calls[0][0].owner).toBe("owner");
    expect(t.client.checkout.mock.calls[0][0].productId).toBe(productId);
    expect(t.client.checkout.mock.calls[0][0].successUrl).toContain(
      "checkout_id={CHECKOUT_ID}",
    );
    expect(t.repository.save.mock.calls[0][0].clerkId).toBe("owner");
  });
  it("does not offer invented packs when billing is disabled", async () => {
    const t = checkoutSetup(false);
    expect(await t.service.catalog()).toEqual({ enabled: false, packs: [] });
    expect(t.client.offer).not.toHaveBeenCalled();
  });
  it("does not contact Polar for another creator’s draft", async () => {
    const t = checkoutSetup();
    t.invitations.get.mockRejectedValue(new Error("Not found"));
    await expect(
      t.service.create("other", {
        packId: "single",
        invitationId: "a".repeat(24),
        acceptTerms: true,
      }),
    ).rejects.toThrow("Not found");
    expect(t.client.checkout).not.toHaveBeenCalled();
  });
});
