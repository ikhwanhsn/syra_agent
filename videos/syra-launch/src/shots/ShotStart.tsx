import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { START } from "../content/script";
import { ACCENT, CYAN, FG, FONT_MONO, MUTED } from "../content/theme";
import { Eyebrow, GlassCard, GradientText } from "../lib/ui";

function TypeLine({ text, delay }: { text: string; delay: number }) {
  const frame = useCurrentFrame();
  const chars = Math.floor(
    interpolate(frame - delay, [0, 24], [0, text.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  return (
    <div
      style={{
        color: CYAN,
        fontSize: 16,
        fontFamily: FONT_MONO,
        background: "rgba(0,0,0,0.45)",
        borderRadius: 12,
        padding: "14px 14px",
        border: `1px solid ${CYAN}44`,
        boxShadow: `0 0 20px ${CYAN}22`,
        minHeight: 48,
      }}
    >
      {text.slice(0, chars)}
      <span style={{ opacity: (frame - delay) % 16 < 8 ? 1 : 0.2 }}>|</span>
    </div>
  );
}

export function ShotStart({ start }: { start: number }) {
  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "70px 90px 130px",
      }}
    >
      <div style={{ marginBottom: 32 }}>
        <Eyebrow text={START.eyebrow} color={CYAN} />
        <GradientText fontSize={52}>{START.title}</GradientText>
      </div>
      <div style={{ display: "flex", gap: 22 }}>
        {START.paths.map((path, i) => (
          <GlassCard
            key={path.name}
            delay={start + 12 + i * 14}
            padding="30px 24px"
            glow="rgba(62,224,184,0.22)"
            style={{ flex: 1 }}
          >
            <div
              style={{
                color: ACCENT,
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: "0.14em",
                marginBottom: 10,
              }}
            >
              {path.name}
            </div>
            <div
              style={{
                color: FG,
                fontSize: 30,
                fontWeight: 800,
                marginBottom: 18,
              }}
            >
              {path.detail}
            </div>
            <TypeLine text={path.line} delay={start + 28 + i * 14} />
          </GlassCard>
        ))}
      </div>
      <div
        style={{
          marginTop: 28,
          textAlign: "center",
          color: MUTED,
          fontSize: 20,
        }}
      >
        Fund about $1 Solana USDC. Make your first paid call.
      </div>
    </AbsoluteFill>
  );
}
