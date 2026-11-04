import Link from "next/link";
export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-6 py-20">
      <h1 className="font-display text-4xl">This creation isn’t available</h1>
      <p className="mt-4">
        The link may be incomplete, or the creator may have removed it.
      </p>
      <Link href="/?campaign=recipient" className="mt-6 inline-block underline">
        Make your own
      </Link>
    </main>
  );
}
