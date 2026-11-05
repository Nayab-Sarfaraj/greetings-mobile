import { siteConfig } from "@/lib/site-config";
import { absoluteUrl, formatDate } from "@/lib/md/format";
import { listMarkdownRoutes, renderMarkdownRoute } from "@/lib/md/registry";

export const dynamic = "force-dynamic";

export async function GET() {
  const allRoutes = listMarkdownRoutes().filter((r) => r.inFull);

  // Order: core pages → templates → legal
  const orderMap = { core: 1, templates: 2, legal: 3 };
  allRoutes.sort((a, b) => orderMap[a.section] - orderMap[b.section]);

  const sections: string[] = [];
  sections.push(`# ${siteConfig.name} — Full Content

> Complete archive of all public pages, holiday themes, template specifications, policies, and documentation on CherryQube.
Generated: ${formatDate(new Date())}
<!-- Note: Keep in sync with /robots.txt and /ai.txt -->`);

  for (const route of allRoutes) {
    const rendered = await renderMarkdownRoute(route.path);
    if (rendered) {
      const sourceUrl = absoluteUrl(rendered.canonicalPath);
      sections.push(`---
<!-- source: ${sourceUrl} -->
${rendered.markdown.trim()}`);
    }
  }

  const fullContent = sections.join("\n\n");

  return new Response(fullContent, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
