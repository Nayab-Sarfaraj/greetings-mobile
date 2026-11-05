export type ExportQuality = "free" | "hd";
export type ExportPack = {
  id: string;
  name: string;
  credits: number;
  amount: number;
  currency: string;
};
export type PackCatalog = { enabled: boolean; packs: ExportPack[] };
export type CheckoutStatus = {
  confirmed: boolean;
  refunded: boolean;
  balance: number;
};
