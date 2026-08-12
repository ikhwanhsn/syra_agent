import React from "react";
import { AbsoluteFill } from "remotion";
import { POWER } from "../content/script";
import { ACCENT, CYAN, FG, MUTED, VIOLET } from "../content/theme";
import { Eyebrow, GlassCard, GradientText } from "../lib/ui";

export function ShotPower({ start }: { start: number }) {
  const glows = [
    "rgba(243,186,47,0.25)",
    "rgba(62,224,184,0.22)",
    "rgba(167,139,250,0.25)",
  ];
  const accents = [ACCENT, CYAN, VIOLET, ACCENT, CYAN, VIOLET];

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "60px 90px 120px",
      }}
    >
      <div style={{ marginBottom: 28 }}>
        <Eyebrow text="WHAT YOU UNLOCK" />
        <GradientText fontSize={48}>Crypto intelligence. Pay per call.</GradientText>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 18,
        }}
      >
        {POWER.map((p, i) => (
          <GlassCard
            key={p.title}
            delay={start + 10 + i * 10}
            padding="28px 24px"
            glow={glows[i % glows.length]}
          >
            <div
              style={{
                color: accents[i],
                fontSize: 26,
                fontWeight: 800,
                marginBottom: 10,
              }}
            >
              {p.title}
            </div>
            <div style={{ color: MUTED, fontSize: 18 }}>{p.detail}</div>
          </GlassCard>
        ))}
      </div>
      <div
        style={{
          marginTop: 26,
          textAlign: "center",
          color: FG,
          fontSize: 22,
          fontWeight: 700,
        }}
      >
        One API. Machine money in. Data out.
      </div>
    </AbsoluteFill>
  );
}
