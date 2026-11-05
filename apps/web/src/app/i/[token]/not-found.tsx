import Link from "next/link";

export default function GuestInvitationNotFound() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="font-display text-4xl">Invitation not found</h1>
      <p className="mt-3">
        This invitation link is unavailable. Ask the host for a new link.
      </p>
      <Link href="/" className="mt-6 inline-block underline">
        Create your own invitation
      </Link>
    </main>
  );
}
