"use client";
import { formatMoney } from "./format-money";
import { useState } from "react";
import Link from "next/link";
import { useBilling } from "./use-billing";
export function BillingPanel({
  prepareDraft,
  disabled,
}: {
  prepareDraft: () => Promise<{ id: string }>;
  disabled: boolean;
}) {
  const [accepted, setAccepted] = useState(false);
  const { catalog, balance, checkout, confirmation, returnInfo, recheck } =
    useBilling(prepareDraft);
  const confirmed = confirmation.data?.confirmed;
  return (
    <section
      aria-label="Export packs"
      className="mt-6 rounded-xl border border-ink/25 p-5"
    >
      <h2 className="font-display text-2xl">HD exports</h2>
      <p className="mt-2">
        One export credit makes one 1080p video without a watermark. Identical
        exports reuse the video at no extra cost. Failed exports return their
        credit.
      </p>
      {balance.data && (
        <p className="mt-3 font-medium">
          {balance.data.balance} export{" "}
          {balance.data.balance === 1 ? "credit" : "credits"} available
        </p>
      )}
      {balance.error && (
        <p role="alert">
          Couldn’t load your balance.{" "}
          <button onClick={() => void balance.refetch()} className="underline">
            Try again
          </button>
        </p>
      )}
      {returnInfo?.state === "cancelled" && (
        <p role="status">Checkout was cancelled. Your draft is still saved.</p>
      )}
      {returnInfo?.state === "success" && (
        <div role="status" className="mt-3">
          {confirmed ? (
            confirmation.data?.refunded ? (
              "This payment was refunded. Your balance is up to date."
            ) : (
              "Payment confirmed. Your balance is up to date."
            )
          ) : (
            <>
              <p>
                {confirmation.isFetching
                  ? "Checking your payment…"
                  : "Payment may still be processing. No credits are added until it is confirmed."}
              </p>
              <button onClick={recheck} className="underline">
                Check payment again
              </button>
            </>
          )}
        </div>
      )}
      {catalog.isPending && <p role="status">Loading export packs…</p>}
      {catalog.error && (
        <p role="alert">
          Couldn’t load packs.{" "}
          <button onClick={() => void catalog.refetch()} className="underline">
            Try again
          </button>
        </p>
      )}
      {catalog.data && !catalog.data.enabled && (
        <p className="mt-3">
          Packs aren’t available yet. You can still export a free video with a
          watermark.
        </p>
      )}
      {catalog.data?.enabled && (
        <>
          <ul className="mt-4 space-y-4">
            {catalog.data.packs.map((pack) => (
              <li key={pack.id} className="border-t border-ink/20 pt-4">
                <h3 className="font-medium">{pack.name}</h3>
                <p>
                  {pack.credits} HD {pack.credits === 1 ? "export" : "exports"}{" "}
                  · {formatMoney(pack.amount, pack.currency)}
                </p>
                <p className="text-sm">
                  One-time purchase. Final taxes and total shown at checkout.
                </p>
                <button
                  disabled={disabled || !accepted || checkout.isPending}
                  onClick={() => checkout.mutate(pack.id)}
                  className="mt-2 rounded-full bg-accent px-5 py-3 text-white disabled:opacity-50"
                >
                  {checkout.isPending ? "Opening checkout…" : "Buy pack"}
                </button>
              </li>
            ))}
          </ul>
          <label className="mt-4 flex items-start gap-2">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
              className="mt-1"
            />
            <span>
              I agree to the{" "}
              <Link href="/terms" target="_blank" className="underline">
                Terms
              </Link>{" "}
              and have read the{" "}
              <Link href="/privacy" target="_blank" className="underline">
                Privacy notice
              </Link>
              .
            </span>
          </label>
        </>
      )}
      {checkout.error && <p role="alert">{checkout.error.message}</p>}
      <Link href="/support" className="mt-3 inline-block underline">
        Payment help
      </Link>
    </section>
  );
}
