import React from "react";
import { AbsoluteFill } from "remotion";
import { INTEL } from "../content/script";
import { ACCENT, CYAN, FG, MUTED, VIOLET, WARN } from "../content/theme";
import { Eyebrow, GlassCard, GradientText, StatusPill } from "../lib/ui";

/** Shot cards: list-reveal + value-stagger-gradient */
export function ShotIntel({ start }: { start: number }) {
  const glows = [
    "rgba(62,224,184,0.22)",
    "rgba(243,186,47,0.22)",
    "rgba(167,139,250,0.22)",
    "rgba(243,186,47,0.18)",
  ];
  const accents = [CYAN, ACCENT, VIOLET, WARN];

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "70px 100px 140px",
      }}
    >
      <div style={{ marginBottom: 32 }}>
        <Eyebrow text={INTEL.eyebrow} color={VIOLET} />
        <GradientText fontSize={50}>{INTEL.title}</GradientText>
        <div style={{ marginTop: 16 }}>
          <StatusPill label="NEWS · SENTIMENT · EVENTS · SIGNAL" tone="warn" />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 22,
        }}
      >
        {INTEL.tiles.map((tile, i) => (
          <GlassCard
            key={tile.title}
            delay={start + 16 + i * 14}
            padding="34px 30px"
            glow={glows[i]}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <div
                  style={{
                    color: accents[i],
                    fontSize: 18,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    marginBottom: 12,
                  }}
                >
                  {tile.title.toUpperCase()}
                </div>
                <div style={{ color: FG, fontSize: 22, lineHeight: 1.4, maxWidth: 420 }}>
                  {tile.detail}
                </div>
              </div>
              <div
                style={{
                  color: accents[i],
                  fontSize: 52,
                  fontWeight: 800,
                  lineHeight: 1,
                }}
              >
                {tile.value}
              </div>
            </div>
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
        Free on the dashboard. Same payload available to agents via x402.
      </div>
    </AbsoluteFill>
  );
}
