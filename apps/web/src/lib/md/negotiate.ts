export function parseAcceptHeader(
  acceptHeader: string | null | undefined,
): Map<string, number> {
  const map = new Map<string, number>();
  if (!acceptHeader || !acceptHeader.trim()) return map;

  const entries = acceptHeader.split(",");
  for (const entry of entries) {
    const parts = entry.split(";").map((p) => p.trim());
    const mediaType = parts[0]?.toLowerCase();
    if (!mediaType) continue;

    let q = 1.0;
    for (let i = 1; i < parts.length; i++) {
      const param = parts[i];
      if (param.startsWith("q=")) {
        const val = parseFloat(param.slice(2));
        if (!isNaN(val) && val >= 0 && val <= 1) {
          q = val;
        }
      }
    }
    map.set(mediaType, q);
  }

  return map;
}

export function shouldServeMarkdown(
  acceptHeader: string | null | undefined,
): boolean {
  if (!acceptHeader) return false;

  const weights = parseAcceptHeader(acceptHeader);
  const markdownQ = weights.get("text/markdown") ?? 0;
  if (markdownQ <= 0) return false;

  // text/html weight: explicitly provided, or inherited from text/* or */*
  let htmlQ = weights.get("text/html");
  if (htmlQ === undefined) {
    htmlQ = weights.get("text/*");
  }
  if (htmlQ === undefined) {
    // If */* is present without an explicit text/markdown advantage, default to HTML
    const wildcardQ = weights.get("*/*") ?? 0;
    htmlQ = wildcardQ;
  }

  return markdownQ > htmlQ;
}
