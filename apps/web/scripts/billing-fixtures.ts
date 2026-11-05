import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { paymentSettings, localRenderConfig } from "../src/server/lib/config";
import { checkoutRepository } from "../src/server/modules/payments/checkout.repository";
import { webhook } from "../src/server/modules/payments/payment.router";
const productId = randomUUID();
export async function order(owner: string, credits = 1) {
  const checkoutId = randomUUID();
  await checkoutRepository.save({
    _id: checkoutId,
    clerkId: owner,
    productId,
    credits,
    environment: "sandbox",
  });
  return {
    type: "order.paid",
    api_version: "2026-10",
    data: {
      id: randomUUID(),
      checkout_id: checkoutId,
      product_id: productId,
      customer: { external_id: owner },
      subscription_id: null,
      paid: true,
      status: "paid",
      net_amount: 1000,
      refunded_amount: 0,
      currency: "usd",
    },
  };
}
export async function deliver(payload: unknown, id = randomUUID()) {
  const body = JSON.stringify(payload);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createHmac("sha256", paymentSettings().webhookSecret!)
    .update(`${id}.${timestamp}.${body}`)
    .digest("base64");
  const request = new Request(
    `${localRenderConfig().appUrl}/api/webhooks/polar`,
    {
      method: "POST",
      body,
      headers: {
        "webhook-id": id,
        "webhook-timestamp": timestamp,
        "webhook-signature": `v1,${signature}`,
      },
    },
  );
  const response = process.argv.includes("--http")
    ? await fetch(request)
    : await webhook(request);
  assert.equal(response.status, 200, await response.text());
  return id;
}
