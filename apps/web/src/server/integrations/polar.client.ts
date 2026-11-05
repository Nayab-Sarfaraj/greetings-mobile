import { createPolar, webhooks } from "@polar-sh/sdk/2026-10";
import { paymentSettings } from "../lib/config";
import { AppError } from "../lib/errors";
import type {
  PackDefinition,
  PackOffer,
} from "../modules/payments/payment.types";
function client() {
  const config = paymentSettings();
  if (!config.accessToken)
    throw new AppError(
      "UNAVAILABLE",
      "Export packs are temporarily unavailable",
      503,
    );
  return createPolar({
    accessToken: config.accessToken,
    environment: config.environment,
    timeout: 15,
  });
}
const offers = new Map<string, { value: PackOffer; expiresAt: number }>();
export interface PolarClient {
  offer(pack: PackDefinition, fresh?: boolean): Promise<PackOffer>;
  checkout(input: {
    owner: string;
    productId: string;
    successUrl: string;
    returnUrl: string;
  }): Promise<{ id: string; url: string }>;
}
export const polarClient: PolarClient = {
  async offer(pack, fresh = false) {
    const key = `${paymentSettings().environment}:${pack.productId}:${pack.credits}`;
    const cached = offers.get(key);
    if (!fresh && cached && cached.expiresAt > Date.now()) return cached.value;
    const product = await client().products.get(pack.productId);
    const prices = product.prices.filter((price) => !price.is_archived);
    const price = prices[0];
    if (
      product.is_recurring ||
      product.is_archived ||
      prices.length !== 1 ||
      price?.amount_type !== "fixed" ||
      price.price_amount <= 0
    )
      throw new AppError(
        "UNAVAILABLE",
        "This export pack is temporarily unavailable",
        503,
      );
    const value = {
      ...pack,
      name: product.name,
      amount: price.price_amount,
      currency: price.price_currency,
    };
    offers.set(key, { value, expiresAt: Date.now() + 60000 });
    return value;
  },
  async checkout({ owner, productId, successUrl, returnUrl }) {
    const checkout = await client().checkouts.create({
      products: [productId],
      external_customer_id: owner,
      success_url: successUrl,
      return_url: returnUrl,
      allow_discount_codes: false,
      allow_trial: false,
    });
    return { id: checkout.id, url: checkout.url };
  },
};
export async function verifyPolarEvent(
  body: string,
  headers: Record<string, string>,
) {
  const secret = paymentSettings().webhookSecret;
  if (!secret)
    throw new AppError(
      "UNAVAILABLE",
      "Payments are temporarily unavailable",
      503,
    );
  return webhooks.validateEvent(body, headers, secret);
}
export { webhooks as polarWebhookErrors };
