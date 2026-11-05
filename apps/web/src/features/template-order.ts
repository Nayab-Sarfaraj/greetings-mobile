import type { ThemeId } from "@greetings/shared";
import type { Template } from "@greetings/remotion/templates";

const dates: Record<ThemeId, readonly [number, number]> = {
  thanksgiving: [10, 26],
  christmas: [11, 25],
  "new-year": [11, 31],
};

function nextHoliday(theme: ThemeId, now: Date) {
  const [month, day] = dates[theme];
  const candidate = new Date(now.getFullYear(), month, day);
  if (candidate < new Date(now.getFullYear(), now.getMonth(), now.getDate()))
    candidate.setFullYear(candidate.getFullYear() + 1);
  return candidate.getTime();
}

export function orderTemplates(templates: Template[], now = new Date()) {
  return [...templates].sort((left, right) => {
    const distance =
      nextHoliday(left.themeId, now) - nextHoliday(right.themeId, now);
    return distance || left.title.localeCompare(right.title);
  });
}
