import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { PublicResult } from "@greetings/shared";
import { resultService } from "@/server/modules/results/result.service";
import { NotFoundError } from "@/server/lib/errors";
import { localRenderConfig } from "@/server/lib/config";
export const readPublicResult = cache(async (id: string) => {
  try {
    return await resultService.get(id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
});
export function resultMetadata(result: PublicResult): Metadata {
  const description =
    result.type === "card"
      ? "A personal animated greeting, made for you."
      : "You’re invited. Watch your video invitation.";
  const url = new URL(
    `/c/${result.shareId}`,
    localRenderConfig().appUrl,
  ).toString();
  return {
    title: result.title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title: result.title,
      description,
      url,
      type: "website",
      ...(result.posterUrl
        ? {
            images: [
              {
                url: result.posterUrl,
                width: 720,
                height: 1280,
                alt: result.title,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: result.title,
      description,
      ...(result.posterUrl ? { images: [result.posterUrl] } : {}),
    },
  };
}
