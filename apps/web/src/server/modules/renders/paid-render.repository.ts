import { Types, type ClientSession } from "mongoose";
import { connectDb } from "../../lib/db";
import { Ledger } from "../entitlements/entitlement.model";
import {
  billingTransaction,
  changeCredits,
} from "../entitlements/entitlement.repository";
import { Render, type RenderRecord } from "./render.model";
import type { InvitationInput } from "../invitations/invitation.schema";
export class RenderRetryLimit extends Error {}
async function refund(
  session: ClientSession,
  job: RenderRecord & { _id: unknown },
) {
  const id = String(job._id);
  const sequence = job.chargeSequence ?? 1;
  const debit = await Ledger.findOne({
    reference: `consume:${id}:${sequence}`,
    clerkId: job.ownerClerkId,
  }).session(session);
  if (debit)
    await changeCredits(session, {
      clerkId: job.ownerClerkId,
      reference: `refund:${id}:${sequence}`,
      delta: 1,
      kind: "refund",
      source: "render",
      environment: job.billingEnvironment,
    });
}
export const paidRenderRepository = {
  async reserve(
    ownerClerkId: string,
    invitationId: string,
    propsHash: string,
    input: InvitationInput,
    environment: "sandbox" | "production",
  ) {
    await connectDb();
    await Render.init();
    return billingTransaction(async (session) => {
      const old = await Render.findOne({ ownerClerkId, propsHash })
        .session(session)
        .lean();
      if (old && old.status !== "failed") {
        await Render.updateOne(
          { _id: old._id },
          { $addToSet: { invitationIds: invitationId } },
          { session },
        );
        return old;
      }
      if (old && old.attempts >= 3) throw new RenderRetryLimit();
      if (old) await refund(session, old);
      const id = old?._id ?? new Types.ObjectId();
      const sequence = (old?.chargeSequence ?? 0) + 1;
      await changeCredits(
        session,
        {
          clerkId: ownerClerkId,
          reference: `consume:${String(id)}:${sequence}`,
          delta: -1,
          kind: "consume",
          source: "render",
          environment,
        },
        true,
      );
      if (old)
        return Render.findOneAndUpdate(
          { _id: id, status: "failed" },
          {
            $set: { status: "queued" as const, chargeSequence: sequence },
            $addToSet: { invitationIds: invitationId },
            $unset: { error: 1, startedAt: 1, attemptId: 1 },
          },
          { session, returnDocument: "after" },
        ).lean();
      const [created] = await Render.create(
        [
          {
            _id: id,
            ownerClerkId,
            invitationId,
            invitationIds: [invitationId],
            propsHash,
            input: JSON.parse(JSON.stringify(input)),
            tier: "hd" as const,
            billingEnvironment: environment,
            status: "queued" as const,
            chargeSequence: sequence,
            attempts: 0,
          },
        ],
        { session },
      );
      return created.toObject();
    });
  },
  async fail(id: string, attemptId?: string, expired = false) {
    await connectDb();
    return billingTransaction(async (session) => {
      const cutoff = new Date(Date.now() - 600000);
      const filter = expired
        ? {
            _id: id,
            tier: "hd" as const,
            $or: [
              { status: "rendering" as const, startedAt: { $lt: cutoff } },
              { status: "queued" as const, updatedAt: { $lt: cutoff } },
            ],
          }
        : {
            _id: id,
            tier: "hd" as const,
            status: "rendering" as const,
            attemptId,
          };
      const job = await Render.findOne(filter).session(session).lean();
      if (!job) return { modifiedCount: 0 };
      await refund(session, job);
      return Render.updateOne(
        filter,
        {
          $set: {
            status: "failed",
            error: expired
              ? "Rendering timed out. Your export credit was returned."
              : "The video could not be rendered. Your export credit was returned.",
          },
        },
        { session },
      );
    });
  },
  async sweep() {
    await connectDb();
    const cutoff = new Date(Date.now() - 600000);
    const jobs = await Render.find({
      tier: "hd" as const,
      $or: [
        { status: "rendering" as const, startedAt: { $lt: cutoff } },
        { status: "queued" as const, updatedAt: { $lt: cutoff } },
      ],
    })
      .select("_id")
      .lean();
    for (const job of jobs) await this.fail(String(job._id), undefined, true);
  },
};
