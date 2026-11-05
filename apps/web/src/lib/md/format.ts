import { siteConfig } from "../site-config";

export function absoluteUrl(path: string, base?: string): string {
  const baseUrl = (base ?? siteConfig.getBaseUrl()).replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalized}`;
}

export function estimateTokens(markdown: string): number {
  return Math.max(1, Math.ceil(markdown.length / 4));
}

export function formatDate(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}

export function heading(level: 1 | 2 | 3 | 4, text: string): string {
  return `${"#".repeat(level)} ${text}`;
}

export function blockquote(text: string): string {
  return text
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
}

export function list(items: string[], ordered = false): string {
  return items
    .map((item, idx) => (ordered ? `${idx + 1}. ${item}` : `- ${item}`))
    .join("\n");
}

export function table(headers: string[], rows: string[][]): string {
  const headerRow = `| ${headers.join(" | ")} |`;
  const dividerRow = `| ${headers.map(() => "---").join(" | ")} |`;
  const bodyRows = rows.map((row) => `| ${row.join(" | ")} |`).join("\n");
  return `${headerRow}\n${dividerRow}\n${bodyRows}`;
}

export function link(text: string, url: string): string {
  return `[${text}](${url})`;
}
