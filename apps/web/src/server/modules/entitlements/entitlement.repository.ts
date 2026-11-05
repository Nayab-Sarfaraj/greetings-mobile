import { paymentSettings } from "../../lib/config";
import mongoose, { type ClientSession } from "mongoose";
import { createHash } from "node:crypto";
import { connectDb } from "../../lib/db";
import {
  Ledger,
  CreditAccount,
  DeletedBillingAccount,
  type LedgerRecord,
} from "./entitlement.model";
export class InsufficientBalance extends Error {}
export class ClosedCreditAccount extends Error {}
export const creditAccountKey = (
  owner: string,
  environment = paymentSettings().environment,
) => createHash("sha256").update(`${environment}:${owner}`).digest("hex");
export async function billingTransaction<T>(
  work: (session: ClientSession) => Promise<T>,
): Promise<T> {
  await connectDb();
  await Promise.all([
    Ledger.init(),
    CreditAccount.init(),
    DeletedBillingAccount.init(),
  ]);
  for (let retry = 0; ; retry++) {
    const session = await mongoose.startSession();
    try {
      return await session.withTransaction(() => work(session), {
        readConcern: { level: "snapshot" },
        writeConcern: { w: "majority" },
        readPreference: "primary",
      });
    } catch (error) {
      if ((error as { code?: number }).code !== 11000 || retry >= 3)
        throw error;
    } finally {
      await session.endSession();
    }
  }
}
export async function changeCredits(
  session: ClientSession,
  entry: Omit<LedgerRecord, "createdAt">,
  requireAvailable = false,
) {
  if (!Number.isSafeInteger(entry.delta) || entry.delta === 0)
    throw new Error("Invalid credit adjustment");
  entry = {
    ...entry,
    environment: entry.environment ?? paymentSettings().environment,
  };
  const existing = await Ledger.findOne({ reference: entry.reference })
    .session(session)
    .lean();
  if (existing) {
    if (
      existing.clerkId !== entry.clerkId ||
      existing.delta !== entry.delta ||
      existing.environment !== entry.environment
    )
      throw new Error("Ledger reference conflict");
    return false;
  }
  if (!entry.clerkId) throw new Error("Ledger owner is required");
  const key = creditAccountKey(entry.clerkId, entry.environment);
  if ((await CreditAccount.findById(key).session(session).lean())?.closed)
    throw new ClosedCreditAccount();
  if (requireAvailable) {
    const account = await CreditAccount.findOneAndUpdate(
      { _id: key, closed: { $ne: true }, balance: { $gte: -entry.delta } },
      { $inc: { balance: entry.delta } },
      { session, returnDocument: "after" },
    );
    if (!account) throw new InsufficientBalance();
  } else {
    await CreditAccount.updateOne(
      { _id: key, closed: { $ne: true } },
      {
        $inc: { balance: entry.delta },
        $setOnInsert: { clerkId: entry.clerkId, closed: false },
      },
      { session, upsert: true },
    );
  }
  await Ledger.create([entry], { session });
  return true;
}
export const entitlementRepository = {
  async balance(clerkId: string, environment = paymentSettings().environment) {
    await connectDb();
    const totals = await Ledger.aggregate<{ balance: number }>([
      { $match: { clerkId, environment } },
      { $group: { _id: null, balance: { $sum: "$delta" } } },
    ]);
    return Math.max(0, totals[0]?.balance ?? 0);
  },
  async grant(clerkId: string, credits: number, reference: string) {
    return billingTransaction((session) =>
      changeCredits(session, {
        clerkId,
        delta: credits,
        kind: "grant",
        source: "polar",
        reference,
      }),
    );
  },
  async consume(clerkId: string, renderId: string, sequence: number) {
    return billingTransaction((session) =>
      changeCredits(
        session,
        {
          clerkId,
          delta: -1,
          kind: "consume",
          source: "render",
          reference: `consume:${renderId}:${sequence}`,
        },
        true,
      ),
    );
  },
  async refund(clerkId: string, renderId: string, sequence: number) {
    return billingTransaction(async (session) => {
      const debit = await Ledger.findOne({
        reference: `consume:${renderId}:${sequence}`,
        clerkId,
      }).session(session);
      if (!debit) return false;
      return changeCredits(session, {
        clerkId,
        delta: 1,
        kind: "refund",
        source: "render",
        reference: `refund:${renderId}:${sequence}`,
      });
    });
  },
  async detach(clerkId: string) {
    const digest = createHash("sha256").update(clerkId).digest("hex");
    await billingTransaction(async (session) => {
      const db = mongoose.connection;
      await DeletedBillingAccount.updateOne(
        { _id: digest },
        { $setOnInsert: { createdAt: new Date() } },
        { upsert: true, session },
      );
      await Ledger.updateMany(
        { clerkId },
        { $unset: { clerkId: 1 }, $set: { detached: true } },
        { session },
      );
      await db
        .collection("polar_orders")
        .updateMany(
          { clerkId },
          { $unset: { clerkId: 1 }, $set: { detached: true } },
          { session },
        );
      for (const realm of ["sandbox", "production"] as const)
        await CreditAccount.updateOne(
          { _id: creditAccountKey(clerkId, realm) },
          { $set: { balance: 0, closed: true }, $unset: { clerkId: 1 } },
          { upsert: true, session },
        );
      await db
        .collection("payment_checkouts")
        .updateMany(
          { clerkId },
          { $unset: { clerkId: 1 }, $set: { detached: true } },
          { session },
        );
    });
  },
};
