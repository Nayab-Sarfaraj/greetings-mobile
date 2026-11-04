import { FPS, MAX_VIDEO_SECONDS } from "@greetings/shared";
import type { VideoProps } from "./schema";
export type SceneId = "intro" | "details" | "guest-name" | "closing";
export type Template = {
  id: string;
  title: string;
  type: VideoProps["type"];
  themeId: "thanksgiving";
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
];
export function getTemplate(id: string) {
  return templates.find((template) => template.id === id);
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
