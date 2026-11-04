import { connectDb } from "../../lib/db";
export async function photoIsReferenced(url: string) {
  const db = (await connectDb()).connection;
  return Boolean(
    (await db
      .collection("invitations")
      .findOne({ "props.photoUrl": url }, { projection: { _id: 1 } })) ||
    (await db
      .collection("renders")
      .findOne({ "input.props.photoUrl": url }, { projection: { _id: 1 } })),
  );
}
