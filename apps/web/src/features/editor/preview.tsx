"use client";
import { useEffect, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import {
  GreetingComposition,
  durationInFrames,
  getTemplate,
  type VideoProps,
} from "@greetings/remotion";
import { FPS, VIDEO_SIZE } from "@greetings/shared";
export default function Preview({
  templateId,
  props,
}: {
  templateId: string;
  props: VideoProps;
}) {
  const template = getTemplate(templateId)!;
  const player = useRef<PlayerRef>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReducedMotion(query.matches);
      if (query.matches) {
        player.current?.pause();
        setPlaying(false);
      }
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return (
    <div>
      <Player
        ref={player}
        component={GreetingComposition}
        inputProps={props}
        durationInFrames={durationInFrames(template)}
        fps={FPS}
        compositionWidth={VIDEO_SIZE.width}
        compositionHeight={VIDEO_SIZE.height}
        autoPlay={!reducedMotion}
        loop={!reducedMotion}
        initiallyMuted
        style={{ width: "100%", aspectRatio: "9 / 16" }}
      />
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={() => {
            if (playing) player.current?.pause();
            else player.current?.play();
            setPlaying(!playing);
          }}
          className="rounded-full border border-ink px-5 py-2"
        >
          {playing ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          onClick={() => player.current?.seekTo(0)}
          className="rounded-full border border-ink px-5 py-2"
        >
          Restart
        </button>
        <button
          type="button"
          onClick={() => {
            if (muted) player.current?.unmute();
            else player.current?.mute();
            setMuted(!muted);
          }}
          className="rounded-full border border-ink px-5 py-2"
        >
          Sound
        </button>
      </div>
    </div>
  );
}
