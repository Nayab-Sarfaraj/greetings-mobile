import { siteConfig } from "../site-config";
import {
  heading,
  blockquote,
  table,
  list,
  link,
  absoluteUrl,
  formatDate,
} from "./format";
import {
  getTemplate,
  durationInFrames,
  type Template,
  type SceneId,
} from "@greetings/remotion/templates";
import { getTheme } from "@greetings/remotion/themes";

export type MarkdownRouteEntry = {
  path: string;
  title: string;
  description: string;
  lastModified: Date;
  section: "core" | "templates" | "legal";
  inFull: boolean;
};

export type SkippedRouteEntry = {
  pattern: string;
  reason: string;
};

export const SKIPPED_ROUTES: SkippedRouteEntry[] = [
  {
    pattern: "/c/[id]",
    reason:
      "Private user-generated creations (excluded to protect personal photos and messages).",
  },
  {
    pattern: "/i/[token]",
    reason:
      "Private per-guest invitations (excluded to protect guest personal data and RSVP contact).",
  },
  {
    pattern: "/c-live/[id]",
    reason: "Internal rewrite alias for live processing state.",
  },
  {
    pattern: "/i-not-found",
    reason: "Error page, not content.",
  },
  {
    pattern: "/dashboard",
    reason: "Authenticated creator dashboard; strictly private user data.",
  },
  {
    pattern: "/mobile-auth",
    reason: "Internal native mobile OAuth session ticket exchange callback.",
  },
];

const LAST_UPDATED = new Date("2026-11-05T00:00:00Z");

const SCENE_INFO: Record<SceneId, { title: string; description: string }> = {
  intro: {
    title: "Intro Scene",
    description:
      "Opening botanical animation introducing theme and greeting headline.",
  },
  details: {
    title: "Event Details",
    description: "Event date, time, location, and host announcement.",
  },
  "guest-name": {
    title: "Guest Name",
    description:
      "Personalized guest name in calligraphy script for individual invite links.",
  },
  closing: {
    title: "Closing Greeting",
    description:
      "Final message card with sender or host signature within floral border.",
  },
};

function getTemplateMeta(tpl: Template) {
  const theme = getTheme(tpl.themeId);
  const durationSec = tpl.scenes.reduce((acc, s) => acc + s.seconds, 0);
  const description = `${tpl.title} is a ${
    tpl.type === "card"
      ? "5–8 second animated greeting card"
      : "video invitation"
  } for ${theme.label} with live browser preview and customizable message.`;
  return { theme, durationSec, description };
}

function renderHome(): string {
  const templateRows = siteConfig.templates.map((tpl) => {
    const { theme, durationSec, description } = getTemplateMeta(tpl);
    return [
      link(tpl.title, absoluteUrl(`/create/${tpl.id}`)),
      tpl.type === "card" ? `Card (${durationSec}s)` : `Invitation (${durationSec}s)`,
      theme.label,
      description,
    ];
  });

  const holidayRows = siteConfig.holidays.map((h) => [
    h.name,
    h.date,
    h.theme,
    h.palette.join(", "),
    h.flora,
  ]);

  return `${heading(1, "CherryQube — Animated Holiday Greetings & Video Invitations")}

${blockquote(siteConfig.description)}

Canonical: ${absoluteUrl("/")}
Last updated: ${formatDate(LAST_UPDATED)}

## Overview

CherryQube allows anyone to create personalized, animated holiday greeting cards and video invitations directly in the web browser. The service is built with Next.js and Remotion, providing real-time in-browser previews before rendering deterministic high-definition MP4 videos.

## Supported Holiday Themes

${table(
  ["Holiday", "Date", "Theme Name", "Color Palette", "Flora & Artwork"],
  holidayRows,
)}

## Available Templates

${table(["Template", "Type & Duration", "Holiday Theme", "Description"], templateRows)}

## Key Features

${list([
  "**Deterministic Video Rendering:** Powered by Remotion with pure parameterised compositions and inline floral SVG artwork.",
  "**Instant Preview:** Full 60fps video player preview directly in the browser before any rendering or payment.",
  "**AI Message Writer:** Server-side AI text suggestion assistance with adjustable tone (warm, funny, formal) and UK/US English spelling.",
  "**Per-Guest Video Invitations:** Generates unique links (/i/[token]) that dynamically display each guest's name in the final video scene without re-rendering generic MP4s.",
  "**Two Quality Tiers:** Free 720p video downloads with a discreet watermark, or 1080p full HD exports without watermark using one-time credit packs.",
])}

## Pricing & Quality

${list([
  `**Free Tier:** ${siteConfig.pricing.freeTier}`,
  `**Paid HD Tier:** ${siteConfig.pricing.paidTier}`,
  "**No Subscriptions:** One-time packs only. Credits never expire during the holiday season.",
])}

## Related Links
- ${link("Terms of Service", absoluteUrl("/terms"))}
- ${link("Privacy Notice", absoluteUrl("/privacy"))}
- ${link("Support & Contact", absoluteUrl("/support"))}
- ${link("AI Usage Policy", absoluteUrl("/ai.txt"))}
- ${link("Machine-Readable Site Map", absoluteUrl("/llms.txt"))}
`;
}

