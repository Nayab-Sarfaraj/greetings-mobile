# CherryQube — SEO & GEO (Generative Engine Optimization) Architecture & Maintenance Guide

This document explains CherryQube's SEO and GEO implementation. If you change a page, template, policy, or crawler rule in the future, follow the instructions in this guide.

---

## 1. Overview & Architecture

CherryQube is designed to be fully readable by humans, search engines, and AI agents (ChatGPT, Claude, Perplexity, Copilot, etc.) without exposing private user data or duplicating content.

```
                    ┌─────────────────────────┐
                    │ Client Request / Crawler│
                    └───────────┬─────────────┘
                                │
                                ▼
               ┌─────────────────────────────────┐
               │ apps/web/src/proxy.ts (Gateway) │
               └──────┬────────────────────┬─────┘
                      │                    │
        Accept: text/markdown              │ Normal browser request
        OR path ends in .md                │ OR Accept: */*
                      │                    │
                      ▼                    ▼
        ┌────────────────────────┐  ┌─────────────────────────┐
        │ apps/web/src/app/      │  │ Normal Next.js Page     │
        │ api/md/[...path]       │  │ (HTML + Head Signals)   │
        └─────────────┬──────────┘  └─────────────────────────┘
                      │                    │
                      ▼                    ▼
        ┌────────────────────────┐  ┌─────────────────────────┐
        │ src/lib/md/registry.ts │  │ <meta name="ai-summary">│
        │ (Single Registry)      │  │ <link rel="alternate">  │
        └────────────────────────┘  │ Link: rel="describedby" │
                                    │ JSON-LD Org & WebSite   │
                                    └─────────────────────────┘
```

