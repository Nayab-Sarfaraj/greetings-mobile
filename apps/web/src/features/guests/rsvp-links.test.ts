import { describe, expect, it } from "vitest";
import { rsvpLink } from "./rsvp-links";

describe("RSVP links", () => {
  it("builds email and WhatsApp replies", () => {
    expect(
      rsvpLink(
        { method: "email", value: "host@example.com" },
        "Sam",
        "Dinner",
        true,
        false,
      ),
    ).toBe(
      "mailto:host@example.com?subject=RSVP%3A%20Dinner&body=Sam%20will%20be%20there%20for%20Dinner.",
    );
    expect(
      rsvpLink(
        { method: "whatsapp", value: "+1 (555) 123-4567" },
        "Sam",
        "Dinner",
        false,
        false,
      ),
    ).toBe(
      "https://wa.me/15551234567?text=Sam%20can't%20make%20it%20to%20Dinner.",
    );
  });

  it("uses the platform-specific SMS body separator", () => {
    const contact = { method: "sms" as const, value: "+15551234567" };
    expect(rsvpLink(contact, "Sam", "Dinner", true, true)).toContain(
      "sms:+15551234567&body=",
    );
    expect(rsvpLink(contact, "Sam", "Dinner", true, false)).toContain(
      "sms:+15551234567?body=",
    );
  });
});
