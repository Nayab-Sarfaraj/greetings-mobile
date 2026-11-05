import { z } from "zod";

const url = z.url().max(2048);

export const webToNativeBridgeSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("PHOTO_PICKED"), request: z.literal(true) }),
  z.object({
    type: z.literal("REQUEST_SHARE"),
    fileUrl: url.optional(),
    linkUrl: url.optional(),
  }),
  z.object({ type: z.literal("REQUEST_PAYWALL") }),
]);

export const nativeToWebBridgeSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("AUTH_TOKEN"),
    ticket: z.string().min(1).max(4096),
  }),
  z.object({ type: z.literal("PHOTO_PICKED"), url }),
  z.object({
    type: z.literal("ENTITLEMENTS_UPDATED"),
    balance: z.number().int().nonnegative().optional(),
  }),
]);

export type WebToNativeBridgeMessage = z.infer<typeof webToNativeBridgeSchema>;
export type NativeToWebBridgeMessage = z.infer<typeof nativeToWebBridgeSchema>;

export function parseWebToNativeBridgeMessage(value: unknown) {
  return webToNativeBridgeSchema.safeParse(value);
}

export function parseNativeToWebBridgeMessage(value: unknown) {
  return nativeToWebBridgeSchema.safeParse(value);
}
