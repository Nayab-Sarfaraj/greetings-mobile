import { palettes, type ThemeId } from "@greetings/shared";

export type HolidayTheme = {
  id: ThemeId;
  label: string;
  background: string;
  ink: string;
  accent: string;
  secondary: string;
  foliage: string;
  photoBorder: string;
  flora: "harvest" | "evergreen" | "midnight";
};

export const holidayThemes: Record<ThemeId, HolidayTheme> = {
  thanksgiving: {
    id: "thanksgiving",
    label: "Thanksgiving",
    background: palettes.thanksgiving.paper,
    ink: palettes.thanksgiving.ink,
    accent: palettes.thanksgiving.oxblood,
    secondary: palettes.thanksgiving.marigold,
    foliage: palettes.thanksgiving.olive,
    photoBorder: palettes.thanksgiving.oxblood,
    flora: "harvest",
  },
  christmas: {
    id: "christmas",
    label: "Christmas",
    background: palettes.christmas.paper,
    ink: palettes.christmas.ink,
    accent: palettes.christmas.cranberry,
    secondary: palettes.christmas.gold,
    foliage: palettes.christmas.pine,
    photoBorder: palettes.christmas.cranberry,
    flora: "evergreen",
  },
  "new-year": {
    id: "new-year",
    label: "New Year’s Eve",
    background: palettes.newYear.teal,
    ink: palettes.newYear.paper,
    accent: palettes.newYear.champagne,
    secondary: palettes.newYear.roseGold,
    foliage: "#31585B",
    photoBorder: palettes.newYear.champagne,
    flora: "midnight",
  },
};

export function getTheme(id: ThemeId) {
  return holidayThemes[id];
}
