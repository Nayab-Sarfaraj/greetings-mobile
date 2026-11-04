"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { SavedInvitation } from "../editor/use-invitations";
export function CreatorResultLink({ invitationId }: { invitationId: string }) {
  const query = useQuery({
    queryKey: ["invitation-share", invitationId],
    queryFn: () => api<SavedInvitation>(`/api/invitations/${invitationId}`),
    staleTime: 0,
    retry: 1,
  });
  if (query.isPending) return <p role="status">Opening your result link…</p>;
  if (query.error)
    return (
      <p>
        Your video is ready.{" "}
        <button className="underline" onClick={() => void query.refetch()}>
          Load its share link
        </button>
        .
      </p>
    );
  if (!query.data?.shareId)
    return (
      <p>
        Your share link is being prepared.{" "}
        <button className="underline" onClick={() => void query.refetch()}>
          Check again
        </button>
        .
      </p>
    );
  return (
    <Link
      href={`/c/${query.data.shareId}`}
      className="mt-3 inline-block rounded-full border border-accent px-5 py-3"
    >
      Open shareable result
    </Link>
  );
}
