import mongoose, { Schema } from "mongoose";
const schema = new Schema({ _id: String, count: Number, expiresAt: Date });
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const Counter =
  mongoose.models.RateCounter || mongoose.model("RateCounter", schema);
