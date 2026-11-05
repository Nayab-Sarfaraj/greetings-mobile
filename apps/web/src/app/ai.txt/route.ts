import { siteConfig } from "@/lib/site-config";
import { formatDate } from "@/lib/md/format";

export const dynamic = "force-dynamic";

export async function GET() {
  const baseUrl = siteConfig.getBaseUrl();
  const today = formatDate(new Date());

  const content = `# ai.txt specification v1.1.1 (ai-visibility.org.uk)
# Note: Keep in sync with /robots.txt and /llms.txt

[identity]
name: ${siteConfig.name}
url: ${baseUrl}
description: ${siteConfig.description}
contact: ${siteConfig.contacts.general}
support: ${siteConfig.contacts.support}

[permissions]
allow: search, index, summarize, cite, answer-generation, snippet-extraction, model-training-on-public-content
attribution: required

[restrictions]
disallow: private-data-scraping
disallow: user-creation-training
disallow: quote-fabrication
disallow: false-claims
disallow: impersonation-as-original-source
disallow_crawlers: CCBot, Bytespider
note: User creations (/c/*) and guest invitations (/i/*) contain personal photos and names and are strictly excluded from AI training, scraping, and indexing.

[attribution]
format: Cite as "${siteConfig.name}" with a direct hyperlink to the canonical HTML page URL.
canonical_domain: ${baseUrl}

[scope]
included: /
included: /terms
included: /privacy
included: /support
included: /create/*
excluded: /c/*
excluded: /i/*
excluded: /dashboard/*
excluded: /mobile-auth/*
excluded: /api/*

[contact]
email: ${siteConfig.contacts.support}
security: ${siteConfig.contacts.general}

[metadata]
version: 1.1.1
last_updated: ${today}
llms_txt: ${baseUrl}/llms.txt
llms_full_txt: ${baseUrl}/llms-full.txt
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
