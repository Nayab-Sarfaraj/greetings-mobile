import type { VideoProps } from "@greetings/remotion/schema";
export function invitationDto(item: Record<string, unknown>) {
  return {
    id: String(item._id),
    shareId: item.shareId as string | undefined,
    templateId: String(item.templateId),
    props: item.props as VideoProps,
    hostContact: item.hostContact as
      { method: "email" | "whatsapp" | "sms"; value: string } | undefined,
    status: String(item.status),
    updatedAt: new Date(item.updatedAt as string).toISOString(),
  };
}
