export type PublicResult = {
  shareId: string;
  status: "processing" | "ready" | "failed";
  type: "card" | "invitation";
  title: string;
  theme: string;
  videoUrl?: string;
  posterUrl?: string;
};
