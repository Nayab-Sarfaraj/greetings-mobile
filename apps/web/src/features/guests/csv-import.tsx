"use client";
import { useState } from "react";
import type { GuestInput } from "@greetings/shared";
import { parseGuestCsv, type CsvError } from "./guest-csv";

export function CsvImport({
  pending,
  onImport,
}: {
  pending: boolean;
  onImport: (guests: GuestInput[]) => void;
}) {
  const [text, setText] = useState("");
  const [review, setReview] = useState<{
    guests: GuestInput[];
    errors: CsvError[];
  } | null>(null);
  function inspect() {
    setReview(parseGuestCsv(text));
  }
  function submit() {
    if (!review?.guests.length) return;
    if (
      review.errors.length &&
      !confirm(
        `Skip ${review.errors.length} invalid row(s) and import the rest?`,
      )
    )
      return;
    onImport(review.guests);
  }
  return (
    <div className="space-y-2 rounded-lg border border-ink/20 p-3">
      <label className="block text-sm font-medium">
        Paste CSV with name and optional contact columns
        <textarea
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setReview(null);
          }}
          rows={5}
          placeholder={"name,contact\nSam,sam@example.com"}
          className="mt-1 w-full rounded-lg border p-2 font-mono text-sm"
        />
      </label>
      <input
        type="file"
        accept=".csv,text/csv"
        aria-label="Choose guest CSV"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void file.text().then((value) => setText(value));
          setReview(null);
        }}
      />
      <button type="button" onClick={inspect} className="underline">
        Review CSV
      </button>
      {review && (
        <div aria-live="polite">
          <p>{review.guests.length} valid guest(s) ready.</p>
          {review.errors.length > 0 && (
            <ul className="text-sm text-red-800">
              {review.errors.map((error) => (
                <li key={`${error.row}:${error.message}`}>
                  Row {error.row}: {error.message}
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            disabled={!review.guests.length || pending}
            onClick={submit}
            className="mt-2 rounded-full border px-4 py-2 disabled:opacity-50"
          >
            {pending
              ? "Importing…"
              : `Import ${review.guests.length} valid rows`}
          </button>
        </div>
      )}
    </div>
  );
}
