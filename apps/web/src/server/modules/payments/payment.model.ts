import mongoose, { Schema } from "mongoose";
export interface OrderReceipt {
  _id: string;
  checkoutId: string;
  clerkId?: string;
  productId: string;
  credits: number;
  netAmount: number;
  currency: string;
  revokedCredits: number;
  detached?: boolean;
}
const receiptSchema = new Schema<OrderReceipt>(
  {
    _id: String,
    checkoutId: { type: String, index: true },
    clerkId: { type: String, index: true },
    productId: String,
    credits: Number,
    netAmount: Number,
    currency: String,
    revokedCredits: { type: Number, default: 0 },
    detached: Boolean,
  },
  { collection: "polar_orders" },
);
export const OrderReceiptModel =
  (mongoose.models.PolarOrder as mongoose.Model<OrderReceipt>) ||
  mongoose.model<OrderReceipt>("PolarOrder", receiptSchema);
const eventSchema = new Schema<{
  provider: string;
  eventId: string;
  createdAt: Date;
}>(
  {
    provider: String,
    eventId: String,
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "webhook_events" },
);
eventSchema.index({ provider: 1, eventId: 1 }, { unique: true });
export const BillingEvent =
  (mongoose.models.BillingEvent as mongoose.Model<{
    provider: string;
    eventId: string;
    createdAt: Date;
  }>) || mongoose.model("BillingEvent", eventSchema);

export interface CheckoutRecord {
  _id: string;
  clerkId?: string;
  productId: string;
  credits: number;
  environment: "sandbox" | "production";
  detached?: boolean;
  createdAt: Date;
}
const checkoutSchema = new Schema<CheckoutRecord>(
  {
    _id: String,
    clerkId: { type: String, index: true },
    productId: String,
    credits: Number,
    environment: String,
    detached: Boolean,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "payment_checkouts",
  },
);
export const PaymentCheckout =
  (mongoose.models.PaymentCheckout as mongoose.Model<CheckoutRecord>) ||
  mongoose.model("PaymentCheckout", checkoutSchema);
