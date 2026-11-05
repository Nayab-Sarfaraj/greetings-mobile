import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { HolidayTheme } from "./themes";

type Placement = { x: number; y: number; size?: number; rotate?: number };

export function Bloom({
  theme,
  variant,
  x,
  y,
  size = 160,
}: Placement & {
  theme: HolidayTheme;
  variant:
    | "dahlia"
    | "chrysanthemum"
    | "sunflower"
    | "poinsettia"
    | "hellebore"
    | "anemone"
    | "ranunculus";
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 18 } });
  const petals =
    variant === "poinsettia" ? 6 : variant === "ranunculus" ? 16 : 12;
  const petalFill =
    variant === "poinsettia"
      ? theme.accent
      : variant === "anemone"
        ? theme.secondary
        : theme.secondary;
  const center =
    variant === "anemone" || variant === "hellebore" ? theme.ink : theme.accent;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `scale(${scale})`,
      }}
    >
      <g fill={petalFill} opacity={variant === "hellebore" ? 0.8 : 1}>
        {Array.from({ length: petals }, (_, index) => (
          <ellipse
            key={index}
            cx="50"
            cy={variant === "ranunculus" ? 31 : 24}
            rx={variant === "poinsettia" ? 15 : 9}
            ry={variant === "poinsettia" ? 29 : 23}
            transform={`rotate(${(index * 360) / petals} 50 50)`}
          />
        ))}
      </g>
      <circle
        cx="50"
        cy="50"
        r={variant === "sunflower" ? 18 : 14}
        fill={center}
      />
      {variant === "sunflower" && (
        <circle cx="50" cy="50" r="9" fill={theme.ink} opacity="0.55" />
      )}
    </svg>
  );
}

export function Leaf({
  theme,
  variant,
  x,
  y,
  rotate = 0,
}: Placement & {
  theme: HolidayTheme;
  variant: "maple" | "oak" | "holly" | "pine" | "eucalyptus" | "pampas";
}) {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 28) * 8;
  const path =
    variant === "holly"
      ? "M50 8 63 30 88 25 75 48 91 68 65 68 50 92 35 68 9 68 25 48 12 25 37 30Z"
      : variant === "oak"
        ? "M50 7C80 16 91 39 78 53c12 20-12 35-28 28-18 9-40-10-28-28C9 39 20 16 50 7Z"
        : variant === "pampas"
          ? "M50 3C75 20 82 50 57 79L50 98 43 79C18 50 25 20 50 3Z"
          : "M50 5Q80 25 88 55Q70 90 50 82Q22 94 12 55Q20 24 50 5Z";
  return (
    <svg
      width={variant === "pine" ? 190 : 130}
      height={variant === "pine" ? 190 : 130}
      viewBox="0 0 100 100"
      aria-hidden="true"
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translateY(${drift}px) rotate(${rotate}deg)`,
      }}
    >
      {variant === "pine" ? (
        <g stroke={theme.foliage} strokeWidth="4" strokeLinecap="round">
          <path d="M50 96V5" />
          {Array.from({ length: 7 }, (_, index) => (
            <path
              key={index}
              d={`M50 ${18 + index * 10} L${12 + (index % 2) * 10} ${5 + index * 11}M50 ${18 + index * 10} L${88 - (index % 2) * 10} ${5 + index * 11}`}
            />
          ))}
        </g>
      ) : variant === "eucalyptus" ? (
        <g fill={theme.foliage}>
          <path d="M50 96V5" stroke={theme.foliage} strokeWidth="3" />
          {Array.from({ length: 6 }, (_, index) => (
            <ellipse
              key={index}
              cx={index % 2 ? 35 : 65}
              cy={18 + index * 12}
              rx="13"
              ry="8"
              transform={`rotate(${index % 2 ? -30 : 30} ${index % 2 ? 35 : 65} ${18 + index * 12})`}
            />
          ))}
        </g>
      ) : (
        <>
          <path
            d={path}
            fill={variant === "pampas" ? theme.secondary : theme.foliage}
          />
          {variant !== "pampas" && (
            <path
              d="M50 80V100M50 80L24 44M50 80L74 42"
              stroke={theme.background}
              strokeWidth="3"
            />
          )}
        </>
      )}
    </svg>
  );
}

export function Wheat({ theme, x, y }: Placement & { theme: HolidayTheme }) {
  return (
    <svg
      width="110"
      height="210"
      viewBox="0 0 110 210"
      aria-hidden="true"
      style={{ position: "absolute", left: x, top: y }}
    >
      <path d="M52 195V20" stroke={theme.foliage} strokeWidth="5" />
      {[25, 55, 85, 115].map((top) => (
        <g key={top} fill={theme.secondary}>
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

export function Vine({ theme }: { theme: HolidayTheme }) {
  const leaf = theme.flora === "evergreen" ? "eucalyptus" : "maple";
  return (
    <>
      <Leaf theme={theme} variant={leaf} x={80} y={110} rotate={-25} />
      <Leaf theme={theme} variant={leaf} x={790} y={180} rotate={30} />
    </>
  );
}

export function CornerCluster({ theme }: { theme: HolidayTheme }) {
  if (theme.flora === "evergreen")
    return (
      <>
        <Bloom theme={theme} variant="poinsettia" x={-38} y={95} />
        <Bloom theme={theme} variant="hellebore" x={845} y={125} size={220} />
        <Leaf theme={theme} variant="pine" x={-35} y={1320} rotate={-25} />
        <Leaf theme={theme} variant="eucalyptus" x={855} y={1420} rotate={30} />
        <Leaf theme={theme} variant="holly" x={760} y={145} rotate={18} />
      </>
    );
  if (theme.flora === "midnight")
    return (
      <>
        <Bloom theme={theme} variant="anemone" x={-30} y={100} />
        <Bloom theme={theme} variant="ranunculus" x={850} y={130} size={220} />
        <Leaf theme={theme} variant="pampas" x={35} y={1440} rotate={-18} />
        <Leaf theme={theme} variant="eucalyptus" x={860} y={1450} rotate={30} />
      </>
    );
  return (
    <>
      <Bloom theme={theme} variant="sunflower" x={-35} y={90} />
      <Bloom theme={theme} variant="chrysanthemum" x={860} y={140} size={230} />
      <Vine theme={theme} />
      <Wheat theme={theme} x={80} y={1450} />
      <Wheat theme={theme} x={880} y={1430} />
    </>
  );
}

export function Wreath({ theme }: { theme: HolidayTheme }) {
  const flower = theme.flora === "evergreen" ? "poinsettia" : "dahlia";
  return (
    <>
      <Bloom theme={theme} variant={flower} x={170} y={220} size={180} />
      <Bloom theme={theme} variant={flower} x={730} y={190} size={170} />
      <Leaf
        theme={theme}
        variant={theme.flora === "evergreen" ? "holly" : "oak"}
        x={390}
        y={180}
      />
    </>
  );
}
