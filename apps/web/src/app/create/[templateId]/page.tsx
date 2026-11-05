import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTemplate } from "@greetings/remotion/templates";
import { getTheme } from "@greetings/remotion/themes";
import Editor from "@/features/editor/editor";
import { requireUser } from "@/server/middleware/auth";
import { invitationService } from "@/server/modules/invitations/invitation.service";
import { invitationDto } from "@/server/modules/invitations/invitation.mapper";
import { siteConfig } from "@/lib/site-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ templateId: string }>;
}): Promise<Metadata> {
  const { templateId } = await params;
  const template = getTemplate(templateId);
  const baseUrl = siteConfig.getBaseUrl();
  if (!template) return { title: "Template · CherryQube" };

  const theme = getTheme(template.themeId);
  const durationSec = template.scenes.reduce((acc, s) => acc + s.seconds, 0);
  const description = `${template.title} is a ${
    template.type === "card" ? "5–8 second animated greeting card" : "video invitation"
  } for ${theme.label} with live browser preview and customizable message.`;

  return {
    title: `${template.title} · CherryQube`,
    description,
    alternates: {
      types: {
        "text/markdown": `${baseUrl}/create/${templateId}.md`,
      },
    },
    other: {
      "ai-summary": `${template.title} is a ${
        template.type === "card" ? "greeting card" : "video invitation"
      } template for ${theme.label} with ${durationSec} seconds duration and editable props.`,
    },
  };
}
export default async function CreatePage({
  params,
  searchParams,
}: {
  params: Promise<{ templateId: string }>;
  searchParams: Promise<{ draft?: string; embed?: string }>;
}) {
  const { templateId } = await params;
  const template = getTemplate(templateId);
  if (!template) notFound();
  const { draft, embed } = await searchParams;
  const initial = draft
    ? invitationDto(await invitationService.get(await requireUser(), draft))
    : undefined;
  if (initial && initial.templateId !== templateId) notFound();
  return (
    <Editor
      key={draft ?? templateId}
      templateId={templateId}
      initial={initial}
      embed={embed === "1"}
    />
  );
}
