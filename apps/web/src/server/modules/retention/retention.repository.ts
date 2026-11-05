import { connectDb } from "../../lib/db";
import { Invitation } from "../invitations/invitation.model";
export async function expiredInvitations() {
  await connectDb();
  const cutoff = new Date(Date.now() - 90 * 86400000);
  return Invitation.find({
    $or: [
      { "props.type": "card", createdAt: { $lt: cutoff } },
      {
        "props.type": "invitation",
        $expr: {
          $lt: [
            {
              $convert: {
                input: "$props.dateTime",
                to: "date",
                onError: new Date(8640000000000000),
                onNull: new Date(8640000000000000),
              },
            },
            cutoff,
          ],
        },
      },
    ],
  })
    .select("_id ownerClerkId")
    .limit(100)
    .lean();
}
