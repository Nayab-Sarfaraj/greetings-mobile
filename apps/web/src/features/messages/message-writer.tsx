"use client";
import { AppSignInButton, useAppAuth } from "@/components/auth/app-auth";
import { useState } from "react";
import type {
  GenerateMessageInput,
  MessageSpelling,
  MessageTone,
} from "@greetings/shared";
import { useMessageWriter } from "./use-message-writer";

type Context = Omit<GenerateMessageInput, "tone" | "spelling" | "relationship">;

const toneLabels: Record<MessageTone, string> = {
  warm: "Warm",
  funny: "Funny",
  formal: "Formal",
  "short-sweet": "Short & sweet",
};

function SignedInWriter({
  context,
  onSelect,
}: {
  context: Context;
  onSelect: (message: string) => void;
}) {
  const { isLoaded, isSignedIn } = useAppAuth();
  const [open, setOpen] = useState(false);
  const [tone, setTone] = useState<MessageTone>("warm");
  const [spelling, setSpelling] = useState<MessageSpelling>("us");
  const [relationship, setRelationship] = useState("");
  const generation = useMessageWriter();
  if (!isLoaded) return <p role="status">Loading message writer…</p>;
  if (!isSignedIn)
    return (
      <AppSignInButton mode="modal">
        <button type="button" className="mt-2 text-sm underline text-accent">
          Sign in to write it for me
        </button>
      </AppSignInButton>
    );
  if (!open)
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 rounded-full border border-ink/40 px-4 py-2 text-sm"
      >
        Write it for me
      </button>
    );
  function generate() {
    generation.mutate({
      ...context,
      tone,
      spelling,
      relationship: relationship.trim() || undefined,
    });
  }
  return (
    <section
      aria-label="Message suggestions"
      className="mt-3 space-y-3 rounded-xl border border-ink/30 bg-white/60 p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Tone
          <select
            value={tone}
            onChange={(event) => setTone(event.target.value as MessageTone)}
            className="mt-1 block w-full rounded-lg border p-2"
          >
            {Object.entries(toneLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Spelling
          <select
            value={spelling}
            onChange={(event) =>
              setSpelling(event.target.value as MessageSpelling)
            }
            className="mt-1 block w-full rounded-lg border p-2"
          >
            <option value="us">US English</option>
            <option value="uk">UK English</option>
          </select>
        </label>
      </div>
      <label className="block text-sm font-medium">
        Relationship (optional)
        <input
          value={relationship}
          maxLength={40}
          placeholder="Friend, colleague, aunt…"
          onChange={(event) => setRelationship(event.target.value)}
          className="mt-1 block w-full rounded-lg border p-2"
        />
      </label>
      <button
        type="button"
        disabled={generation.isPending}
        onClick={generate}
        className="rounded-full bg-accent px-5 py-2 text-white disabled:opacity-50"
      >
        {generation.isPending
          ? "Writing…"
          : generation.data
            ? "Regenerate"
            : "Show three ideas"}
      </button>
      {generation.error && (
        <p role="alert" className="text-sm text-red-800">
          {generation.error.message}
        </p>
      )}
      {generation.data?.note && (
        <p role="status" className="text-sm">
          {generation.data.note}
        </p>
      )}
      {generation.data?.variants.map((variant, index) => (
        <div key={variant} className="rounded-lg border border-ink/20 p-3">
          <p>{variant}</p>
          <button
            type="button"
            onClick={() => onSelect(variant)}
            className="mt-2 text-sm font-medium underline"
          >
            Use idea {index + 1}
          </button>
        </div>
      ))}
    </section>
  );
}

export function MessageWriter(props: {
  context: Context;
  onSelect: (message: string) => void;
}) {
  return <SignedInWriter {...props} />;
}