function renderTerms(): string {
  const seller = siteConfig.getSellerName();
  return `${heading(1, "Terms of Service · CherryQube")}

${blockquote("Terms and conditions for using CherryQube to create and export animated cards and video invitations.")}

Canonical: ${absoluteUrl("/terms")}
Last updated: ${formatDate(LAST_UPDATED)}

## Using CherryQube

CherryQube lets you personalize animated greeting cards and video invitations. The service is operated by ${seller}. By using the service, you agree to these terms. Guests can watch public creations without an account.

## Your Content and Account

You keep ownership of your photos and text. You give us permission to store, render, and deliver them so the service can work. Only upload content you have permission to use. Do not create unlawful, abusive, deceptive, or infringing content. You are responsible for keeping your account secure and for choosing who receives your links.

## Message Suggestions

The optional message writer can suggest text using an AI provider or curated templates. Suggestions may be inaccurate or unsuitable. You can edit every suggestion and are responsible for reviewing it before saving, exporting, or sharing your creation.

## Exports and One-Time Packs

Free exports are 720p and include a watermark. One export credit pays for one 1080p video without a watermark. Packs are one-time purchases, not subscriptions. The pack price, number of exports, and final taxes are shown before payment. Polar handles checkout as merchant of record.

## Related Links
- ${link("Home", absoluteUrl("/"))}
- ${link("Privacy Notice", absoluteUrl("/privacy"))}
- ${link("Support", absoluteUrl("/support"))}
`;
}

function renderPrivacy(): string {
  const seller = siteConfig.getSellerName();
  const email = siteConfig.getSupportEmail();
  return `${heading(1, "Privacy Notice · CherryQube")}

${blockquote("How CherryQube collects, uses, and protects personal data for creators and guests.")}

Canonical: ${absoluteUrl("/privacy")}
Last updated: ${formatDate(LAST_UPDATED)}

## Who Handles Your Information

${seller} handles the information needed to create, render, and share your greetings and invitations. Contact ${link(email, `mailto:${email}`)} for any data inquiries.

## Information We Use

- **Creators:** Account identifier, saved text and event details, host reply contact, uploaded photos, render status, and export-credit transactions. Clerk handles sign-in; Polar handles checkout as merchant of record without storing raw payment cards on our servers.
- **AI Message Writer:** Prompts sent to Anthropic contain only the event context, relationship, and tone. User data is treated as inert parameters; usage logs record only token counts and response latency without storing prompt bodies.
- **Guests:** Guest links contain only the recipient's name and event details. Contact values (phone/email) are stored solely for creator convenience and are never indexed or exposed publicly.

## Related Links
- ${link("Home", absoluteUrl("/"))}
- ${link("Terms of Service", absoluteUrl("/terms"))}
- ${link("Support", absoluteUrl("/support"))}
`;
}

function renderSupport(): string {
  const seller = siteConfig.getSellerName();
  const supportEmail = siteConfig.getSupportEmail();
  return `${heading(1, "Support & Help · CherryQube")}

${blockquote("Customer support, troubleshooting, payment assistance, and rendering guidance for CherryQube.")}

Canonical: ${absoluteUrl("/support")}
Last updated: ${formatDate(LAST_UPDATED)}

## Contact Support

Need help with an account, export credit, refund, or privacy request?
- **Support Email:** ${link(supportEmail, `mailto:${supportEmail}`)}
- **General Inquiries:** ${link(siteConfig.contacts.general, `mailto:${siteConfig.contacts.general}`)}
- **Operator:** ${seller}

## Frequently Asked Questions

### A payment has not appeared
Return to the editor and choose Check payment again. Confirmation arrives via Polar webhooks. If charged and credits do not appear, email ${supportEmail} with your Polar order reference.

### A video failed to render
A failed paid export automatically returns its credit to your account balance. Check your balance in the editor and retry exporting.

### How to remove a creation
Creators can delete an invitation and all associated guest links at any time directly from the creator dashboard.

## Related Links
- ${link("Home", absoluteUrl("/"))}
- ${link("Terms of Service", absoluteUrl("/terms"))}
- ${link("Privacy Notice", absoluteUrl("/privacy"))}
`;
}

