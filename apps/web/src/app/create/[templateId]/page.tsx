import { notFound } from "next/navigation";
import { getTemplate } from "@greetings/remotion";
import Editor from "@/features/editor/editor";
export default async function CreatePage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  const template = getTemplate(templateId);
  if (!template) notFound();
  return <Editor templateId={templateId} />;
}
