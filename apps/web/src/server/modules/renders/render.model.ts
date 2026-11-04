import mongoose, { Schema } from "mongoose";
import type { InvitationInput } from "../invitations/invitation.schema";
export interface RenderRecord {
  ownerClerkId: string;
  invitationId: string;
  invitationIds: string[];
  propsHash: string;
  status: "queued" | "rendering" | "ready" | "failed";
  input: InvitationInput;
  fileUrl?: string;
  posterUrl?: string;
  error?: string;
  attempts: number;
  attemptId?: string;
  startedAt?: Date;
  completedAt?: Date;
  elapsedMs?: number;
  createdAt: Date;
  updatedAt: Date;
}
const schema = new Schema<RenderRecord>(
  {
    ownerClerkId: { type: String, required: true, index: true },
    invitationId: { type: String, required: true, index: true },
    invitationIds: { type: [String], index: true },
    propsHash: { type: String, required: true },
    status: {
      type: String,
      enum: ["queued", "rendering", "ready", "failed"],
      default: "queued",
    },
    input: { type: Schema.Types.Mixed, required: true },
    fileUrl: String,
    posterUrl: String,
    error: String,
    attempts: { type: Number, default: 0 },
    attemptId: String,
    startedAt: Date,
    completedAt: Date,
    elapsedMs: Number,
  },
  { timestamps: true },
);
schema.index({ ownerClerkId: 1, propsHash: 1 }, { unique: true });
export const Render =
  (mongoose.models.Render as mongoose.Model<RenderRecord>) ||
  mongoose.model<RenderRecord>("Render", schema);
