import Link from "next/link";
export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/" className="underline">
        CherryQube
      </Link>
      <h1 className="mt-8 font-display text-5xl">{title}</h1>
      <p className="mt-3 text-sm">Updated 4 November 2026</p>
      <div className="mt-8 space-y-6 leading-7 [&_h2]:mb-2 [&_h2]:font-display [&_h2]:text-2xl [&_a]:underline">
        {children}
      </div>
    </main>
  );
}
