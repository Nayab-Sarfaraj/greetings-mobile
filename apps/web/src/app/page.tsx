import type { Metadata } from "next";
import { templates } from "@greetings/remotion/templates";
import { TemplatePicker } from "@/features/template-picker";
import { EmbedMarker } from "@/components/embed-marker";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "CherryQube — Animated Holiday Greetings & Video Invitations",
  description: siteConfig.description,
  alternates: {
    types: {
      "text/markdown": `${siteConfig.getBaseUrl()}/index.md`,
    },
  },
  other: {
    "ai-summary": siteConfig.aiSummary,
  },
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ embed?: string }>;
}) {
  const { embed } = await searchParams;
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      {embed === "1" && <EmbedMarker />}
      <p className="font-medium text-accent">CherryQube</p>
      <h1 className="mt-4 max-w-3xl font-display text-5xl leading-tight sm:text-7xl">
        Make this season feel personal.
      </h1>
      <p className="mt-5 max-w-xl text-lg">
        Create a moving holiday greeting or invite everyone to your celebration.
      </p>
      <TemplatePicker templates={templates} />
    </main>
  );
}
