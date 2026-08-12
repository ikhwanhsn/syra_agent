import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { HOOK } from "../content/script";
import { ACCENT, FG, MUTED } from "../content/theme";
import { Eyebrow, GradientText, SyraLogoMark } from "../lib/ui";

/** Shot card: spotlight-hero-card */
export function ShotHook() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleIn = spring({
    frame: frame - 12,
    fps,
    config: { damping: 200, stiffness: 110, mass: 1 },
  });
  const subIn = spring({
    frame: frame - 28,
    fps,
    config: { damping: 200, stiffness: 120, mass: 0.85 },
  });
  const beam = interpolate(frame, [20, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const floatY = Math.sin(frame / 28) * 6;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 720,
          height: 720,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(243,186,47,${0.22 * beam}) 0%, transparent 65%)`,
          filter: "blur(8px)",
          transform: `scale(${0.85 + beam * 0.25})`,
        }}
      />
      <div style={{ transform: `translateY(${floatY}px)`, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <SyraLogoMark size={128} delay={0} />
        </div>
        <div style={{ height: 28 }} />
        <Eyebrow text={HOOK.eyebrow} />
        <div
          style={{
            opacity: titleIn,
            transform: `translateY(${(1 - titleIn) * 30}px)`,
          }}
        >
          <GradientText fontSize={82}>{HOOK.title}</GradientText>
        </div>
        <div
          style={{
            opacity: subIn,
            marginTop: 22,
            color: MUTED,
            fontSize: 30,
            fontWeight: 500,
            maxWidth: 980,
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: 1.4,
          }}
        >
          {HOOK.subtitle}
        </div>
        <div
          style={{
            opacity: subIn,
            marginTop: 36,
            display: "inline-flex",
            padding: "12px 20px",
            borderRadius: 12,
            border: `1px solid ${ACCENT}66`,
            background: `${ACCENT}14`,
            color: ACCENT,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "0.08em",
          }}
        >
          Resolve · Risk · Intel · Action
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 120,
          color: FG,
          opacity: 0.25,
          fontSize: 14,
          letterSpacing: "0.3em",
          fontWeight: 700,
        }}
      >
        TOKENS.XYZ × SYRA
      </div>
    </AbsoluteFill>
  );
}
