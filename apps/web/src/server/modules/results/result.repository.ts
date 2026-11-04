import { connectDb } from "../../lib/db";
import { Invitation } from "../invitations/invitation.model";
import { Render } from "../renders/render.model";
export const resultRepository = {
  async setPending(ownerClerkId: string, id: string, renderId: string) {
    await connectDb();
    await Invitation.updateOne(
      { _id: id, ownerClerkId },
      { $set: { pendingRenderId: renderId } },
    );
  },
  async pending(ownerClerkId: string, renderId: string) {
    await connectDb();
    return Invitation.find({ ownerClerkId, pendingRenderId: renderId })
      .select("_id shareId")
      .lean();
  },
  async assignShareId(
    ownerClerkId: string,
    id: string,
    renderId: string,
    shareId: string,
  ) {
    await connectDb();
    await Invitation.init();
    return Invitation.updateOne(
      {
        _id: id,
        ownerClerkId,
        pendingRenderId: renderId,
        shareId: { $exists: false },
      },
      { $set: { shareId } },
    );
  },
  async setPublished(ownerClerkId: string, id: string, renderId: string) {
    await connectDb();
    return Invitation.updateOne(
      { _id: id, ownerClerkId, pendingRenderId: renderId },
      { $set: { publishedRenderId: renderId } },
    );
  },
  async find(shareId: string) {
    await connectDb();
    const item = await Invitation.findOne({ shareId })
      .select("shareId ownerClerkId pendingRenderId publishedRenderId")
      .lean();
    if (!item) return null;
    const renderId = item.pendingRenderId ?? item.publishedRenderId;
    if (!renderId) return null;
    const render = await Render.findOne({
      _id: renderId,
      ownerClerkId: item.ownerClerkId,
      invitationIds: String(item._id),
    })
      .select("status input.props fileUrl posterUrl")
      .lean();
    return render ? { shareId, render } : null;
  },
};
