"use client";
import Link from "next/link";
import type { PublicResult } from "@greetings/shared";
import { useResult } from "./use-result";
import { ShareActions } from "./share-actions";
export function ResultView({ initial }: { initial: PublicResult }) {
  const query = useResult(initial);
  const result = query.data;
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="font-display text-4xl leading-tight">{result.title}</h1>
      <div className="mt-8">
        {result.status === "ready" && result.videoUrl ? (
          <>
            <video
              key={result.videoUrl}
              src={result.videoUrl}
              poster={result.posterUrl}
              autoPlay
              muted
              playsInline
              controls
              preload="metadata"
              aria-label={result.title}
              className="mx-auto max-h-[75vh] w-full rounded-xl bg-ink"
            />
            <p className="mt-2 text-sm">Use the sound control to unmute.</p>
            <ShareActions
              id={result.shareId}
              title={result.title}
              videoUrl={result.videoUrl}
            />
          </>
        ) : result.status === "processing" ? (
          <div role="status" className="rounded-xl border border-ink/20 p-8">
            <h2 className="font-display text-2xl">
              Your video is being prepared
            </h2>
            <p className="mt-3">This page will update when it’s ready.</p>
          </div>
        ) : (
          <div role="alert" className="rounded-xl border border-ink/20 p-8">
            <h2 className="font-display text-2xl">
              This video couldn’t be prepared
            </h2>
            <p className="mt-3">Ask the creator to export it again.</p>
          </div>
        )}
        {query.error && (
          <p role="alert" className="mt-4">
            We couldn’t check for updates.{" "}
            <button onClick={() => void query.refetch()} className="underline">
              Try again
            </button>
            .
          </p>
        )}
      </div>
      <div className="mt-10 border-t border-ink/20 pt-6">
        <p>Send a little warmth of your own.</p>
        <Link
          href="/?campaign=recipient"
          className="mt-3 inline-block rounded-full bg-accent px-6 py-3 text-white"
        >
          Make your own
        </Link>
      </div>
    </main>
  );
}