### Core GEO & Discovery Endpoints
1. **`/llms.txt`**: Standard manifest following the [llmstxt.org](https://llmstxt.org) specification. Dynamic, generated from code via [`apps/web/src/app/llms.txt/route.ts`](file:///Users/nayab.sarfaraj/Desktop/greetings-mobile/apps/web/src/app/llms.txt/route.ts).
2. **`/llms-full.txt`**: Complete concatenation of all public pages in structured markdown via [`apps/web/src/app/llms-full.txt/route.ts`](file:///Users/nayab.sarfaraj/Desktop/greetings-mobile/apps/web/src/app/llms-full.txt/route.ts).
3. **`/ai.txt`**: Machine-readable AI policy following [ai-visibility.org.uk v1.1.1](https://ai-visibility.org.uk) via [`apps/web/src/app/ai.txt/route.ts`](file:///Users/nayab.sarfaraj/Desktop/greetings-mobile/apps/web/src/app/ai.txt/route.ts).
4. **`/robots.txt`**: Dynamic robots manifest allowing search crawlers and approved foundation training crawlers, while blocking mass scrapers (`CCBot`, `Bytespider`) and private paths via [`apps/web/src/app/robots.txt/route.ts`](file:///Users/nayab.sarfaraj/Desktop/greetings-mobile/apps/web/src/app/robots.txt/route.ts).
5. **`/sitemap.xml`**: Canonical XML sitemap indexing only public HTML pages (no `.md` alternates) via [`apps/web/src/app/sitemap.xml/route.ts`](file:///Users/nayab.sarfaraj/Desktop/greetings-mobile/apps/web/src/app/sitemap.xml/route.ts).
6. **`/api/md/_catalog`**: JSON catalog of all addressable markdown endpoints via [`apps/web/src/app/api/md/[...path]/route.ts`](file:///Users/nayab.sarfaraj/Desktop/greetings-mobile/apps/web/src/app/api/md/[...path]/route.ts).

---

## 2. Privacy & User Data Protection (STRICT)

User-generated cards and invitations are **private by default**:
- `/c/[id]` (rendered card / video result page)
- `/i/[token]` (per-guest video invitation page)
- `/dashboard` (creator dashboard)

### Protection Rules
- **Markdown Access**: Blocked. Requesting `/c/[id].md` or `/i/[token].md` returns a markdown `404 Not Found`.
- **Content Negotiation**: Neither route is included in `NEGOTIATION_ALLOWLIST` in `proxy.ts`.
- **Crawlers**: `Disallow: /c/`, `Disallow: /i/`, `Disallow: /dashboard/` in `robots.txt` and `excluded:` in `ai.txt`.
- **HTML Meta**: Pages emit `<meta name="robots" content="noindex"/>` by default.
- **Sitemap**: Strictly omitted from `/sitemap.xml`.
- **Test Enforcement**: `src/lib/md/registry.test.ts` asserts that private routes are never returned by the registry.

---

## 3. Maintenance Playbook: "What to update if I change X"

### Scenario A: Adding a new public page (e.g., `/faq`, `/about`)

When creating a new route:
1. **Create the Page & Head Signals (`apps/web/src/app/<route>/page.tsx`)**:
   Add `generateMetadata` (or static `metadata`):
   ```ts
   import { siteConfig } from "@/lib/site-config";

   export const metadata: Metadata = {
     title: "About Us · CherryQube",
     description: "...",
     alternates: {
       types: {
         "text/markdown": `${siteConfig.getBaseUrl()}/about.md`,
       },
     },
     other: {
       "ai-summary": "1-2 factual sentences summarizing this page for AI agents.",
     },
   };
   ```

2. **Add Renderer in Registry (`apps/web/src/lib/md/registry.ts`)**:
   - Write a `renderAbout(): string` function using formatting helpers (`heading`, `list`, `table`, `link`, etc.).
   - Add the route to `listMarkdownRoutes()`:
     ```ts
     {
       path: "/about",
       title: "About Us · CherryQube",
       description: "...",
       lastModified: LAST_UPDATED,
       section: "core", // "core" | "templates" | "legal"
       inFull: true,
     }
     ```
   - Add dispatch check in `renderMarkdownRoute`:
     ```ts
     if (clean === "/about") {
       return {
         markdown: renderAbout(),
         lastModified: LAST_UPDATED,
         canonicalPath: "/about",
       };
     }
     ```

3. **Allow Content Negotiation in Proxy (`apps/web/src/proxy.ts`)**:
   - Add `"/about"` to `NEGOTIATION_ALLOWLIST`.

4. **Run Registry Test**:
   ```bash
   corepack pnpm -C apps/web test
   ```
   *Note: `registry.test.ts` scans `apps/web/src/app` for all `page.tsx` files. If you add a page without registering it or listing it in `SKIPPED_ROUTES`, the test will fail!*

---

### Scenario B: Adding or Modifying a Holiday Template

Templates are defined in `packages/remotion/src/templates.ts`.

- When you add or modify a template in `packages/remotion/src/templates.ts`:
  - It **automatically appears** in `/llms.txt`, `/llms-full.txt`, `/sitemap.xml`, and `/api/md/_catalog` because all these generators read from `siteConfig.templates`.
  - The duration is automatically calculated via `tpl.scenes.reduce((acc, s) => acc + s.seconds, 0)`.
  - The markdown specification page at `/create/[templateId].md` is automatically rendered.
  - If you add new scene types, update `SCENE_INFO` in `apps/web/src/lib/md/registry.ts` with human-readable titles and descriptions.

---

### Scenario C: Changing Brand Info, Contacts, or Pricing

Never hardcode brand metadata across multiple files. All metadata is controlled in a single source of truth:
- **File**: [`apps/web/src/lib/site-config.ts`](file:///Users/nayab.sarfaraj/Desktop/greetings-mobile/apps/web/src/lib/site-config.ts)

Fields:
- `name`: Site brand name (`CherryQube`)
- `tagline`: Headline tagline
- `description`: Site meta description
- `aiSummary`: 1-2 sentence overview for AI agents
- `contacts.general`: General email (`contact@cherryqube.com`)
- `contacts.support`: Support email (`support@cherryqube.com`)
- `pricing.freeTier` & `pricing.paidTier`: Pricing model description
- `holidays`: Holiday themes, dates, palettes, and flora

Updating this file automatically synchronizes:
- Homepage markdown
- `/llms.txt` and `/llms-full.txt`
- `/ai.txt`
- Root layout JSON-LD (`Organization` & `WebSite`)
- Root layout meta description and `<meta name="ai-summary">`

---

### Scenario D: Changing AI Crawler Rules (Robots & AI Policy)

CherryQube distinguishes between search/citation bots, foundation training bots, and aggressive scraping bots.

1. **`apps/web/src/app/robots.txt/route.ts`**:
   - **Allowed for search & citations**: `OAI-SearchBot`, `ChatGPT-User`, `Claude-SearchBot`, `Claude-User`, `PerplexityBot`, `Perplexity-User`.
   - **Allowed for training on public content**: `GPTBot`, `ClaudeBot`, `Google-Extended`, `Applebot-Extended`.
   - **Blocked**: `CCBot`, `Bytespider`.
   - **Private Paths Disallowed for all bots**: `/c/`, `/i/`, `/dashboard/`, `/mobile-auth/`, `/api/`.

2. **`apps/web/src/app/ai.txt/route.ts`**:
   - Update `[permissions]` and `[restrictions]` to mirror any changes in `robots.txt`.
   - Both files have comments stating: `# Note: Keep in sync with /robots.txt and /llms.txt`.

---

### Scenario E: Adding an Internal or Authenticated Route (e.g. `/admin`, `/settings`)

If you add a private route that should **NOT** have a public markdown representation:
1. Add the path pattern and documented reason to `SKIPPED_ROUTES` in `apps/web/src/lib/md/registry.ts`:
   ```ts
   {
     pattern: "/admin",
     reason: "Internal administration console; private data.",
   }
   ```
2. Disallow the route in `apps/web/src/app/robots.txt/route.ts`:
   ```txt
   Disallow: /admin/
   ```
3. Exclude the route in `apps/web/src/app/ai.txt/route.ts`:
   ```txt
   excluded: /admin/*
   ```
4. Verify by running:
   ```bash
   corepack pnpm -C apps/web test
   ```

---

## 4. Verification Commands Cheat Sheet

Run these commands to verify that your SEO and GEO setup is in working order:

```bash
# 1. Run unit test suite (checks route coverage & content negotiation)
corepack pnpm -C apps/web test

# 2. Run TypeScript checks across monorepo
corepack pnpm -r typecheck

# 3. Test markdown URL endpoint
curl -sI http://localhost:3000/terms.md

# 4. Test content negotiation (must return markdown)
curl -s -H 'Accept: text/markdown' http://localhost:3000/terms | head -20

# 5. Test normal browser request (must return HTML with Link describedby header)
curl -sI http://localhost:3000/terms

# 6. Test wildcard request (must return HTML, NOT markdown)
curl -sI -H 'Accept: */*' http://localhost:3000/

# 7. Test AI manifest files
curl -s http://localhost:3000/llms.txt
curl -s http://localhost:3000/llms-full.txt | head -30
curl -s http://localhost:3000/ai.txt
curl -s http://localhost:3000/api/md/_catalog
curl -s http://localhost:3000/robots.txt
curl -s http://localhost:3000/sitemap.xml
```
