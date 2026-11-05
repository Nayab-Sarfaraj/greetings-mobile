"use client";
import { useEffect, useState } from "react";
import type { ExportQuality } from "@greetings/shared";
import { BillingPanel } from "../billing/billing-panel";
import { ExportQualityOptions } from "../billing/export-quality";
import { CreatorResultLink } from "../results/creator-result-link";
import { SignInButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useAuthEnabled } from "@/components/providers";
import type { SaveInput } from "./use-invitations";
import { useExportCreation } from "./use-export-creation";
type Props = {
  input: SaveInput;
  photo?: string;
  initialId?: string;
  invalid: boolean;
  embed?: boolean;
};
function Controls({ input, photo, initialId, invalid, embed }: Props) {
  const { isLoaded, isSignedIn } = useUser();
  const [quality, setQuality] = useState<ExportQuality>("free");
  useEffect(() => {
    const timer = setTimeout(() => {
      if (
        new URLSearchParams(window.location.search).get("checkout") ===
        "success"
      )
        setQuality("hd");
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  const { saveDraft, exportVideo, job, busy, savedId, prepareDraft } =
    useExportCreation(input, photo, initialId, quality);
  if (!isLoaded) return <p role="status">Loading account…</p>;
  if (!isSignedIn)
    return (
      <SignInButton mode="modal">
        <button
          type="button"
          className="rounded-full bg-accent px-6 py-3 text-white"
        >
          Sign in to save or export
        </button>
      </SignInButton>
    );
  return (
    <section aria-label="Save and export" className="mt-6 space-y-3">
      <ExportQualityOptions
        quality={quality}
        onChange={setQuality}
        disabled={busy}
      />
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={invalid || busy}
          onClick={() => saveDraft.mutate()}
          className="rounded-full border px-6 py-3 disabled:opacity-50"
        >
          {saveDraft.isPending ? "Saving…" : "Save draft"}
        </button>
        <button
          type="button"
          disabled={invalid || busy}
          onClick={() => exportVideo.mutate()}
          className="rounded-full bg-accent px-6 py-3 text-white disabled:opacity-50"
        >
          {exportVideo.isPending
            ? "Preparing video…"
            : quality === "hd"
              ? "Export HD video"
              : "Export free video"}
        </button>
        <Link href="/dashboard" className="px-4 py-3 underline">
          Your creations
        </Link>
      </div>
      {saveDraft.isSuccess && <p role="status">Draft saved.</p>}
      {(saveDraft.error || exportVideo.error || job.error) && (
        <p role="alert">
          {(saveDraft.error || exportVideo.error || job.error)?.message}
        </p>
      )}
      {job.data && (
        <div aria-live="polite">
          {job.data.status === "queued" && <p>Your video is queued.</p>}
          {job.data.status === "rendering" && <p>Rendering your video…</p>}
          {job.data.status === "failed" && (
            <p role="alert">{job.data.error} Use Export video to retry.</p>
          )}
          {job.data.status === "ready" && job.data.fileUrl && (
            <>
              <video
                src={job.data.fileUrl}
                poster={job.data.posterUrl}
                controls
                className="max-h-96 w-full"
              />
              <a
                href={`${job.data.fileUrl}?download=1`}
                download
                className="underline"
              >
                Download video
              </a>
              {savedId && (
                <CreatorResultLink key={job.data.id} invitationId={savedId} />
              )}
            </>
          )}
        </div>
      )}
      {!embed && (
        <BillingPanel prepareDraft={prepareDraft} disabled={invalid || busy} />
      )}
    </section>
  );
}
export function SaveControls(props: Props) {
  return useAuthEnabled() ? (
    <Controls {...props} />
  ) : (
    <p className="mt-6">
      Saving is not available yet. You can keep editing and previewing.
    </p>
  );
}
