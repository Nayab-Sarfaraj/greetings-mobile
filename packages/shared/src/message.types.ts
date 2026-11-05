export type MessageTone = "warm" | "funny" | "formal" | "short-sweet";
export type MessageSpelling = "us" | "uk";

export type GenerateMessageInput = {
  type: "card" | "invitation";
  themeId: ThemeId;
  tone: MessageTone;
  spelling: MessageSpelling;
  relationship?: string;
  senderName?: string;
  recipientName?: string;
  eventTitle?: string;
  hostName?: string;
  dateTime?: string;
  locationText?: string;
};

export type GeneratedMessages = {
  variants: string[];
  source: "ai" | "curated";
  note?: string;
};
import type { ThemeId } from "./design-tokens";
