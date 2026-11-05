import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";
import { legalConfig } from "@/server/lib/config";
export const dynamic = "force-dynamic";
export const metadata = { title: "Privacy · Seasonal Cards" };
export default function Privacy() {
  const { sellerName, supportEmail } = legalConfig();
  return (
    <LegalPage title="Privacy notice">
      <section>
        <h2>Who handles your information</h2>
        <p>
          {sellerName ?? "Seasonal Cards"} handles the information needed to
          create, render, and share your greetings and invitations.{" "}
          {supportEmail ? (
            <>
              Contact <a href={`mailto:${supportEmail}`}>{supportEmail}</a>{" "}
              about your information.
            </>
          ) : (
            <>
              Contact details will be provided before paid checkout becomes
              available.
            </>
          )}
        </p>
      </section>
      <section>
        <h2>Information we use</h2>
        <p>
          For creators, we use an account identifier, saved text and event
          details, host reply contact, uploaded photos, render status, and
          export-credit transactions. Clerk handles sign-in and account details.
          Polar handles checkout and payment details; we do not store card
          numbers. Payment records in this app contain provider order references
          and credit adjustments.
        </p>
        <p>
          If you use the message writer, the names, relationship, event details,
          chosen tone, and language preference you provide are sent to our AI
          provider, Anthropic, to create suggestions. We store token counts,
          response time, and whether a fallback was used, but not the message
          writer prompt or its generated suggestions in our usage log.
        </p>
        <p>
          Guest links may contain names and invitation details supplied by the
          creator. A creator may also keep an optional guest email address or
          phone number for their own sharing controls; it is not exposed on the
          guest page. Guests do not need an account. We use limited, hashed
          request identifiers to enforce service limits and operational records
          to diagnose failures. We do not use guest information for advertising.
        </p>
      </section>
      <section>
        <h2>Public links and media</h2>
        <p>
          Anyone with a result-page link or a media URL can view and forward it
          without signing in. Media URLs contain opaque identifiers; they are
          public URLs rather than access-controlled private storage.
          Link-preview services may fetch the title and poster. Result pages ask
          search engines not to index them, but this is not an access
          restriction. A host’s reply contact is disclosed on guest invitation
          pages when those links are used.
        </p>
      </section>
      <section>
        <h2>Why we use information</h2>
        <p>
          We use creator content to provide the requested editor, rendering,
          sharing, and account features; payment data to fulfill purchases and
          maintain accurate records; and limited operational information to
          protect the service. Providers handle information on our behalf where
          needed for authentication, payment, AI message generation, hosting,
          storage, and rendering. We do not sell personal information.
        </p>
      </section>
      <section>
        <h2>Retention and deletion</h2>
        <p>
          Scheduled removal begins 90 days after a card is created, or 90 days
          after an invitation’s event date. You can delete creations sooner
          through the dashboard. Unreferenced uploads are removed after seven
          days. Deleting your account removes its creations, guest records, and
          stored files. Financial ledger entries may be retained for payment,
          tax, and dispute obligations, with your app account identifier
          detached.
        </p>
        <p>
          Recipients’ downloaded copies and third-party link caches are outside
          our control. Authentication and payment providers may retain records
          under their own policies and legal obligations.
        </p>
      </section>
      <section>
        <h2>Your choices</h2>
        <p>
          You can edit and preview without signing in. Sign-in is needed for
          saving, export, and purchase. You can request access, correction,
          deletion, or other rights available under your local privacy law by
          contacting support. Essential browser storage keeps editor drafts and
          sign-in state. Photos selected for preview remain in memory until you
          save or export them.
        </p>
        <p>
          <Link href="/support">Contact support</Link> ·{" "}
          <a href="https://clerk.com/legal/privacy">Clerk privacy</a> ·{" "}
          <a href="https://polar.sh/legal/privacy">Polar privacy</a> ·{" "}
          <a href="https://www.anthropic.com/legal/privacy">
            Anthropic privacy
          </a>
        </p>
      </section>
    </LegalPage>
  );
}
