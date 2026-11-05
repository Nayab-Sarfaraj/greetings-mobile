import { z } from "zod";
export const checkoutInput = z
  .object({
    packId: z.string().min(1).max(40),
    invitationId: z.string().regex(/^[a-f0-9]{24}$/i),
    acceptTerms: z.literal(true),
  })
  .strict();
export const orderEvent = z.object({
  type: z.enum(["order.paid", "order.refunded", "order.updated"]),
  api_version: z.literal("2026-10"),
  data: z.object({
    id: z.uuid(),
    paid: z.boolean(),
    status: z.enum([
      "draft",
      "pending",
      "paid",
      "refunded",
      "partially_refunded",
      "void",
    ]),
    product_id: z.uuid().nullable(),
    checkout_id: z.uuid().nullable(),
    subscription_id: z.string().nullable(),
    net_amount: z.number().int().nonnegative(),
    refunded_amount: z.number().int().nonnegative(),
    currency: z.string().regex(/^[a-z]{3}$/),
    customer: z.object({ external_id: z.string().min(1).max(200).nullish() }),
  }),
});
