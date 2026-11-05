import mongoose from "mongoose";
import { connectDb } from "../../lib/db";
import { Invitation } from "../invitations/invitation.model";
import { Render } from "../renders/render.model";
import { Guest } from "./guest.model";
import type { GuestContact } from "@greetings/shared";

type StoredInput = {
  name: string;
  nameKey: string;
  token: string;
  contact?: GuestContact;
};

export class GuestCapacityError extends Error {}

export const guestRepository = {
  async list(invitationId: string) {
    await connectDb();
    return Guest.find({ invitationId }).sort({ nameKey: 1 }).lean();
  },
  async saveBatch(
    invitationId: string,
    guests: StoredInput[],
    maximum: number,
  ) {
    await connectDb();
    await Promise.all([Guest.init(), Invitation.init()]);
    const session = await mongoose.startSession();
    let created = 0;
    try {
      await session.withTransaction(async () => {
        const keys = guests.map((item) => item.nameKey);
        const existing = await Guest.find({
          invitationId,
          nameKey: { $in: keys },
        })
          .session(session)
          .lean();
        const byKey = new Map(existing.map((item) => [item.nameKey, item]));
        const additions = guests.filter((item) => !byKey.has(item.nameKey));
        created = additions.length;
        if (created) {
          const reserved = await Invitation.updateOne(
            {
              _id: invitationId,
              $expr: {
                $lte: [
                  { $add: [{ $ifNull: ["$guestCount", 0] }, created] },
                  maximum,
                ],
              },
            },
            { $inc: { guestCount: created } },
            { session },
          );
          if (!reserved.modifiedCount) throw new GuestCapacityError();
        }
        const updates = guests.filter((item) => byKey.has(item.nameKey));
        if (updates.length)
          await Guest.bulkWrite(
            updates.map((item) => ({
              updateOne: {
                filter: { invitationId, nameKey: item.nameKey },
                update: {
                  $set: {
                    name: item.name,
                    ...(item.contact ? { contact: item.contact } : {}),
                  },
                },
              },
            })),
            { session },
          );
        if (additions.length)
          await Guest.insertMany(
            additions.map((item) => ({ ...item, invitationId })),
            { session },
          );
      });
    } finally {
      await session.endSession();
    }
    return {
      guests: await this.list(invitationId),
      created,
      updated: guests.length - created,
    };
  },
  async remove(invitationId: string, id: string) {
    await connectDb();
    const session = await mongoose.startSession();
    let removed = false;
    try {
      await session.withTransaction(async () => {
        const item = await Guest.findOneAndDelete(
          { _id: id, invitationId },
          { session },
        );
        if (!item) return;
        removed = true;
        await Invitation.updateOne(
          { _id: invitationId, guestCount: { $gt: 0 } },
          { $inc: { guestCount: -1 } },
          { session },
        );
      });
    } finally {
      await session.endSession();
    }
    return removed;
  },
  async removeAll(invitationId: string) {
    await connectDb();
    const session = await mongoose.startSession();
    let count = 0;
    try {
      await session.withTransaction(async () => {
        count = (await Guest.deleteMany({ invitationId }, { session }))
          .deletedCount;
        await Invitation.updateOne(
          { _id: invitationId },
          { $set: { guestCount: 0 } },
          { session },
        );
      });
    } finally {
      await session.endSession();
    }
    return count;
  },
  async findPublic(token: string) {
    await connectDb();
    const guest = await Guest.findOne({ token })
      .select("name invitationId")
      .lean();
    if (!guest) return null;
    const invitation = await Invitation.findOne({
      _id: guest.invitationId,
      "props.type": "invitation",
    })
      .select("templateId props hostContact publishedRenderId")
      .lean();
    if (!invitation) return null;
    const render = invitation.publishedRenderId
      ? await Render.findOne({
          _id: invitation.publishedRenderId,
          status: "ready",
          $or: [
            { invitationIds: String(invitation._id) },
            {
              invitationId: String(invitation._id),
              invitationIds: { $exists: false },
            },
          ],
        })
          .select("fileUrl posterUrl")
          .lean()
      : null;
    return { guest, invitation, render };
  },
};
