export type GuestContact =
  { method: "email"; value: string } | { method: "phone"; value: string };

export type GuestInput = { name: string; contact?: GuestContact };

export type Guest = GuestInput & {
  id: string;
  token: string;
  createdAt: string;
};

export type GuestImportResult = {
  guests: Guest[];
  created: number;
  updated: number;
};
