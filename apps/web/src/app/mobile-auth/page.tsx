"use client";

import { useSignIn } from "@clerk/nextjs/legacy";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function MobileAuthPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const params = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const ticket = params.get("ticket");
    if (!isLoaded || !ticket || !signIn || !setActive) return;
    let cancelled = false;
    void (async () => {
      try {
        const result = await signIn.create({ strategy: "ticket", ticket });
        if (!result.createdSessionId)
          throw new Error("The sign-in ticket was not accepted.");
        await setActive({ session: result.createdSessionId });
        if (!cancelled) router.replace("/?embed=1");
      } catch {
        if (!cancelled)
          setError(
            "This sign-in link expired. Return to the app and try again.",
          );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, params, router, setActive, signIn]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md items-center px-6 text-center">
      <div>
        <h1 className="font-display text-3xl">Signing you in…</h1>
        <p className="mt-3">You can return to the app in a moment.</p>
        {error && (
          <p role="alert" className="mt-4 text-red-800">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
