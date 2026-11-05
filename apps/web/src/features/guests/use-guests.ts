"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Guest, GuestImportResult, GuestInput } from "@greetings/shared";
import { api } from "@/lib/api-client";

export function useGuests(invitationId: string) {
  return useQuery({
    queryKey: ["guests", invitationId],
    queryFn: () => api<Guest[]>(`/api/invitations/${invitationId}/guests`),
  });
}

export function useGuestActions(invitationId: string) {
  const client = useQueryClient();
  const refresh = () =>
    client.invalidateQueries({ queryKey: ["guests", invitationId] });
  return {
    add: useMutation({
      mutationFn: (input: GuestInput) =>
        api<GuestImportResult>(`/api/invitations/${invitationId}/guests`, {
          method: "POST",
          body: JSON.stringify(input),
        }),
      onSuccess: refresh,
    }),
    importGuests: useMutation({
      mutationFn: (guests: GuestInput[]) =>
        api<GuestImportResult>(
          `/api/invitations/${invitationId}/guests/import`,
          { method: "POST", body: JSON.stringify({ guests }) },
        ),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: (guestId: string) =>
        api<void>(`/api/invitations/${invitationId}/guests/${guestId}`, {
          method: "DELETE",
        }),
      onSuccess: refresh,
    }),
    removeAll: useMutation({
      mutationFn: () =>
        api<{ deleted: number }>(`/api/invitations/${invitationId}/guests`, {
          method: "DELETE",
        }),
      onSuccess: refresh,
    }),
  };
}
