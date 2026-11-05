export const palettes = {
  thanksgiving: {
    oxblood: "#5E1F26",
    marigold: "#E3A72F",
    olive: "#6E7B3A",
    pumpkin: "#C9642B",
    paper: "#EFE3CC",
    ink: "#2A1D17",
  },
  christmas: {
    cranberry: "#8E1B2E",
    pine: "#1F4B3A",
    spruce: "#12302A",
    gold: "#C9A24A",
    paper: "#F3EBDD",
    ink: "#182B22",
  },
  newYear: {
    teal: "#0E2A2D",
    champagne: "#E7D3A1",
    roseGold: "#C98B78",
    paper: "#F6F0E4",
    ink: "#10272A",
  },
} as const;

export const THEME_IDS = ["thanksgiving", "christmas", "new-year"] as const;
export type ThemeId = (typeof THEME_IDS)[number];

export const themeNames: Record<ThemeId, string> = {
  thanksgiving: "Thanksgiving",
  christmas: "Christmas",
  "new-year": "New Year’s Eve",
};
export const typography = {
  display: "Fraunces",
  body: "Figtree",
  script: "Pinyon Script",
} as const;
