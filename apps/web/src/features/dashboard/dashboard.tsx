"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { RenderJob } from "../editor/use-export-creation";
import Link from "next/link";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { useAuthEnabled } from "@/components/providers";
import { useDeleteInvitation, useInvitations } from "../editor/use-invitations";
function AuthenticatedDashboard() {
  const { isLoaded, isSignedIn } = useUser();
  const query = useInvitations(Boolean(isSignedIn));
  const remove = useDeleteInvitation();
  const renders = useQuery({
    queryKey: ["renders"],
    queryFn: () => api<RenderJob[]>("/api/renders"),
    enabled: Boolean(isSignedIn),
    refetchInterval: (query) =>
      query.state.data?.some((job) =>
        ["queued", "rendering"].includes(job.status),
      )
        ? 2000
        : false,
  });
  if (!isLoaded) return <p role="status">Loading your account…</p>;
  if (!isSignedIn)
    return (
      <SignInButton mode="modal">
        <button className="rounded-full border px-5 py-3">
          Sign in to see your creations
        </button>
      </SignInButton>
    );
  return (
    <>
      <UserButton />
      {query.isPending && <p role="status">Loading your creations…</p>}
      {query.error && <p role="alert">{query.error.message}</p>}
      {query.data?.length === 0 && (
        <p>
          You haven’t saved a creation yet.{" "}
          <Link href="/" className="underline">
            Choose a template
          </Link>
          .
        </p>
      )}
      <ul className="mt-6 space-y-4">
        {query.data?.map((item) => (
          <li key={item.id} className="rounded-xl border p-5">
            <h2 className="font-display text-2xl">
              {item.props.type === "card"
                ? `Card from ${item.props.senderName}`
                : item.props.eventTitle}
            </h2>
            <p>
              {item.status} · {new Date(item.updatedAt).toLocaleDateString()}
            </p>
            {renders.data
              ?.filter((job) =>
                (job.invitationIds ?? [job.invitationId]).includes(item.id),
              )
              .map((job) => (
                <p key={job.id}>
                  {job.status === "ready" && job.fileUrl ? (
                    <a href={job.fileUrl} className="underline">
                      Watch exported video
                    </a>
                  ) : job.status === "failed" ? (
                    job.error
                  ) : (
                    `Video ${job.status}`
                  )}
                </p>
              ))}
            <Link
              href={`/create/${item.templateId}?draft=${item.id}`}
              className="mr-4 underline"
            >
              Continue editing
            </Link>
            <button
              disabled={remove.isPending}
              onClick={() => {
                if (confirm("Delete this creation? This cannot be undone."))
                  remove.mutate(item.id);
              }}
              className="underline"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
      {remove.error && <p role="alert">{remove.error.message}</p>}
    </>
  );
}
export default function Dashboard() {
  const enabled = useAuthEnabled();
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/" className="underline">
        All templates
      </Link>
      <h1 className="my-6 font-display text-4xl">Your creations</h1>
      {enabled ? (
        <AuthenticatedDashboard />
      ) : (
        <p>Accounts are not available yet. Please try again later.</p>
      )}
    </main>
  );
}
