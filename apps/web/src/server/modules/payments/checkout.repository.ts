import { connectDb } from "../../lib/db";
import {
  OrderReceiptModel,
  PaymentCheckout,
  type CheckoutRecord,
} from "./payment.model";
export const checkoutRepository = {
  async receipt(owner: string, checkoutId: string) {
    await connectDb();
    return OrderReceiptModel.findOne({ clerkId: owner, checkoutId }).lean();
  },
  async save(record: Omit<CheckoutRecord, "createdAt">) {
    await connectDb();
    await PaymentCheckout.create(record);
  },
  async get(id: string, environment: "sandbox" | "production") {
    await connectDb();
    return PaymentCheckout.findOne({ _id: id, environment }).lean();
  },
  async owned(
    owner: string,
    id: string,
    environment: "sandbox" | "production",
  ) {
    await connectDb();
    return PaymentCheckout.findOne({
      _id: id,
      clerkId: owner,
      environment,
    }).lean();
  },
};
