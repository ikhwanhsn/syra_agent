import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { REVEAL } from "../content/script";
import { ACCENT, CYAN, MUTED } from "../content/theme";
import { Eyebrow, SmashText, SyraLogoMark, useShake } from "../lib/ui";

export function ShotReveal({ start }: { start: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - start;
  const shake = useShake(18, 14, start + 18);
  const bloom = interpolate(local, [10, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sub = spring({
    frame: local - 40,
    fps,
    config: { damping: 18, stiffness: 120, mass: 0.8 },
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        transform: `translate(${shake.x}px, ${shake.y}px)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(243,186,47,${0.35 * bloom}) 0%, transparent 60%)`,
          filter: "blur(10px)",
          transform: `scale(${0.7 + bloom * 0.5})`,
        }}
      />
      <SyraLogoMark size={140} delay={start + 4} />
      <div style={{ height: 20 }} />
      <Eyebrow text={REVEAL.eyebrow} />
      <SmashText fontSize={140} delay={start + 16} color={ACCENT}>
        {REVEAL.title}
      </SmashText>
      <div
        style={{
          opacity: sub,
          marginTop: 22,
          color: MUTED,
          fontSize: 32,
          fontWeight: 600,
          transform: `translateY(${(1 - sub) * 20}px)`,
        }}
      >
        {REVEAL.subtitle}
      </div>
      <div
        style={{
          opacity: sub,
          marginTop: 28,
          padding: "12px 20px",
          borderRadius: 999,
          border: `1px solid ${CYAN}77`,
          background: `${CYAN}18`,
          color: CYAN,
          fontSize: 16,
          fontWeight: 800,
          letterSpacing: "0.16em",
          boxShadow: `0 0 28px ${CYAN}44`,
        }}
      >
        {REVEAL.badge}
      </div>
    </AbsoluteFill>
  );
}
