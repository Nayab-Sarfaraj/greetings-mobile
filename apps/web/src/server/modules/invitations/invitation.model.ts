import mongoose, { Schema } from "mongoose";
const schema = new Schema(
  {
    ownerClerkId: { type: String, required: true, index: true },
    templateId: { type: String, required: true },
    props: { type: Schema.Types.Mixed, required: true },
    hostContact: Schema.Types.Mixed,
    status: { type: String, default: "draft" },
  },
  { timestamps: true },
);
export const Invitation =
  mongoose.models.Invitation || mongoose.model("Invitation", schema);
