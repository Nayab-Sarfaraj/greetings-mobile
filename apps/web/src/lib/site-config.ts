import { localRenderConfig, legalConfig } from "../server/lib/config";
import { templates } from "@greetings/remotion/templates";

export const siteConfig = {
  name: "CherryQube",
  tagline: "Animated Holiday Greetings & Video Invitations",
  description:
    "Personalized animated holiday cards and video invitations for Thanksgiving, Christmas, and New Year’s Eve. Created with Remotion and editable live in the browser.",
  aiSummary:
    "CherryQube is a holiday greeting card and video invitation platform offering parameterised animated video templates for Thanksgiving, Christmas, and New Year's Eve with live preview, AI message assistance, and MP4 export.",
  contacts: {
    general: "contact@cherryqube.com",
    support: "support@cherryqube.com",
  },
  pricing: {
    model: "One-time export packs",
    freeTier: "720p resolution with 'Made with CherryQube' watermark",
    paidTier:
      "1080p full HD resolution without watermark ($3–$5 per export or $9–$15 bundle packs)",
  },
  holidays: [
    {
      id: "thanksgiving",
      name: "Thanksgiving",
      date: "2026-11-26",
      theme: "Harvest",
      palette: ["Oxblood", "Marigold", "Olive", "Pumpkin", "Oat paper"],
      flora: "Dahlia, chrysanthemum, sunflower, wheat, oak and maple leaves",
    },
    {
      id: "christmas",
      name: "Christmas",
      date: "2026-12-25",
      theme: "Evergreen & Cranberry",
      palette: ["Cranberry", "Pine", "Deep spruce", "Antique gold", "Ivory"],
      flora: "Holly, hellebore, poinsettia, pine and eucalyptus sprigs, berry wreaths",
    },
    {
      id: "new-year",
      name: "New Year's Eve",
      date: "2026-12-31",
      theme: "Midnight & Champagne",
      palette: ["Ink teal", "Champagne", "Rose gold", "Ivory"],
      flora: "White anemone, ranunculus, dried pampas, winter blooms",
    },
  ],
  templates,
  getBaseUrl(): string {
    return localRenderConfig().appUrl;
  },
  getSellerName(): string {
    return legalConfig().sellerName ?? "CherryQube";
  },
  getSupportEmail(): string {
    return legalConfig().supportEmail ?? "support@cherryqube.com";
  },
};
