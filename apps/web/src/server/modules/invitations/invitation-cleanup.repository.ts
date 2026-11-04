import { connectDb } from "../../lib/db";
import { Render } from "../renders/render.model";
export async function removeInvitationChildren(
  ownerClerkId: string,
  id: string,
) {
  const db = (await connectDb()).connection;
  await db.collection("guests").deleteMany({ invitationId: id });
  const query = {
    ownerClerkId,
    $or: [
      { invitationIds: id },
      { invitationId: id, invitationIds: { $exists: false } },
    ],
  };
  await Render.updateMany(query, { $pull: { invitationIds: id } });
  const orphanQuery = {
    ownerClerkId,
    $or: [
      { invitationIds: { $size: 0 } },
      { invitationId: id, invitationIds: { $exists: false } },
    ],
  };
  const orphans = await Render.find(orphanQuery).select("propsHash").lean();
  await Render.deleteMany(orphanQuery);
  return orphans.map((item) => item.propsHash);
}
