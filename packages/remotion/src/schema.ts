import { z } from "zod";
import { MESSAGE_MAX_CHARS, THEME_IDS } from "@greetings/shared";
const name = z.string().trim().min(1).max(40);
const message = z.string().trim().min(1).max(MESSAGE_MAX_CHARS);
export const cardSchema = z.object({
  type: z.literal("card"),
  themeId: z.enum(THEME_IDS),
  senderName: name,
  recipientName: name.optional(),
  message,
  photoUrl: z.url().optional(),
});
export const invitationSchema = z.object({
  type: z.literal("invitation"),
  themeId: z.enum(THEME_IDS),
  eventTitle: z.string().trim().min(1).max(70),
  hostName: name,
  dateTime: z.iso.datetime({ offset: true }),
  locationText: z.string().trim().min(1).max(120),
  mapUrl: z.url().optional(),
  message: z.string().max(MESSAGE_MAX_CHARS).optional(),
  photoUrl: z.url().optional(),
  guestName: name.optional(),
});
export const propsSchema = z.discriminatedUnion("type", [
  cardSchema,
  invitationSchema,
]);
export type VideoProps = z.infer<typeof propsSchema>;
