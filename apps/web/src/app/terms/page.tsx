import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";
import { legalConfig } from "@/server/lib/config";
import { siteConfig } from "@/lib/site-config";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Terms · CherryQube",
  description:
    "Terms and conditions, acceptable use, export credit packs, and merchant of record.",
  alternates: {
    types: {
      "text/markdown": `${siteConfig.getBaseUrl()}/terms.md`,
    },
  },
  other: {
    "ai-summary":
      "CherryQube terms of service covering video creation, message suggestion disclaimers, one-time export credit packs via Polar, and acceptable use policies.",
  },
};
export default function Terms() {
  const { sellerName, supportEmail } = legalConfig();
  return (
    <LegalPage title="Terms">
      <section>
        <h2>Using CherryQube</h2>
        <p>
          CherryQube lets you personalize animated greeting cards and video
          invitations.{" "}
          {sellerName
            ? `The service is operated by ${sellerName}.`
            : "Paid checkout is not currently available."}{" "}
          By using the service, you agree to these terms. Guests can watch
          public creations without an account.
        </p>
      </section>
      <section>
        <h2>Your content and account</h2>
        <p>
          You keep ownership of your photos and text. You give us permission to
          store, render, and deliver them so the service can work. Only upload
          content you have permission to use. Do not create unlawful, abusive,
          deceptive, or infringing content. You are responsible for keeping your
          account secure and for choosing who receives your links.
        </p>
      </section>
      <section>
        <h2>Message suggestions</h2>
        <p>
          The optional message writer can suggest text using an AI provider or
          curated templates. Suggestions may be inaccurate or unsuitable. You
          can edit every suggestion and are responsible for reviewing it before
          saving, exporting, or sharing your creation.
        </p>
      </section>
      <section>
        <h2>Exports and one-time packs</h2>
        <p>
          Free exports are 720p and include a watermark. One export credit pays
          for one 1080p video without a watermark. Packs are one-time purchases,
          not subscriptions. The pack price, number of exports, and final taxes
          are shown before payment. Polar handles checkout as merchant of
          record.
        </p>
        <p>
          Identical content at the same quality reuses its existing video
          without spending another credit. Changing content may require another
          export. If a paid render fails, its credit is returned automatically.
          Retrying a failed export reserves a credit again. Credits stay on your
          account until used or until you delete your account.
        </p>
      </section>
      <section>
        <h2>Payments and refunds</h2>
        <p>
          Payment is confirmed on the server before export credits are added.
          Refund requests can be made through support or Polar. A refund reduces
          the export credits granted by that order; partial refunds reduce them
          in proportion to the refunded amount, rounded up to a whole credit. If
          already-used credits are refunded, the adjustment is applied to your
          balance before further paid exports. This does not limit your
          statutory consumer rights.
        </p>
      </section>
      <section>
        <h2>Sharing and deletion</h2>
        <p>
          A creation’s public page and media can be viewed by people with their
          links. Recipients may copy, download, or forward them. Deleting a
          creation removes it from our service, but cannot remove copies already
          saved or shared elsewhere. You can delete creations from your
          dashboard. Deleting your account also removes remaining export
          credits.
        </p>
      </section>
      <section>
        <h2>Availability and help</h2>
        <p>
          Rendering and payment processing can be delayed or fail. We show their
          status and allow retries within service limits. Nothing in these terms
          excludes rights or liabilities that cannot lawfully be excluded.
        </p>
        <p>
          {supportEmail ? (
            <a href={`mailto:${supportEmail}`}>Contact {supportEmail}</a>
          ) : (
            <Link href="/support">Support information</Link>
          )}{" "}
          · <Link href="/privacy">Privacy notice</Link>
        </p>
      </section>
    </LegalPage>
  );
}
