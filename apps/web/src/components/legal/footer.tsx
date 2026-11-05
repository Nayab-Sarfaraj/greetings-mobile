import Link from "next/link";
export function LegalFooter() {
  return (
    <footer
      className="mx-auto flex max-w-6xl flex-wrap gap-5 border-t border-ink/20 px-6 py-6 text-sm"
      aria-label="Legal and support"
    >
      <Link href="/terms">Terms</Link>
      <Link href="/privacy">Privacy</Link>
      <Link href="/support">Support</Link>
      <Link href="/llms.txt" className="text-ink/60">
        llms.txt
      </Link>
    </footer>
  );
}
