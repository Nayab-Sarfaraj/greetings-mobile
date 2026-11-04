"use client";

import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { palettes, typography, FPS } from "@greetings/shared";
import type { VideoProps } from "./schema";
import { getTemplate } from "./templates";
const color = palettes.thanksgiving;
export function Bloom({
  x,
  y,
  size = 160,
}: {
  x: number;
  y: number;
  size?: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 18 } });
  return (
    <svg
      width={size}
      height={size}
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `scale(${scale})`,
      }}
      viewBox="0 0 100 100"
      aria-hidden="true"
    >
      <g fill={color.marigold}>
        {Array.from({ length: 12 }, (_, i) => (
          <ellipse
            key={i}
            cx="50"
            cy="25"
            rx="9"
            ry="23"
            transform={`rotate(${i * 30} 50 50)`}
          />
        ))}
      </g>
      <circle cx="50" cy="50" r="16" fill={color.oxblood} />
    </svg>
  );
}
export function Leaf({
  x,
  y,
  rotate = 0,
}: {
  x: number;
  y: number;
  rotate?: number;
}) {
  const frame = useCurrentFrame();
  return (
    <svg
      width="130"
      height="130"
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translateY(${Math.sin(frame / 28) * 10}px) rotate(${rotate}deg)`,
      }}
      viewBox="0 0 100 100"
      aria-hidden="true"
    >
      <path
        d="M50 5 Q80 25 88 55 Q70 90 50 82 Q22 94 12 55 Q20 24 50 5Z"
        fill={color.olive}
      />
      <path
        d="M50 80V100M50 80L24 44M50 80L74 42"
        stroke={color.paper}
        strokeWidth="3"
      />
    </svg>
  );
}
export function Wheat({ x, y }: { x: number; y: number }) {
  return (
    <svg
      width="110"
      height="210"
      style={{ position: "absolute", left: x, top: y }}
      viewBox="0 0 110 210"
      aria-hidden="true"
    >
      <path d="M52 195V20" stroke={color.olive} strokeWidth="5" />
      {[25, 55, 85, 115].map((top) => (
        <g key={top} fill={color.marigold}>
          <ellipse
            cx="35"
            cy={top}
            rx="12"
            ry="26"
            transform={`rotate(-35 35 ${top})`}
          />
          <ellipse
            cx="69"
            cy={top + 12}
            rx="12"
            ry="26"
            transform={`rotate(35 69 ${top + 12})`}
          />
        </g>
      ))}
    </svg>
  );
}
export function Vine() {
  return (
    <>
      <Leaf x={80} y={110} rotate={-25} />
      <Leaf x={790} y={180} rotate={30} />
      <Wheat x={80} y={1450} />
      <Wheat x={880} y={1430} />
    </>
  );
}
export function CornerCluster() {
  return (
    <>
      <Bloom x={-35} y={90} />
      <Bloom x={860} y={140} size={230} />
      <Vine />
    </>
  );
}
export function Wreath() {
  return (
    <>
      <Bloom x={170} y={220} size={180} />
      <Bloom x={730} y={190} size={170} />
      <Leaf x={390} y={180} />
    </>
  );
}
function FitText({
  children,
  size = 100,
}: {
  children: string;
  size?: number;
}) {
  const length = children.length;
  const fontSize = Math.max(
    size * 0.56,
    Math.min(size, (size * 30) / Math.max(30, length)),
  );
  return (
    <div
      style={{
        fontSize,
        maxWidth: 880,
        overflowWrap: "anywhere",
        lineHeight: 1.12,
        textAlign: "center",
      }}
    >
      {children}
    </div>
  );
}
function Scene({ props, id }: { props: VideoProps; id: string }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20, 75], [0, 1, 1], {
    extrapolateRight: "clamp",
  });
  const isCard = props.type === "card";
  const title = isCard ? "With gratitude" : props.eventTitle;
  const subtitle =
    id === "intro"
      ? title
      : id === "details" && !isCard
        ? `${new Date(props.dateTime).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" })}\n${props.locationText}`
        : id === "guest-name" && !isCard
          ? (props.guestName ?? props.hostName)
          : isCard
            ? props.message
            : (props.message ?? `With love, ${props.hostName}`);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: color.paper,
        color: color.ink,
        alignItems: "center",
        justifyContent: "center",
        fontFamily: typography.display,
        padding: "260px 100px",
        textAlign: "center",
      }}
    >
      <CornerCluster />
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
            fontFamily: typography.body,
            fontSize: 36,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: color.oxblood,
          }}
        >
          Thanksgiving
        </div>
        <FitText size={id === "intro" ? 110 : 88}>{subtitle}</FitText>
        {id === "closing" && (
          <div style={{ fontFamily: typography.body, fontSize: 38 }}>
            {isCard
              ? `From ${props.senderName}`
              : `Hosted by ${props.hostName}`}
          </div>
        )}
        {props.photoUrl && id === "details" && (
          <Img
            src={props.photoUrl}
            style={{
              width: 500,
              height: 450,
              objectFit: "cover",
              border: `12px solid ${color.oxblood}`,
            }}
          />
        )}
      </div>
    </AbsoluteFill>
  );
}
export function GreetingComposition(props: VideoProps) {
  const template = getTemplate(
    props.type === "card" ? "harvest-card" : "harvest-invitation",
  );
  if (!template) return null;
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
    </>
  );
}
