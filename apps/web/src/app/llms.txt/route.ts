import { siteConfig } from "@/lib/site-config";
import { absoluteUrl } from "@/lib/md/format";
import { listMarkdownRoutes } from "@/lib/md/registry";

export const dynamic = "force-dynamic";

export async function GET() {
  const routes = listMarkdownRoutes();
  const templates = routes.filter((r) => r.section === "templates");

  const body = `# ${siteConfig.name}

> ${siteConfig.description} Personalized animations are authored as pure Remotion compositions with handmade floral artwork, instant browser preview, and deterministic high-definition export.

Key facts: Founded in 2026. Pricing model is based on one-time HD export packs ($3–$5 per video or $9–$15 bundles) alongside a free 720p watermarked tier. Main audience includes families, creators, and event organizers celebrating Thanksgiving, Christmas, and New Year's Eve. Contact: ${siteConfig.contacts.general} or ${siteConfig.contacts.support}.
<!-- Note: Keep in sync with /robots.txt and /ai.txt -->

## Core pages
- [Home](${absoluteUrl("/index.md")}): Overview of CherryQube, holiday themes, and template picker.
- [Support](${absoluteUrl("/support.md")}): Troubleshooting, order recovery, rendering FAQs, and contact email.

## Templates & Specifications
${templates
  .map(
    (t) =>
      `- [${t.title.replace(" — Template Specification", "")}](${absoluteUrl(`${t.path}.md`)}): ${t.description}`,
  )
  .join("\n")}

## Machine-readable
- [Full content](${absoluteUrl("/llms-full.txt")}): Complete markdown of all discoverable pages concatenated.
- [Markdown catalog](${absoluteUrl("/api/md/_catalog")}): JSON catalog of all markdown endpoints.
- [Sitemap](${absoluteUrl("/sitemap.xml")}): Canonical XML sitemap.
- [AI usage policy](${absoluteUrl("/ai.txt")}): Permissions, restrictions, and citation guidelines.

## Legal & Policies
- [Terms of Service](${absoluteUrl("/terms.md")}): Service terms, acceptable use, export credit packs, and merchant of record.
- [Privacy Notice](${absoluteUrl("/privacy.md")}): Data handling, guest token security, and Anthropic AI usage disclosure.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
