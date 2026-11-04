import { z } from "zod";
import { propsSchema } from "@greetings/remotion/schema";
export const invitationInput = z
  .object({
    templateId: z.string().min(1).max(80),
    props: propsSchema,
    hostContact: z
      .object({
        method: z.enum(["email", "whatsapp", "sms"]),
        value: z.string().trim().min(1).max(160),
      })
      .optional(),
  })
  .strict();
export type InvitationInput = z.infer<typeof invitationInput>;
