import { siteConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export async function GET() {
  const baseUrl = siteConfig.getBaseUrl();

  const robots = `# robots.txt for ${siteConfig.name}
# Note: Keep in sync with /llms.txt and /ai.txt
# AI Manifest: ${baseUrl}/llms.txt
# Full Content: ${baseUrl}/llms-full.txt
# AI Policy: ${baseUrl}/ai.txt

# ================================================================
# Search, Answer-Engine & Permitted AI Crawlers
# ================================================================
User-agent: OAI-SearchBot
User-agent: ChatGPT-User
User-agent: Claude-SearchBot
User-agent: Claude-User
User-agent: PerplexityBot
User-agent: Perplexity-User
User-agent: GPTBot
User-agent: ClaudeBot
User-agent: Google-Extended
User-agent: Applebot-Extended
Allow: /
Allow: /terms
Allow: /privacy
Allow: /support
Allow: /create/
Disallow: /c/
Disallow: /i/
Disallow: /dashboard/
Disallow: /mobile-auth/
Disallow: /api/

# ================================================================
# Blocked Crawlers (Mass web scraping bots)
# ================================================================
User-agent: CCBot
User-agent: Bytespider
Disallow: /

# ================================================================
# Default Crawlers
# ================================================================
User-agent: *
Allow: /
Allow: /terms
Allow: /privacy
Allow: /support
Allow: /create/
Disallow: /c/
Disallow: /i/
Disallow: /dashboard/
Disallow: /mobile-auth/
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`;

  return new Response(robots, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
