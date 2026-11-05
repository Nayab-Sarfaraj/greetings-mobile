import { absoluteUrl, estimateTokens } from "./format";

export type MarkdownResponseOptions = {
  canonicalPath: string;
  lastModified?: Date;
  status?: number;
  cacheControl?: string;
  isHead?: boolean;
};

export function buildMarkdownHeaders(
  markdown: string,
  options: MarkdownResponseOptions,
): Headers {
  const headers = new Headers();
  const tokens = estimateTokens(markdown);
  const canonicalUrl = absoluteUrl(options.canonicalPath);

  headers.set("Content-Type", "text/markdown; charset=utf-8");
  headers.set("X-Markdown-Tokens", String(tokens));
  headers.set("X-Robots-Tag", "noindex, follow");
  headers.set("Content-Location", canonicalUrl);
  headers.set(
    "Link",
    `<${canonicalUrl}>; rel="canonical", <${absoluteUrl("/llms.txt")}>; rel="describedby", <${absoluteUrl("/llms-full.txt")}>; rel="describedby", <${absoluteUrl("/ai.txt")}>; rel="describedby"`,
  );
  headers.set("Vary", "Accept");
  headers.set(
    "Cache-Control",
    options.cacheControl ??
      "public, s-maxage=3600, stale-while-revalidate=86400",
  );
  headers.set(
    "Last-Modified",
    (options.lastModified ?? new Date()).toUTCString(),
  );

  // CORS headers
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Accept, Content-Type");

  return headers;
}

export function markdownResponse(
  markdown: string,
  options: MarkdownResponseOptions,
): Response {
  const headers = buildMarkdownHeaders(markdown, options);
  const body = options.isHead ? null : markdown;
  return new Response(body, {
    status: options.status ?? 200,
    headers,
  });
}

export function markdownNotFoundResponse(
  requestedPath: string,
  isHead = false,
): Response {
  const body = `# 404 Not Found

> The page you requested does not exist or is not available as markdown.

Requested: \`${requestedPath}\`

## Discoverable pages
- [CherryQube Home](${absoluteUrl("/")})
- [Terms & Pricing](${absoluteUrl("/terms")})
- [Privacy Policy](${absoluteUrl("/privacy")})
- [Support](${absoluteUrl("/support")})
- [AI Site Map](${absoluteUrl("/llms.txt")})
`;

  return markdownResponse(body, {
    canonicalPath: requestedPath,
    status: 404,
    cacheControl: "no-store",
    isHead,
  });
}

export function markdownOptionsResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Accept, Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}
