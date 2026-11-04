"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { VideoProps } from "@greetings/remotion/schema";
export type SavedInvitation = {
  id: string;
  templateId: string;
  props: VideoProps;
  hostContact?: { method: "email" | "whatsapp" | "sms"; value: string };
  status: string;
  updatedAt: string;
};
export type SaveInput = Pick<
  SavedInvitation,
  "templateId" | "props" | "hostContact"
>;
export function useInvitations(enabled = true) {
  return useQuery({
    queryKey: ["invitations"],
    queryFn: () => api<SavedInvitation[]>("/api/invitations"),
    enabled,
  });
}
export function useSaveInvitation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: SaveInput & { id?: string }) =>
      api<SavedInvitation>(id ? `/api/invitations/${id}` : "/api/invitations", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["invitations"] }),
  });
}
export function useDeleteInvitation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<void>(`/api/invitations/${id}`, { method: "DELETE" }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["invitations"] }),
  });
}
