import { connectDb } from "@/server/lib/db";
import { errorResponse } from "@/server/lib/errors";
export async function GET() {
  try {
    await connectDb();
    return Response.json({ app: "ok", database: "connected" });
  } catch (error) {
    return errorResponse(error);
  }
}
