"use client";
export default function GuestInvitationError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="font-display text-4xl">Invitation unavailable</h1>
      <p className="mt-3">We couldn’t open this invitation right now.</p>
      <button type="button" onClick={reset} className="mt-5 underline">
        Try again
      </button>
    </main>
  );
}
