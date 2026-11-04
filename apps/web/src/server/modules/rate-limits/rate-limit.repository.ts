import { connectDb } from "../../lib/db";
import { Counter } from "./rate-limit.model";
export async function incrementCounter(id: string, expiresAt: Date) {
  await connectDb();
  try {
    return await Counter.findOneAndUpdate(
      { _id: id },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
      { upsert: true, returnDocument: "after" },
    );
  } catch (error) {
    if ((error as { code?: number }).code === 11000)
      return Counter.findOneAndUpdate(
        { _id: id },
        { $inc: { count: 1 } },
        { returnDocument: "after" },
      );
    throw error;
  }
}
