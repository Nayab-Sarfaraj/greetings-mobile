import { describe, expect, it } from "vitest";
import { digits, guestShareText, smsLink, smsPhone } from "./guest-share";

describe("guest sharing utilities", () => {
  it("digits strips non-digits including leading plus for WhatsApp", () => {
    expect(digits("+44 (07700) 900 123")).toBe("4407700900123");
    expect(digits("+1-555-0199")).toBe("15550199");
  });

  it("smsPhone preserves leading plus for international SMS while stripping formatting", () => {
    expect(smsPhone("+44 (07700) 900 123")).toBe("+4407700900123");
    expect(smsPhone(" (555) 019-9234 ")).toBe("5550199234");
    expect(smsPhone("+1-555-0199")).toBe("+15550199");
  });

  it("smsLink formats iOS and Android separators", () => {
    expect(smsLink("+4407700900123", "Hello", true)).toBe(
      "sms:+4407700900123&body=Hello",
    );
    expect(smsLink("+4407700900123", "Hello", false)).toBe(
      "sms:+4407700900123?body=Hello",
    );
  });

  it("guestShareText personalizes the message", () => {
    expect(guestShareText("Alex", "https://example.com/i/token")).toBe(
      "Alex, your personal invitation is ready: https://example.com/i/token",
    );
  });
});
