import { randomUUID } from "node:crypto";
import { connectDb } from "../../lib/db";
import { Render } from "./render.model";
import type { InvitationInput } from "../invitations/invitation.schema";
export const renderRepository = {
  async find(ownerClerkId: string, propsHash: string) {
    await connectDb();
    return Render.findOne({ ownerClerkId, propsHash }).lean();
  },
  async get(ownerClerkId: string, id: string) {
    await connectDb();
    return Render.findOne({ _id: id, ownerClerkId }).lean();
  },
  async enqueue(
    ownerClerkId: string,
    invitationId: string,
    propsHash: string,
    input: InvitationInput,
  ) {
    await connectDb();
    await Render.init();
    try {
      return await Render.findOneAndUpdate(
        { ownerClerkId, propsHash },
        {
          $setOnInsert: {
            ownerClerkId,
            invitationId,
            invitationIds: [invitationId],
            propsHash,
            input: JSON.parse(JSON.stringify(input)),
            status: "queued",
            attempts: 0,
          },
        },
        { upsert: true, returnDocument: "after" },
      ).lean();
    } catch (error) {
      if ((error as { code?: number }).code === 11000)
        return Render.findOne({ ownerClerkId, propsHash }).lean();
      throw error;
    }
  },
  async attach(ownerClerkId: string, propsHash: string, invitationId: string) {
    await connectDb();
    return Render.updateOne(
      { ownerClerkId, propsHash },
      { $addToSet: { invitationIds: invitationId } },
    );
  },
  async claim() {
    await connectDb();
    return Render.findOneAndUpdate(
      { status: "queued" },
      {
        $set: {
          status: "rendering",
          startedAt: new Date(),
          attemptId: randomUUID(),
        },
        $inc: { attempts: 1 },
      },
      { returnDocument: "after", sort: { createdAt: 1 } },
    ).lean();
  },
  async complete(
    id: string,
    attemptId: string,
    fileUrl: string,
    posterUrl: string,
    elapsedMs: number,
  ) {
    return Render.updateOne(
      { _id: id, attemptId, status: "rendering" },
      {
        $set: {
          status: "ready",
          fileUrl,
          posterUrl,
          elapsedMs,
          completedAt: new Date(),
        },
      },
    );
  },
  async fail(id: string, attemptId: string) {
    return Render.updateOne(
      { _id: id, attemptId, status: "rendering" },
      {
        $set: {
          status: "failed",
          error: "The video could not be rendered. Try exporting again.",
        },
      },
    );
  },
  async retry(ownerClerkId: string, propsHash: string) {
    await connectDb();
    return Render.findOneAndUpdate(
      { ownerClerkId, propsHash, status: "failed", attempts: { $lt: 3 } },
      { $set: { status: "queued" }, $unset: { error: 1, startedAt: 1 } },
      { returnDocument: "after" },
    ).lean();
  },
  async sweep() {
    await connectDb();
    const cutoff = new Date(Date.now() - 600000);
    return Render.updateMany(
      {
        $or: [
          { status: "rendering", startedAt: { $lt: cutoff } },
          { status: "queued", updatedAt: { $lt: cutoff } },
        ],
      },
      {
        $set: {
          status: "failed",
          error: "Rendering timed out. Try exporting again.",
        },
      },
    );
  },
  async list(ownerClerkId: string) {
    await connectDb();
    return Render.find({ ownerClerkId })
      .select("-input -ownerClerkId -propsHash")
      .sort({ updatedAt: -1 })
      .lean();
  },
};
