import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";
import { legalConfig } from "@/server/lib/config";
import { siteConfig } from "@/lib/site-config";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Support · CherryQube",
  description:
    "Customer support, payment recovery, export troubleshooting, and account removal guidance.",
  alternates: {
    types: {
      "text/markdown": `${siteConfig.getBaseUrl()}/support.md`,
    },
  },
  other: {
    "ai-summary":
      "CherryQube help and support directory including contact emails (support@cherryqube.com) and solutions for missing credits or failed renders.",
  },
};
export default function Support() {
  const { supportEmail, sellerName } = legalConfig();
  return (
    <LegalPage title="How can we help?">
      <section>
        <h2>Contact {sellerName ?? "CherryQube"}</h2>
        {supportEmail ? (
          <p>
            Email <a href={`mailto:${supportEmail}`}>{supportEmail}</a> for
            account, export, refund, or privacy requests. Include an order
            reference for payment questions. Do not send payment-card details or
            account passwords.
          </p>
        ) : (
          <p>
            A support contact has not been published yet. Paid checkout is
            currently unavailable.
          </p>
        )}
      </section>
      <section>
        <h2>A payment has not appeared</h2>
        <p>
          Return to the editor and choose Check payment again. Payment
          confirmation can arrive after the checkout redirect. If you were
          charged and your exports have not appeared, contact support or use the
          help details on your Polar receipt.
        </p>
      </section>
      <section>
        <h2>A video failed to render</h2>
        <p>
          A failed paid export returns its credit automatically. Check your
          balance, then retry from the editor. Repeatedly failing content may
          reach the retry limit.
        </p>
      </section>
      <section>
        <h2>Remove a creation</h2>
        <p>
          Open <Link href="/dashboard">Your creations</Link> to delete a
          greeting or invitation. For account deletion or other privacy
          requests, contact support.
        </p>
      </section>
      <p>
        <Link href="/terms">Terms</Link> ·{" "}
        <Link href="/privacy">Privacy notice</Link>
      </p>
    </LegalPage>
  );
}
