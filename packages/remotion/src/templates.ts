import { FPS, MAX_VIDEO_SECONDS, type ThemeId } from "@greetings/shared";
import type { VideoProps } from "./schema";
export type SceneId = "intro" | "details" | "guest-name" | "closing";
export type Template = {
  id: string;
  title: string;
  type: VideoProps["type"];
  themeId: ThemeId;
  scenes: readonly { id: SceneId; seconds: number }[];
  defaultProps: VideoProps;
};
export const templates: Template[] = [
  {
    id: "harvest-card",
    title: "Harvest greeting",
    type: "card",
    themeId: "thanksgiving",
    scenes: [
      { id: "intro", seconds: 3 },
      { id: "closing", seconds: 4 },
    ],
    defaultProps: {
      type: "card",
      themeId: "thanksgiving",
      senderName: "Alex",
      recipientName: "Sam",
      message: "Wishing you a warm Thanksgiving.",
    },
  },
  {
    id: "harvest-invitation",
    title: "Harvest gathering",
    type: "invitation",
    themeId: "thanksgiving",
    scenes: [
      { id: "intro", seconds: 6 },
      { id: "details", seconds: 9 },
      { id: "closing", seconds: 5 },
      { id: "guest-name", seconds: 5 },
    ],
    defaultProps: {
      type: "invitation",
      themeId: "thanksgiving",
      eventTitle: "Thanksgiving dinner",
      hostName: "Alex",
      dateTime: "2026-11-26T18:00:00-05:00",
      locationText: "At our home",
      message: "Join us around the table.",
    },
  },
  {
    id: "evergreen-card",
    title: "Evergreen wishes",
    type: "card",
    themeId: "christmas",
    scenes: [
      { id: "intro", seconds: 3 },
      { id: "closing", seconds: 4 },
    ],
    defaultProps: {
      type: "card",
      themeId: "christmas",
      senderName: "Alex",
      recipientName: "Sam",
      message: "Wishing you a bright and peaceful Christmas.",
    },
  },
  {
    id: "evergreen-invitation",
    title: "Evergreen gathering",
    type: "invitation",
    themeId: "christmas",
    scenes: [
      { id: "intro", seconds: 6 },
      { id: "details", seconds: 9 },
      { id: "closing", seconds: 5 },
      { id: "guest-name", seconds: 5 },
    ],
    defaultProps: {
      type: "invitation",
      themeId: "christmas",
      eventTitle: "Christmas supper",
      hostName: "Alex",
      dateTime: "2026-12-25T18:00:00-05:00",
      locationText: "At our home",
      message: "Come share the warmth of the season.",
    },
  },
  {
    id: "midnight-card",
    title: "Midnight toast",
    type: "card",
    themeId: "new-year",
    scenes: [
      { id: "intro", seconds: 3 },
      { id: "closing", seconds: 5 },
    ],
    defaultProps: {
      type: "card",
      themeId: "new-year",
      senderName: "Alex",
      recipientName: "Sam",
      message: "Here’s to a sparkling new year ahead.",
    },
  },
  {
    id: "midnight-invitation",
    title: "Midnight gathering",
    type: "invitation",
    themeId: "new-year",
    scenes: [
      { id: "intro", seconds: 6 },
      { id: "details", seconds: 9 },
      { id: "closing", seconds: 5 },
      { id: "guest-name", seconds: 5 },
    ],
    defaultProps: {
      type: "invitation",
      themeId: "new-year",
      eventTitle: "New Year’s Eve toast",
      hostName: "Alex",
      dateTime: "2026-12-31T20:00:00-05:00",
      locationText: "At our home",
      message: "Raise a glass and welcome the new year with us.",
    },
  },
];
export function getTemplate(id: string) {
  return templates.find((template) => template.id === id);
}
export function getTemplateForProps(
  type: VideoProps["type"],
  themeId: ThemeId,
) {
  return templates.find(
    (template) => template.type === type && template.themeId === themeId,
  );
}
export function durationInFrames(template: Template) {
  const frames = template.scenes.reduce(
    (total, scene) => total + Math.round(scene.seconds * FPS),
    0,
  );
  if (frames > MAX_VIDEO_SECONDS * FPS)
    throw new Error("Template exceeds 90 seconds");
  return frames;
}
