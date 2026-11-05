import type { GuestInput } from "@greetings/shared";

export type CsvError = { row: number; message: string };

function rows(text: string) {
  const result: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((item) => item.trim())) result.push(row);
      row = [];
      field = "";
    } else field += character;
  }
  row.push(field);
  if (row.some((item) => item.trim())) result.push(row);
  return { rows: result, quoted };
}

export function parseGuestCsv(text: string): {
  guests: GuestInput[];
  errors: CsvError[];
} {
  const parsed = rows(text.replace(/^\uFEFF/, ""));
  if (!parsed.rows.length)
    return { guests: [], errors: [{ row: 1, message: "CSV is empty" }] };
  if (parsed.quoted)
    return {
      guests: [],
      errors: [{ row: parsed.rows.length, message: "Unclosed quoted field" }],
    };
  const headers = parsed.rows[0].map((item) => item.trim().toLowerCase());
  const nameColumn = headers.indexOf("name");
  const contactColumn = headers.indexOf("contact");
  if (nameColumn < 0)
    return {
      guests: [],
      errors: [{ row: 1, message: 'Add a header named "name"' }],
    };
  const guests: GuestInput[] = [];
  const errors: CsvError[] = [];
  parsed.rows.slice(1).forEach((values, index) => {
    const row = index + 2;
    const name = (values[nameColumn] ?? "")
      .normalize("NFKC")
      .replace(/^[=+\-@]+/, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!name || name.length > 40) {
      errors.push({ row, message: "Name must be 1–40 characters" });
      return;
    }
    const value = (values[contactColumn] ?? "").trim();
    if (!value) {
      guests.push({ name });
      return;
    }
    if (value.includes("@")) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push({ row, message: "Contact must be a valid email or phone" });
        return;
      }
      guests.push({ name, contact: { method: "email", value } });
      return;
    }
    if (!/^\+?[0-9\s().-]{7,20}$/.test(value)) {
      errors.push({ row, message: "Contact must be a valid email or phone" });
      return;
    }
    guests.push({ name, contact: { method: "phone", value } });
  });
  return { guests, errors };
}
