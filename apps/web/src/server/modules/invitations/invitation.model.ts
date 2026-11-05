import mongoose, { Schema } from "mongoose";
const schema = new Schema(
  {
    ownerClerkId: { type: String, required: true, index: true },
    shareId: { type: String },
    pendingRenderId: { type: String, index: true },
    publishedRenderId: String,
    templateId: { type: String, required: true },
    props: { type: Schema.Types.Mixed, required: true },
    hostContact: Schema.Types.Mixed,
    guestCount: { type: Number, default: 0, min: 0 },
    status: { type: String, default: "draft" },
  },
  { timestamps: true },
);
schema.index({ shareId: 1 }, { unique: true, sparse: true });
export const Invitation =
  mongoose.models.Invitation || mongoose.model("Invitation", schema);
