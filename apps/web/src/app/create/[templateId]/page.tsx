import { notFound } from "next/navigation";
import { getTemplate } from "@greetings/remotion/templates";
import Editor from "@/features/editor/editor";
import { requireUser } from "@/server/middleware/auth";
import { invitationService } from "@/server/modules/invitations/invitation.service";
import { invitationDto } from "@/server/modules/invitations/invitation.mapper";
export default async function CreatePage({
  params,
  searchParams,
}: {
  params: Promise<{ templateId: string }>;
  searchParams: Promise<{ draft?: string }>;
}) {
  const { templateId } = await params;
  const template = getTemplate(templateId);
  if (!template) notFound();
  const { draft } = await searchParams;
  const initial = draft
    ? invitationDto(await invitationService.get(await requireUser(), draft))
    : undefined;
  if (initial && initial.templateId !== templateId) notFound();
  return (
    <Editor
      key={draft ?? templateId}
      templateId={templateId}
      initial={initial}
    />
  );
}
