"use client";
import { useState } from "react";
export function ShareActions({
  id,
  title,
  videoUrl,
}: {
  id: string;
  title: string;
  videoUrl: string;
}) {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File>();
  const [busy, setBusy] = useState(false);
  const link = () => new URL(`/c/${id}`, window.location.origin).toString();
  async function shareLink() {
    setMessage("");
    try {
      if (navigator.share) await navigator.share({ title, url: link() });
      else {
        await navigator.clipboard.writeText(link());
        setMessage("Link copied.");
      }
    } catch (error) {
      if ((error as DOMException).name !== "AbortError")
        setMessage("Sharing is unavailable. Use Copy link instead.");
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(link());
      setMessage("Link copied.");
    } catch {
      setMessage(`Copy this link: ${link()}`);
    }
  }
  async function prepare() {
    setBusy(true);
    try {
      const response = await fetch(videoUrl);
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      // Derive a readable filename from the card/invitation title.
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60);
      const prepared = new File([blob], `${slug || "seasonal-card"}.mp4`, {
        type: "video/mp4",
      });
      if (navigator.canShare?.({ files: [prepared] })) {
        setFile(prepared);
        setMessage("Video ready. Tap Share video to choose an app.");
      } else
        setMessage(
          "This browser supports sharing the link. You can also download the video.",
        );
    } catch {
      setMessage(
        "The video could not be prepared. Try downloading it instead.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function shareFile() {
    if (!file) return;
    try {
      await navigator.share({ title, url: link(), files: [file] });
    } catch (error) {
      if ((error as DOMException).name !== "AbortError")
        setMessage(
          "The video could not be shared. Try sharing its link instead.",
        );
    }
  }
  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap gap-3">
        <a
          href={`/api/public/cards/${id}/download`}
          className="rounded-full bg-accent px-5 py-3 text-white"
        >
          Download video
        </a>
        <button
          onClick={() => void shareLink()}
          className="rounded-full border border-accent px-5 py-3"
        >
          Share
        </button>
        <button
          onClick={() => void copy()}
          className="rounded-full border border-accent px-5 py-3"
        >
          Copy link
        </button>
        <button
          disabled={busy}
          onClick={() => void (file ? shareFile() : prepare())}
          className="rounded-full border border-accent px-5 py-3 disabled:opacity-50"
        >
          {busy
            ? "Preparing video…"
            : file
              ? "Share video"
              : "Prepare video to share"}
        </button>
      </div>
      <p role="status" className="break-words text-sm">
        {message}
      </p>
    </div>
  );
}
