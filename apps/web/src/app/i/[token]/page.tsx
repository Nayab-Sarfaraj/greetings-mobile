import Link from "next/link";
import {
  guestMetadata,
  readGuestInvitation,
} from "@/features/guests/guest-page-data";
import { GuestPlayer } from "@/features/guests/guest-player";
import { RsvpActions } from "@/features/guests/rsvp-actions";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props) {
  const { token } = await params;
  return guestMetadata(token, await readGuestInvitation(token));
}

export default async function GuestInvitationPage({ params }: Props) {
  const invitation = await readGuestInvitation((await params).token);
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <p className="text-sm uppercase tracking-[0.2em]">A personal invitation</p>
      <h1 className="mt-2 font-display text-4xl leading-tight">
        You’re invited, {invitation.guestName}
      </h1>
      <p className="mt-2 text-lg">{invitation.eventTitle}</p>
      <div className="mt-8">
        <GuestPlayer
          templateId={invitation.templateId}
          props={invitation.props}
          videoUrl={invitation.videoUrl}
          posterUrl={invitation.posterUrl}
        />
      </div>
      <RsvpActions
        contact={invitation.hostContact}
        guestName={invitation.guestName}
        eventTitle={invitation.eventTitle}
      />
      <div className="mt-10 border-t border-ink/20 pt-6">
        <p>Create a personal invitation of your own.</p>
        <Link
          href="/?campaign=guest"
          className="mt-3 inline-block rounded-full bg-accent px-6 py-3 text-white"
        >
          Make your own
        </Link>
      </div>
    </main>
  );
}
