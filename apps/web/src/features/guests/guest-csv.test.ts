import { describe, expect, it } from "vitest";
import { parseGuestCsv } from "./guest-csv";

describe("guest CSV", () => {
  it("parses quoted names and contacts", () => {
    expect(
      parseGuestCsv(
        'name,contact\n"Doe, Sam",sam@example.com\nAlex,+15551234567',
      ),
    ).toEqual({
      guests: [
        {
          name: "Doe, Sam",
          contact: { method: "email", value: "sam@example.com" },
        },
        {
          name: "Alex",
          contact: { method: "phone", value: "+15551234567" },
        },
      ],
      errors: [],
    });
  });

  it("strips spreadsheet formula prefixes and reports bad rows", () => {
    const result = parseGuestCsv(
      "name,contact\n=Taylor,taylor@example.com\n,broken\nSam,not-a-phone",
    );
    expect(result.guests[0].name).toBe("Taylor");
    expect(result.errors).toEqual([
      { row: 3, message: "Name must be 1–40 characters" },
      { row: 4, message: "Contact must be a valid email or phone" },
    ]);
  });
});
