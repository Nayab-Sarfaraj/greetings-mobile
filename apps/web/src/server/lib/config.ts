import { z } from "zod";
const schema = z.object({
  MONGODB_URI: z
    .url()
    .refine(
      (value) =>
        value.startsWith("mongodb://") || value.startsWith("mongodb+srv://"),
      "Must be a MongoDB URI",
    ),
});
export function getConfig() {
  const result = schema.safeParse({ MONGODB_URI: process.env.MONGODB_URI });
  if (!result.success)
    throw new Error(
      `Invalid configuration: ${result.error.issues.map((issue) => issue.path.join(".")).join(", ")}`,
    );
  return result.data;
}
