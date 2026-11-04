import type { RenderRecord } from "./render.model";
export function renderDto(
  item: Pick<
    RenderRecord,
    | "status"
    | "invitationIds"
    | "invitationId"
    | "fileUrl"
    | "posterUrl"
    | "error"
  > & { _id: unknown },
) {
  return {
    id: String(item._id),
    invitationId: item.invitationId,
    invitationIds: item.invitationIds,
    status: item.status,
    fileUrl: item.fileUrl,
    posterUrl: item.posterUrl,
    error: item.error,
  };
}
