import {
  renderMarkdownRoute,
  listMarkdownRoutes,
} from "@/lib/md/registry";
import {
  markdownResponse,
  markdownNotFoundResponse,
  markdownOptionsResponse,
} from "@/lib/md/http";
import { absoluteUrl } from "@/lib/md/format";
import { siteConfig } from "@/lib/site-config";

type Context = {
  params: Promise<{ path: string[] }>;
};

function getCatalogResponse(isHead: boolean) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    "Access-Control-Allow-Origin": "*",
  };

  if (isHead) {
    return new Response(null, { headers });
  }

  const routes = listMarkdownRoutes();
  const catalog = {
    site: siteConfig.name,
    baseUrl: siteConfig.getBaseUrl(),
    totalRoutes: routes.length,
    routes: routes.map((r) => ({
      path: r.path,
      title: r.title,
      description: r.description,
      section: r.section,
      markdownUrl: absoluteUrl(
        r.path === "/" ? "/index.md" : `${r.path}.md`,
      ),
      canonicalUrl: absoluteUrl(r.path),
    })),
  };

  return Response.json(catalog, { headers });
}

async function handle(request: Request, context: Context, isHead = false) {
  const { path } = await context.params;
  const requestedPath = `/${path.join("/")}`;

  if (requestedPath === "/_catalog") {
    return getCatalogResponse(isHead);
  }

  const result = await renderMarkdownRoute(requestedPath);
  if (!result) {
    return markdownNotFoundResponse(requestedPath, isHead);
  }

  return markdownResponse(result.markdown, {
    canonicalPath: result.canonicalPath,
    lastModified: result.lastModified,
    isHead,
  });
}

export async function GET(request: Request, context: Context) {
  return handle(request, context, false);
}

export async function HEAD(request: Request, context: Context) {
  return handle(request, context, true);
}

export async function OPTIONS() {
  return markdownOptionsResponse();
}
