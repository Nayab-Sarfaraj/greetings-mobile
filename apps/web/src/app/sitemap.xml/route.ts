import { siteConfig } from "@/lib/site-config";
import { absoluteUrl, formatDate } from "@/lib/md/format";
import { listMarkdownRoutes } from "@/lib/md/registry";

export const dynamic = "force-dynamic";

export async function GET() {
  const routes = listMarkdownRoutes();
  const today = formatDate(new Date());

  const urls = routes.map((r) => {
    const loc = absoluteUrl(r.path);
    const priority = r.path === "/" ? "1.0" : r.section === "templates" ? "0.8" : "0.5";
    const changefreq = r.path === "/" ? "daily" : "weekly";
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
