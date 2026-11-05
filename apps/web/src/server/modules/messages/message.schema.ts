import { z } from "zod";

const optionalText = (maximum: number) =>
  z.string().trim().min(1).max(maximum).optional();

export const generateMessageInput = z
  .object({
    type: z.enum(["card", "invitation"]),
    themeId: z.literal("thanksgiving"),
    tone: z.enum(["warm", "funny", "formal", "short-sweet"]),
    spelling: z.enum(["us", "uk"]),
    relationship: optionalText(40),
    senderName: optionalText(40),
    recipientName: optionalText(40),
    eventTitle: optionalText(70),
    hostName: optionalText(40),
    dateTime: optionalText(50),
    locationText: optionalText(120),
  })
  .strict();

export type MessageInput = z.infer<typeof generateMessageInput>;

export const llmMessageOutput = z.object({
  variants: z.array(z.string()).length(3),
});
