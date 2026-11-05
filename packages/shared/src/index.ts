export * from "./design-tokens";
export * from "./mobile-bridge";
export const MAX_VIDEO_SECONDS = 90;
export const FPS = 30;
export const VIDEO_SIZE = { width: 1080, height: 1920 } as const;
export const FREE_VIDEO_SIZE = { width: 720, height: 1280 } as const;
export const MESSAGE_MAX_CHARS = 240;

export type { PublicResult } from "./public-result.types";

export type {
  ExportQuality,
  ExportPack,
  PackCatalog,
  CheckoutStatus,
} from "./billing.types";

export type {
  GenerateMessageInput,
  GeneratedMessages,
  MessageSpelling,
  MessageTone,
} from "./message.types";

export type {
  Guest,
  GuestContact,
  GuestImportResult,
  GuestInput,
} from "./guest.types";
