import mongoose, { Schema } from "mongoose";
export interface LedgerRecord {
  environment?: "sandbox" | "production";
  clerkId?: string;
  reference: string;
  delta: number;
  kind: "grant" | "consume" | "refund" | "revoke";
  source: "polar" | "render";
  productId?: string;
  createdAt: Date;
  detached?: boolean;
}
const ledgerSchema = new Schema<LedgerRecord>(
  {
    environment: {
      type: String,
      enum: ["sandbox", "production"],
      required: true,
    },
    clerkId: { type: String, index: true },
    reference: { type: String, required: true, unique: true },
    delta: { type: Number, required: true },
    kind: {
      type: String,
      required: true,
      enum: ["grant", "consume", "refund", "revoke"],
    },
    source: { type: String, required: true, enum: ["polar", "render"] },
    productId: String,
    detached: Boolean,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "entitlements",
  },
);
export const Ledger =
  (mongoose.models.EntitlementLedger as mongoose.Model<LedgerRecord>) ||
  mongoose.model<LedgerRecord>("EntitlementLedger", ledgerSchema);
export interface CreditAccountRecord {
  _id: string;
  balance: number;
  clerkId?: string;
  closed: boolean;
}
const accountSchema = new Schema<CreditAccountRecord>(
  {
    _id: String,
    balance: { type: Number, required: true, default: 0 },
    clerkId: { type: String, index: true },
    closed: { type: Boolean, default: false },
  },
  { collection: "credit_accounts" },
);
export const CreditAccount =
  (mongoose.models.CreditAccount as mongoose.Model<CreditAccountRecord>) ||
  mongoose.model<CreditAccountRecord>("CreditAccount", accountSchema);

const deletedSchema = new Schema<{ _id: string; createdAt: Date }>(
  { _id: String, createdAt: Date },
  { collection: "deleted_billing_accounts" },
);
export const DeletedBillingAccount =
  (mongoose.models.DeletedBillingAccount as mongoose.Model<{
    _id: string;
    createdAt: Date;
  }>) || mongoose.model("DeletedBillingAccount", deletedSchema);
