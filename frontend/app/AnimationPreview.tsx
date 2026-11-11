"use client";

import { Player } from "@remotion/player";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type Scene = {
  id: number;
  text: string;
  duration_seconds: number;
  environment?: "forest" | "plain";
  time_of_day?: "day" | "night";
  action?: "walk" | "wait" | "jump";
};

type Props = {
  scenes: Scene[];
};

function RobotScene({ scene }: { scene: Scene }) {
  const text = scene.text;
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const action = text.toLocaleLowerCase("tr-TR");
    const jumps = scene.action ? scene.action === "jump" : action.includes("zıplar");
    const waits = scene.action ? scene.action === "wait" : action.includes("bekler");

  const x = interpolate(
    frame,
    [0, Math.max(1, durationInFrames - 1)],
    jumps || waits ? [380, 380] : [100, 650],
    { extrapolateRight: "clamp" }
  );

  const bounce = jumps
  ? Math.abs(Math.sin(frame / 8)) * 65
  : waits
    ? 0
    : Math.sin(frame / 5) * 8;
  const words = text.toLocaleLowerCase("tr-TR");
  const isNight = scene.time_of_day ? scene.time_of_day === "night" : words.includes("gece");
  const isForest = scene.environment ? scene.environment === "forest" : words.includes("orman");

    const skyColor = isNight
    ? "#172554"
    : isForest
        ? "#bbf7d0"
        : "#dbeafe";

    const groundColor = isNight
    ? "#14532d"
    : isForest
        ? "#16a34a"
        : "#86efac";

  return (
    <AbsoluteFill style={{ backgroundColor: skyColor }}>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          width: "100%",
          height: 180,
          backgroundColor: groundColor,
        }}
      />

      <svg
        width="160"
        height="220"
        viewBox="0 0 160 220"
        style={{
          position: "absolute",
          left: x,
          bottom: 155 + bounce,
        }}
      >
        <path d="M80 30V10" stroke="#475569" strokeWidth="8" />
        <circle cx="80" cy="10" r="9" fill="#f97316" />
        <rect x="25" y="35" width="110" height="80" rx="20" fill="#7c3aed" />
        <circle cx="58" cy="70" r="10" fill="white" />
        <circle cx="102" cy="70" r="10" fill="white" />
        <path
          d="M60 92 Q80 106 100 92"
          fill="none"
          stroke="white"
          strokeWidth="5"
        />
        <rect x="40" y="125" width="80" height="55" rx="12" fill="#8b5cf6" />
        <path
          d="M40 140L15 165 M120 140L145 165 M60 180V210 M100 180V210"
          stroke="#475569"
          strokeWidth="12"
          strokeLinecap="round"
        />
      </svg>

      <div
        style={{
          position: "absolute",
          bottom: 35,
          left: 40,
          right: 40,
          padding: 20,
          borderRadius: 16,
          backgroundColor: "#0f172a",
          color: "white",
          fontSize: 28,
          textAlign: "center",
          fontFamily: "Arial, sans-serif",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
}

export function StoryVideo({ scenes }: Props) {
  return (
    <AbsoluteFill>
      {scenes.map((scene, index) => {
        const duration = Math.max(1, Math.round(scene.duration_seconds * 30));
        const from = scenes.slice(0, index).reduce(
          (sum, previous) => sum + Math.max(1, Math.round(previous.duration_seconds * 30)),
          0
        );

        return (
          <Sequence key={scene.id} from={from} durationInFrames={duration}>
            <RobotScene scene={scene} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}

export default function AnimationPreview({ scenes }: Props) {
  const totalFrames = scenes.reduce(
    (sum, scene) =>
      sum + Math.max(1, Math.round(scene.duration_seconds * 30)),
    0
  );

  if (totalFrames === 0) return null;

  return (
    <Player
      component={StoryVideo}
      inputProps={{ scenes }}
      durationInFrames={totalFrames}
      compositionWidth={960}
      compositionHeight={540}
      fps={30}
      controls
      style={{ width: "100%", borderRadius: 16, overflow: "hidden" }}
    />
  );
}
