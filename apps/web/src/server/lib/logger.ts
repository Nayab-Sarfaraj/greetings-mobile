type Level = "info" | "warn" | "error";
export function log(
  level: Level,
  event: string,
  details: Record<string, string | number | boolean> = {},
) {
  process.stdout.write(`${JSON.stringify({ level, event, ...details })}\n`);
}
