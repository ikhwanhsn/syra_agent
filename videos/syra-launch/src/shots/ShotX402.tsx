import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { X402 } from "../content/script";
import { ACCENT, CYAN, FG, FONT_MONO, MUTED } from "../content/theme";
import { Eyebrow, GlassCard, GradientText, useShake } from "../lib/ui";

export function ShotX402({ start }: { start: number }) {
  const frame = useCurrentFrame();
  const local = frame - start;
  const line = interpolate(local, [16, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shake = useShake(8, 10, start + 90);

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "60px 70px 120px",
        transform: `translate(${shake.x}px, ${shake.y}px)`,
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <Eyebrow text="HOW x402 WORKS" color={CYAN} />
        <GradientText fontSize={48}>Four steps. Zero API key chaos.</GradientText>
      </div>

      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: 52,
            left: 70,
            right: 70,
            height: 4,
            borderRadius: 4,
            background: `linear-gradient(90deg, ${ACCENT}, ${CYAN})`,
            transformOrigin: "left center",
            transform: `scaleX(${line})`,
            boxShadow: `0 0 20px ${ACCENT}`,
          }}
        />
        <div style={{ display: "flex", gap: 18 }}>
          {X402.map((s, i) => (
            <GlassCard
              key={s.step}
              delay={start + 18 + i * 16}
              padding="30px 22px"
              glow={i === 3 ? "rgba(62,224,184,0.35)" : "rgba(243,186,47,0.22)"}
              style={{ flex: 1 }}
            >
              <div
                style={{
                  color: ACCENT,
                  fontFamily: FONT_MONO,
                  fontSize: 18,
                  fontWeight: 800,
                  marginBottom: 14,
                }}
              >
                {s.step}
              </div>
              <div style={{ color: FG, fontSize: 34, fontWeight: 800, marginBottom: 10 }}>
                {s.title}
              </div>
              <div style={{ color: MUTED, fontSize: 18, lineHeight: 1.4 }}>
                {s.detail}
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      <div
        style={{
          marginTop: 32,
          textAlign: "center",
          color: CYAN,
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: "0.1em",
        }}
      >
        SETTLEMENT ON SOLANA · AGENT KEEPS BUILDING
      </div>
    </AbsoluteFill>
  );
}
