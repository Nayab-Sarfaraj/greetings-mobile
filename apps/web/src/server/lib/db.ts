import mongoose from "mongoose";
import { getConfig } from "./config";
const globalCache = globalThis as typeof globalThis & {
  mongoConnection?: Promise<typeof mongoose>;
};
export function connectDb() {
  globalCache.mongoConnection ??= mongoose
    .connect(getConfig().MONGODB_URI)
    .catch((error: unknown) => {
      globalCache.mongoConnection = undefined;
      throw error;
    });
  return globalCache.mongoConnection;
}
