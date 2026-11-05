export type HostContact = {
  method: "email" | "whatsapp" | "sms";
  value: string;
};

export function rsvpMessage(
  guestName: string,
  eventTitle: string,
  attending: boolean,
) {
  return attending
    ? `${guestName} will be there for ${eventTitle}.`
    : `${guestName} can't make it to ${eventTitle}.`;
}

export function rsvpLink(
  contact: HostContact,
  guestName: string,
  eventTitle: string,
  attending: boolean,
  ios: boolean,
) {
  const body = rsvpMessage(guestName, eventTitle, attending);
  if (contact.method === "email")
    return `mailto:${contact.value}?subject=${encodeURIComponent(`RSVP: ${eventTitle}`)}&body=${encodeURIComponent(body)}`;
  const numeric = contact.value.replace(/\D/g, "");
  const phone = contact.value.trim().startsWith("+") ? `+${numeric}` : numeric;
  if (contact.method === "whatsapp")
    return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(body)}`;
  return `sms:${phone}${ios ? "&" : "?"}body=${encodeURIComponent(body)}`;
}
