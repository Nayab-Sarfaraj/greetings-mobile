import { connectDb } from "../../lib/db";
import { Invitation } from "./invitation.model";
import type { InvitationInput } from "./invitation.schema";
export const invitationRepository = {
  async list(ownerClerkId: string) {
    await connectDb();
    return Invitation.find({ ownerClerkId }).sort({ updatedAt: -1 }).lean();
  },
  async get(ownerClerkId: string, id: string) {
    await connectDb();
    return Invitation.findOne({ _id: id, ownerClerkId }).lean();
  },
  async create(ownerClerkId: string, input: InvitationInput) {
    await connectDb();
    return (await Invitation.create({ ...input, ownerClerkId })).toObject();
  },
  async update(ownerClerkId: string, id: string, input: InvitationInput) {
    await connectDb();
    return Invitation.findOneAndUpdate(
      { _id: id, ownerClerkId },
      { $set: input },
      { returnDocument: "after" },
    ).lean();
  },
  async delete(ownerClerkId: string, id: string) {
    await connectDb();
    return Invitation.findOneAndDelete({ _id: id, ownerClerkId }).lean();
  },
};
