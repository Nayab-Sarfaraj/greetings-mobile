import { z } from "zod";

export const guestContact = z.discriminatedUnion("method", [
  z.object({ method: z.literal("email"), value: z.email().max(160) }),
  z.object({
    method: z.literal("phone"),
    value: z
      .string()
      .trim()
      .regex(/^\+?[0-9\s().-]{7,20}$/, "Enter a valid phone number"),
  }),
]);

export const guestInput = z
  .object({
    name: z.string().trim().min(1).max(40),
    contact: guestContact.optional(),
  })
  .strict();

export const guestImportInput = z
  .object({ guests: z.array(guestInput).min(1).max(200) })
  .strict();

export type GuestInputRecord = z.infer<typeof guestInput>;