function renderTemplate(templateId: string): string | null {
  const template = getTemplate(templateId);
  if (!template) return null;

  const { theme, durationSec, description } = getTemplateMeta(template);
  const canonical = absoluteUrl(`/create/${template.id}`);
  const holiday = siteConfig.holidays.find((h) => h.id === template.themeId);
  const paletteStr = holiday ? holiday.palette.join(", ") : theme.accent;
  const floraStr = holiday ? holiday.flora : theme.flora;

  return `${heading(1, `${template.title} — Template Specification`)}

${blockquote(description)}

Canonical: ${canonical}
Last updated: ${formatDate(LAST_UPDATED)}

## Template Details
- **Template ID:** \`${template.id}\`
- **Format:** ${template.type === "card" ? "Animated Greeting Card" : "Event Video Invitation"}
- **Holiday Theme:** ${theme.label} (${template.themeId})
- **Duration:** ${durationSec} seconds (${durationInFrames(template)} frames at 30fps)
- **Palette:** ${paletteStr}
- **Floral Motifs:** ${floraStr}

## Scenes Included
${list(
  template.scenes.map(
    (s) =>
      `**${SCENE_INFO[s.id]?.title ?? s.id} (${s.seconds}s):** ${
        SCENE_INFO[s.id]?.description ?? s.id
      }`,
  ),
)}

## Required Inputs
${
  template.type === "card"
    ? list([
        "**Sender Name:** Name displayed in greeting and closing.",
        "**Recipient Name (optional):** Personal name addressed in card.",
        "**Message Text:** Greeting body (capped at 160 characters).",
        "**Photo (optional):** Square or portrait photo displayed in center frame.",
      ])
    : list([
        "**Event Title:** Name of the holiday party or gathering.",
        "**Host Name:** Name of host organizing event.",
        "**Date & Time:** Date and time of gathering.",
        "**Location:** Address or venue.",
        "**Message Text:** Invitation details (capped at 160 characters).",
        "**Host Contact:** Email, WhatsApp, or phone for guest RSVP replies.",
        "**Guest List:** Names of guests to receive personalized invitations.",
      ])
}

## Related Links
- ${link("Open Editor for this Template", canonical)}
- ${link("Browse All Templates", absoluteUrl("/"))}
`;
}

export function listMarkdownRoutes(): MarkdownRouteEntry[] {
  const routes: MarkdownRouteEntry[] = [
    {
      path: "/",
      title: "CherryQube — Animated Holiday Greetings & Video Invitations",
      description: siteConfig.description,
      lastModified: LAST_UPDATED,
      section: "core",
      inFull: true,
    },
    {
      path: "/terms",
      title: "Terms of Service · CherryQube",
      description:
        "Terms and conditions, export credits, pricing, and acceptable use.",
      lastModified: LAST_UPDATED,
      section: "legal",
      inFull: true,
    },
    {
      path: "/privacy",
      title: "Privacy Notice · CherryQube",
      description:
        "Data collection, security, and third-party AI service disclosures.",
      lastModified: LAST_UPDATED,
      section: "legal",
      inFull: true,
    },
    {
      path: "/support",
      title: "Support & Help · CherryQube",
      description:
        "Customer support contact details and common troubleshooting steps.",
      lastModified: LAST_UPDATED,
      section: "core",
      inFull: true,
    },
  ];

  for (const tpl of siteConfig.templates) {
    const { description } = getTemplateMeta(tpl);
    routes.push({
      path: `/create/${tpl.id}`,
      title: `${tpl.title} — Template Specification`,
      description,
      lastModified: LAST_UPDATED,
      section: "templates",
      inFull: true,
    });
  }

  return routes;
}

export async function renderMarkdownRoute(
  rawPath: string,
): Promise<{ markdown: string; lastModified: Date; canonicalPath: string } | null> {
  const clean = rawPath.replace(/\.md$/, "").replace(/\/$/, "") || "/";

  if (clean === "/" || clean === "/index") {
    return {
      markdown: renderHome(),
      lastModified: LAST_UPDATED,
      canonicalPath: "/",
    };
  }

  if (clean === "/terms") {
    return {
      markdown: renderTerms(),
      lastModified: LAST_UPDATED,
      canonicalPath: "/terms",
    };
  }

  if (clean === "/privacy") {
    return {
      markdown: renderPrivacy(),
      lastModified: LAST_UPDATED,
      canonicalPath: "/privacy",
    };
  }

  if (clean === "/support") {
    return {
      markdown: renderSupport(),
      lastModified: LAST_UPDATED,
      canonicalPath: "/support",
    };
  }

  const createMatch = /^\/create\/([a-z0-9-]+)$/.exec(clean);
  if (createMatch) {
    const md = renderTemplate(createMatch[1]);
    if (!md) return null;
    return {
      markdown: md,
      lastModified: LAST_UPDATED,
      canonicalPath: `/create/${createMatch[1]}`,
    };
  }

  // All other routes (including /c/[id] and /i/[token] which are explicitly private)
  return null;
}
