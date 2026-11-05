import { connectDb } from "../../lib/db";
import { MessageUsage, type MessageUsageRecord } from "./message.model";

type Usage = Omit<MessageUsageRecord, "createdAt">;

export const messageRepository = {
  async recordUsage(usage: Usage) {
    await connectDb();
    await MessageUsage.create(usage);
  },
};
