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

const clerkSchema = z.object({
  publishableKey: z.string().startsWith("pk_"),
  secretKey: z.string().startsWith("sk_"),
  webhookSecret: z.string().min(1).optional(),
});
export function authEnabled() {
  return Boolean(
    process.env.CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
  );
}
export function getAuthConfig() {
  const result = clerkSchema.safeParse({
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
    webhookSecret: process.env.CLERK_WEBHOOK_SECRET,
  });
  if (!result.success)
    throw new Error(
      "Configure CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY for authentication",
    );
  return result.data;
}
export function publicAuthKey() {
  return authEnabled() ? getAuthConfig().publishableKey : null;
}
export function localRenderConfig() {
  return {
    appUrl: z.url().parse(process.env.APP_BASE_URL ?? "http://localhost:3000"),
    root: process.env.LOCAL_MEDIA_DIR ?? "./.media",
  };
}
