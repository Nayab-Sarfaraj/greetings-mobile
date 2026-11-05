import mongoose, { Schema } from "mongoose";

export interface MessageUsageRecord {
  ownerClerkId: string;
  provider: "anthropic" | "curated";
  model: string;
  inputTokens: number;
  outputTokens: number;
  elapsedMs: number;
  outcome: "generated" | "fallback";
  createdAt: Date;
}

const schema = new Schema<MessageUsageRecord>(
  {
    ownerClerkId: { type: String, required: true, index: true },
    provider: { type: String, enum: ["anthropic", "curated"], required: true },
    model: { type: String, required: true },
    inputTokens: { type: Number, required: true, min: 0 },
    outputTokens: { type: Number, required: true, min: 0 },
    elapsedMs: { type: Number, required: true, min: 0 },
    outcome: { type: String, enum: ["generated", "fallback"], required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "message_usage",
  },
);

schema.index({ createdAt: 1 });

export const MessageUsage =
  (mongoose.models.MessageUsage as mongoose.Model<MessageUsageRecord>) ||
  mongoose.model<MessageUsageRecord>("MessageUsage", schema);
