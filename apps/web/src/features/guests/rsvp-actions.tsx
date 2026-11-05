"use client";
import { rsvpLink, type HostContact } from "./rsvp-links";

export function RsvpActions({
  contact,
  guestName,
  eventTitle,
}: {
  contact: HostContact;
  guestName: string;
  eventTitle: string;
}) {
  function reply(attending: boolean) {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    window.location.assign(
      rsvpLink(contact, guestName, eventTitle, attending, ios),
    );
  }
  return (
    <section className="mt-8 rounded-xl border border-ink/20 p-5">
      <h2 className="font-display text-2xl">Reply to the host</h2>
      <p className="mt-2 text-sm">
        This opens your {contact.method === "email" ? "email" : "messaging"} app
        with a reply to {contact.value} that you can review before sending.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => reply(true)}
          className="rounded-full bg-accent px-5 py-3 text-white"
        >
          I’ll be there
        </button>
        <button
          type="button"
          onClick={() => reply(false)}
          className="rounded-full border border-ink px-5 py-3"
        >
          Can’t make it
        </button>
      </div>
    </section>
  );
}
