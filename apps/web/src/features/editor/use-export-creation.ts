"use client";
import { useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useSaveInvitation, type SaveInput } from "./use-invitations";
export type RenderJob = {
  id: string;
  invitationId: string;
  invitationIds?: string[];
  status: string;
  fileUrl?: string;
  posterUrl?: string;
  error?: string;
};
export function useExportCreation(
  input: SaveInput,
  photo?: string,
  initialId?: string,
) {
  const [savedId, setSavedId] = useState(initialId);
  const [jobId, setJobId] = useState<string>();
  const photos = useRef(new Map<string, string>());
  const save = useSaveInvitation();
  async function saveCurrent() {
    let photoUrl = photo;
    if (photo?.startsWith("blob:")) {
      photoUrl = photos.current.get(photo);
      if (!photoUrl) {
        const blob = await (await fetch(photo)).blob();
        const form = new FormData();
        form.append(
          "photo",
          new File([blob], "photo.jpg", { type: "image/jpeg" }),
        );
        const response = await fetch("/api/uploads", {
          method: "POST",
          body: form,
        });
        const body = await response.json();
        if (!response.ok)
          throw new Error(body.error?.message ?? "Photo upload failed");
        photoUrl = body.url as string;
        photos.current.set(photo, photoUrl);
      }
    }
    const item = await save.mutateAsync({
      ...input,
      props: { ...input.props, photoUrl },
      id: savedId,
    });
    setSavedId(item.id);
    return item;
  }
  const saveDraft = useMutation({ mutationFn: saveCurrent });
  const exportVideo = useMutation({
    mutationFn: async () => {
      const item = await saveCurrent();
      return api<RenderJob>(`/api/invitations/${item.id}/renders`, {
        method: "POST",
      });
    },
    onSuccess: (job) => setJobId(job.id),
  });
  const job = useQuery({
    queryKey: ["render", jobId],
    queryFn: () => api<RenderJob>(`/api/renders/${jobId}`),
    enabled: Boolean(jobId),
    refetchInterval: (query) =>
      ["ready", "failed"].includes(query.state.data?.status ?? "")
        ? false
        : Math.min(30000, 2000 * 2 ** query.state.fetchFailureCount),
  });
  return {
    saveDraft,
    exportVideo,
    job,
    busy: saveDraft.isPending || exportVideo.isPending,
  };
}
