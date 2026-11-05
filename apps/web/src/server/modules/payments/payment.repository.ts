import { DeletedBillingAccount } from "../entitlements/entitlement.model";
import { connectDb } from "../../lib/db";
import { createHash } from "node:crypto";
import {
  billingTransaction,
  changeCredits,
} from "../entitlements/entitlement.repository";
import { BillingEvent, OrderReceiptModel } from "./payment.model";
import type { Settlement } from "./payment.types";
export const paymentRepository = {
  async settle({
    order,
    credits,
    revokedCredits,
    eventId,
    environment,
  }: Settlement) {
    await connectDb();
    await Promise.all([OrderReceiptModel.init(), BillingEvent.init()]);
    return billingTransaction(async (session) => {
      const provider = `polar-${environment}`;
      if (await BillingEvent.findOne({ provider, eventId }).session(session))
        return false;
      const receipt = await OrderReceiptModel.findById(
        `${environment}:${order.id}`,
      )
        .session(session)
        .lean();
      const deleted = await DeletedBillingAccount.findById(
        createHash("sha256").update(order.owner).digest("hex"),
      )
        .session(session)
        .lean();
      if (!receipt?.detached && !deleted) {
        if (
          receipt &&
          (receipt.clerkId !== order.owner ||
            receipt.productId !== order.productId ||
            receipt.checkoutId !== order.checkoutId ||
            receipt.credits !== credits ||
            receipt.netAmount !== order.netAmount ||
            receipt.currency !== order.currency)
        )
          throw new Error("Order identity conflict");
        const revoked = Math.max(receipt?.revokedCredits ?? 0, revokedCredits);
        const prefix = `polar:${environment}:${order.id}`;
        await changeCredits(session, {
          clerkId: order.owner,
          reference: `${prefix}:grant`,
          delta: credits,
          kind: "grant",
          source: "polar",
          environment,
          productId: order.productId,
        });
        if (revoked > (receipt?.revokedCredits ?? 0))
          await changeCredits(session, {
            clerkId: order.owner,
            reference: `${prefix}:revoke:${revoked}`,
            delta: -(revoked - (receipt?.revokedCredits ?? 0)),
            kind: "revoke",
            source: "polar",
            environment,
            productId: order.productId,
          });
        await OrderReceiptModel.updateOne(
          { _id: `${environment}:${order.id}` },
          {
            $set: {
              clerkId: order.owner,
              checkoutId: order.checkoutId,
              productId: order.productId,
              credits,
              revokedCredits: revoked,
              netAmount: order.netAmount,
              currency: order.currency,
            },
          },
          { upsert: true, session },
        );
      }
      await BillingEvent.create([{ provider, eventId }], { session });
      return true;
    });
  },
};
