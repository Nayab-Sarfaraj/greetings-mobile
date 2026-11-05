import { z } from "zod";
import { propsSchema } from "@greetings/remotion/schema";
export const invitationInput = z
  .object({
    templateId: z.string().min(1).max(80),
    props: propsSchema,
    hostContact: z
      .discriminatedUnion("method", [
        z.object({
          method: z.literal("email"),
          value: z.email().max(160),
        }),
        z.object({
          method: z.enum(["whatsapp", "sms"]),
          value: z
            .string()
            .trim()
            .regex(/^\+?[0-9\s().-]{7,20}$/, "Enter a valid phone number"),
        }),
      ])
      .optional(),
  })
  .strict();
export type InvitationInput = z.infer<typeof invitationInput>;
