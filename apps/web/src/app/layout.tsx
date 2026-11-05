import type { Metadata } from "next";
import { Fraunces, Figtree } from "next/font/google";
import { palettes } from "@greetings/shared";
import "./globals.css";
import { LegalFooter } from "@/components/legal/footer";
import { Providers } from "@/components/providers";
import { publicAuthKey } from "@/server/lib/config";
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree" });
export const metadata: Metadata = {
  title: "Seasonal Cards",
  description: "Create animated greetings and invitations",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${figtree.variable}`}
      style={
        {
          "--paper": palettes.thanksgiving.paper,
          "--ink": palettes.thanksgiving.ink,
          "--accent": palettes.thanksgiving.oxblood,
        } as React.CSSProperties
      }
    >
      <body>
        <Providers publishableKey={publicAuthKey()}>
          {children}
          <LegalFooter />
        </Providers>
      </body>
    </html>
  );
}
