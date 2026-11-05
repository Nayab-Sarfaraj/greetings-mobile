export type PackDefinition = { id: string; productId: string; credits: number };
export type PackOffer = PackDefinition & {
  name: string;
  amount: number;
  currency: string;
};
export type OrderSnapshot = {
  id: string;
  checkoutId: string;
  owner: string;
  productId: string;
  paid: boolean;
  netAmount: number;
  refundedAmount: number;
  currency: string;
  subscriptionId: string | null;
};
export type Settlement = {
  order: OrderSnapshot;
  credits: number;
  revokedCredits: number;
  eventId: string;
  environment: "sandbox" | "production";
};
