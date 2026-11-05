import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  listMarkdownRoutes,
  renderMarkdownRoute,
  SKIPPED_ROUTES,
} from "./registry";
import { shouldServeMarkdown } from "./negotiate";
import { estimateTokens } from "./format";

describe("Markdown Route Registry Coverage", () => {
  it("every public page route in apps/web/src/app is either registered or explicitly skipped with a documented reason", () => {
    const appDir = path.resolve(__dirname, "../../app");
    const registered = new Set(listMarkdownRoutes().map((r) => r.path));
    const skipped = new Set(SKIPPED_ROUTES.map((s) => s.pattern));

    // Recursively find all page.tsx files
    function findPageRoutes(dir: string, baseRoute = ""): string[] {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      const routes: string[] = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (entry.name.startsWith("(") || entry.name.startsWith("_")) {
            // Group folder or private folder
            routes.push(...findPageRoutes(path.join(dir, entry.name), baseRoute));
          } else if (entry.name !== "api") {
            const nextBase = `${baseRoute}/${entry.name}`;
            routes.push(...findPageRoutes(path.join(dir, entry.name), nextBase));
          }
        } else if (entry.name === "page.tsx" || entry.name === "page.ts") {
          routes.push(baseRoute === "" ? "/" : baseRoute);
        }
      }

      return routes;
    }

    const appRoutes = findPageRoutes(appDir);

    for (const route of appRoutes) {
      const isRegistered = registered.has(route);
      const isSkipped = skipped.has(route);

      // Parameterized matching check, e.g. /create/[templateId] -> registered via /create/:id
      const matchesParamRegistered =
        route.startsWith("/create/") &&
        [...registered].some((r) => r.startsWith("/create/"));

      const covered = isRegistered || isSkipped || matchesParamRegistered;

      expect(
        covered,
        `Route "${route}" must have a markdown renderer or be listed in SKIPPED_ROUTES with a reason.`,
      ).toBe(true);
    }
  });

  it("every entry in SKIPPED_ROUTES has a non-empty rationale", () => {
    for (const item of SKIPPED_ROUTES) {
      expect(item.pattern).toBeTruthy();
      expect(item.reason.length).toBeGreaterThan(15);
    }
  });

  it("renders the homepage markdown with metadata and templates", async () => {
    const result = await renderMarkdownRoute("/");
    expect(result).not.toBeNull();
    expect(result?.markdown).toContain("# CherryQube");
    expect(result?.markdown).toContain("Canonical: ");
    expect(result?.markdown).toContain("Harvest greeting");
    expect(result?.canonicalPath).toBe("/");
  });

  it("renders legal pages correctly", async () => {
    const terms = await renderMarkdownRoute("/terms");
    expect(terms).not.toBeNull();
    expect(terms?.markdown).toContain("# Terms of Service");

    const privacy = await renderMarkdownRoute("/privacy");
    expect(privacy).not.toBeNull();
    expect(privacy?.markdown).toContain("# Privacy Notice");

    const support = await renderMarkdownRoute("/support");
    expect(support).not.toBeNull();
    expect(support?.markdown).toContain("# Support & Help");
  });

  it("renders template detail markdown", async () => {
    const card = await renderMarkdownRoute("/create/harvest-card");
    expect(card).not.toBeNull();
    expect(card?.markdown).toContain("Harvest greeting");
    expect(card?.markdown).toContain("Required Inputs");
    expect(card?.canonicalPath).toBe("/create/harvest-card");
  });

  it("strictly excludes private user creation and guest routes", async () => {
    expect(await renderMarkdownRoute("/c/1234567890123456789012")).toBeNull();
    expect(await renderMarkdownRoute("/i/1234567890123456789012")).toBeNull();
    expect(await renderMarkdownRoute("/dashboard")).toBeNull();
    expect(await renderMarkdownRoute("/does-not-exist")).toBeNull();
  });
});

describe("Content Negotiation (shouldServeMarkdown)", () => {
  it("serves markdown when explicitly requested with higher priority than html", () => {
    expect(shouldServeMarkdown("text/markdown")).toBe(true);
    expect(
      shouldServeMarkdown("text/markdown;q=0.9, text/html;q=0.8, */*;q=0.5"),
    ).toBe(true);
  });

  it("does not serve markdown when html has higher or equal priority", () => {
    expect(
      shouldServeMarkdown(
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      ),
    ).toBe(false);
    expect(
      shouldServeMarkdown("text/markdown;q=0.5, text/html;q=0.9"),
    ).toBe(false);
  });

  it("defaults to HTML on missing or wildcard-only accept header", () => {
    expect(shouldServeMarkdown(null)).toBe(false);
    expect(shouldServeMarkdown("")).toBe(false);
    expect(shouldServeMarkdown("*/*")).toBe(false);
  });
});

describe("Format & Token Estimation", () => {
  it("estimates tokens realistically", () => {
    expect(estimateTokens("")).toBe(1);
    expect(estimateTokens("abcd")).toBe(1);
    expect(estimateTokens("a".repeat(100))).toBe(25);
  });
});
