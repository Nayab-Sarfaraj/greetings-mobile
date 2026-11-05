import { cache } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { guestService } from "@/server/modules/guests/guest.service";
import { NotFoundError } from "@/server/lib/errors";
import { localRenderConfig } from "@/server/lib/config";

export const readGuestInvitation = cache(async (token: string) => {
  const incoming = await headers();
  const ip = incoming.get("x-forwarded-for")?.split(",")[0]?.trim();
  try {
    return await guestService.public(token, ip);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
});

export function guestMetadata(
  token: string,
  invitation: Awaited<ReturnType<typeof readGuestInvitation>>,
): Metadata {
  const title = `You’re invited, ${invitation.guestName}`;
  const description = `A personal invitation to ${invitation.eventTitle}.`;
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: "website",
      url: new URL(`/i/${token}`, localRenderConfig().appUrl).toString(),
      ...(invitation.posterUrl
        ? { images: [{ url: invitation.posterUrl, alt: title }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(invitation.posterUrl ? { images: [invitation.posterUrl] } : {}),
    },
  };
}
