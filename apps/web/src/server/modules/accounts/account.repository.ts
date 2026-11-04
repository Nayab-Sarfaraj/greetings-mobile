import { connectDb } from "../../lib/db";
export const accountRepository = {
  async upsert(clerkId: string) {
    const db = await connectDb();
    await db.connection
      .collection("users")
      .updateOne(
        { clerkId },
        { $setOnInsert: { clerkId, createdAt: new Date() } },
        { upsert: true },
      );
  },
  async remove(clerkId: string) {
    const db = (await connectDb()).connection;
    const invitations = await db
      .collection("invitations")
      .find({ ownerClerkId: clerkId }, { projection: { _id: 1 } })
      .toArray();
    const ids = invitations.map((item) => String(item._id));
    const renders = await db
      .collection("renders")
      .find({ ownerClerkId: clerkId }, { projection: { propsHash: 1 } })
      .toArray();
    await db.collection("renders").deleteMany({ ownerClerkId: clerkId });
    await db.collection("guests").deleteMany({ invitationId: { $in: ids } });
    await db.collection("invitations").deleteMany({ ownerClerkId: clerkId });
    await db
      .collection("entitlements")
      .updateMany(
        { clerkId },
        { $unset: { clerkId: 1 }, $set: { detached: true } },
      );
    await db.collection("users").deleteMany({ clerkId });
    return renders.map((item) => String(item.propsHash));
  },
};
