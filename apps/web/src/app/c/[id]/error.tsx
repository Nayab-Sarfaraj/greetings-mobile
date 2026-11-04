"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main role="alert" className="mx-auto max-w-xl px-6 py-20">
      <h1 className="font-display text-4xl">We couldn’t open this video</h1>
      <p className="mt-4">Please try again in a moment.</p>
      <button onClick={reset} className="mt-6 rounded-full border px-5 py-3">
        Try again
      </button>
    </main>
  );
}
