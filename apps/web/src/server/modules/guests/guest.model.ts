import mongoose, { Schema } from "mongoose";
import type { GuestContact } from "@greetings/shared";

export interface GuestRecord {
  invitationId: string;
  name: string;
  nameKey: string;
  token: string;
  contact?: GuestContact;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<GuestRecord>(
  {
    invitationId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    nameKey: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    contact: Schema.Types.Mixed,
  },
  { timestamps: true, collection: "guests" },
);

schema.index({ invitationId: 1, nameKey: 1 }, { unique: true });

export const Guest =
  (mongoose.models.Guest as mongoose.Model<GuestRecord>) ||
  mongoose.model<GuestRecord>("Guest", schema);
