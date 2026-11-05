import type { GuestRecord } from "./guest.model";

export function guestDto(item: GuestRecord & { _id: unknown }) {
  return {
    id: String(item._id),
    name: item.name,
    token: item.token,
    contact: item.contact,
    createdAt: new Date(item.createdAt).toISOString(),
  };
}
