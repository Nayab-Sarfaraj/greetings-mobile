import { orderEvent } from "./checkout.schema";
import { checkoutRepository } from "./checkout.repository";
import { paymentRepository } from "./payment.repository";
import { paymentSettings } from "../../lib/config";
import { validate } from "../../lib/validation";
import { ValidationError } from "../../lib/errors";
const defaults = {
  checkouts: checkoutRepository,
  repository: paymentRepository,
  environment: () => paymentSettings().environment,
};
export function createPaymentService(deps: typeof defaults) {
  return {
    async receive(eventId: string, payload: unknown) {
      const event = validate(orderEvent, payload);
      const order = event.data;
      if (
        !order.paid ||
        !["paid", "refunded", "partially_refunded"].includes(order.status) ||
        order.subscription_id ||
        !order.product_id ||
        !order.checkout_id ||
        order.net_amount <= 0
      )
        return false;
      const environment = deps.environment();
      const checkout = await deps.checkouts.get(order.checkout_id, environment);
      if (!checkout || checkout.detached) return false;
      if (
        !checkout.clerkId ||
        checkout.clerkId !== order.customer.external_id ||
        checkout.productId !== order.product_id
      )
        throw new ValidationError("Order does not match checkout");
      const credits = checkout.credits;
      const revokedCredits =
        order.status === "refunded"
          ? credits
          : Math.min(
              credits,
              Number(
                (BigInt(order.refunded_amount) * BigInt(credits) +
                  BigInt(order.net_amount) -
                  1n) /
                  BigInt(order.net_amount),
              ),
            );
      return deps.repository.settle({
        order: {
          id: order.id,
          checkoutId: order.checkout_id,
          owner: checkout.clerkId,
          productId: checkout.productId,
          paid: order.paid,
          netAmount: order.net_amount,
          refundedAmount: order.refunded_amount,
          currency: order.currency,
          subscriptionId: order.subscription_id,
        },
        credits,
        revokedCredits,
        eventId,
        environment,
      });
    },
  };
}
export const paymentService = createPaymentService(defaults);
