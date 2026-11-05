"use client";

import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { FPS } from "@greetings/shared";
import { CornerCluster, Wreath } from "./flora";
import { fonts } from "./fonts";
import type { VideoProps } from "./schema";
import { getTemplateForProps } from "./templates";
import { getTheme } from "./themes";

export { Bloom, CornerCluster, Leaf, Vine, Wheat, Wreath } from "./flora";

function FitText({
  children,
  size = 100,
  script = false,
}: {
  children: string;
  size?: number;
  script?: boolean;
}) {
  const frame = useCurrentFrame();
  const fontSize = Math.max(
    size * 0.56,
    Math.min(size, (size * 30) / Math.max(30, children.length)),
  );
  return (
    <div
      style={{
        fontSize,
        maxWidth: 880,
        overflowWrap: "anywhere",
        lineHeight: 1.12,
        textAlign: "center",
        fontFamily: script ? fonts.script : fonts.display,
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: 5,
        overflow: "hidden",
        clipPath: script
          ? `inset(0 ${100 - Math.min(100, Math.max(0, frame - 8) * 2)}% 0 0)`
          : undefined,
      }}
    >
      {children}
    </div>
  );
}

function eventDetails(props: Extract<VideoProps, { type: "invitation" }>) {
  const date = new Date(
    `${props.dateTime.slice(0, 10)}T00:00:00Z`,
  ).toLocaleDateString("en-US", { dateStyle: "long", timeZone: "UTC" });
  const offset = props.dateTime.endsWith("Z")
    ? "+00:00"
    : props.dateTime.slice(-6);
  return `${date} at ${props.dateTime.slice(11, 16)} UTC${offset}\n${props.locationText}`;
}

function Scene({ props, id }: { props: VideoProps; id: string }) {
  const frame = useCurrentFrame();
  const theme = getTheme(props.themeId);
  const opacity = interpolate(frame, [0, 20, 75], [0, 1, 1], {
    extrapolateRight: "clamp",
  });
  const isCard = props.type === "card";
  const subtitle =
    id === "intro"
      ? isCard
        ? "A little something for you"
        : props.eventTitle
      : id === "details" && !isCard
        ? eventDetails(props)
        : id === "guest-name" && !isCard
          ? (props.guestName ?? props.hostName)
          : isCard
            ? props.message
            : (props.message ?? `With love, ${props.hostName}`);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.background,
        color: theme.ink,
        alignItems: "center",
        justifyContent: "center",
        fontFamily: fonts.display,
        padding: "260px 100px",
        textAlign: "center",
      }}
    >
      <CornerCluster theme={theme} />
      {id === "intro" && <Wreath theme={theme} />}
      <div
        style={{
          opacity,
          zIndex: 2,
          display: "grid",
          gap: 35,
          justifyItems: "center",
          whiteSpace: "pre-line",
        }}
      >
        <div
          style={{
            fontFamily: fonts.body,
            fontSize: 36,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: theme.accent,
          }}
        >
          {theme.label}
        </div>
        {isCard && id === "closing" && props.recipientName && (
          <div style={{ fontFamily: fonts.body, fontSize: 36 }}>
            For {props.recipientName}
          </div>
        )}
        <FitText size={id === "intro" ? 110 : 88} script={id === "guest-name"}>
          {subtitle}
        </FitText>
        {id === "closing" && (
          <div
            style={{
              fontFamily: fonts.body,
              fontSize: 38,
              maxWidth: 880,
              overflowWrap: "anywhere",
            }}
          >
            {isCard
              ? `From ${props.senderName}`
              : `Hosted by ${props.hostName}`}
          </div>
        )}
        {props.photoUrl &&
          (id === "details" || (isCard && id === "closing")) && (
            <Img
              src={props.photoUrl}
              style={{
                width: 500,
                height: 450,
                objectFit: "cover",
                border: `12px solid ${theme.photoBorder}`,
              }}
            />
          )}
      </div>
    </AbsoluteFill>
  );
}

export function GreetingComposition(
  props: VideoProps & { watermark?: boolean },
) {
  const template = getTemplateForProps(props.type, props.themeId);
  if (!template) return null;
  const theme = getTheme(props.themeId);
  let from = 0;
  return (
    <>
      {template.scenes.map((scene) => {
        const start = from;
        const frames = Math.round(scene.seconds * FPS);
        from += frames;
        return (
          <Sequence key={scene.id} from={start} durationInFrames={frames}>
            <Scene props={props} id={scene.id} />
          </Sequence>
        );
      })}
      {props.watermark && (
        <AbsoluteFill
          style={{
            justifyContent: "flex-end",
            alignItems: "center",
            paddingBottom: 85,
            color: theme.accent,
            fontFamily: fonts.body,
            fontSize: 32,
          }}
        >
          Made with CherryQube
        </AbsoluteFill>
      )}
    </>
  );
}
