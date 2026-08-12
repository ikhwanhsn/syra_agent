import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BOARD } from "../content/script";
import { ACCENT, CYAN, FG, FONT_MONO, MUTED, RED } from "../content/theme";
import { Eyebrow, GlassCard, GradientText } from "../lib/ui";

/** Shot cards: deck-deal-flyin + row-embed */
export function ShotBoard({ start }: { start: number }) {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "60px 90px 130px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 28,
        }}
      >
        <div>
          <Eyebrow text={BOARD.eyebrow} />
          <GradientText fontSize={48}>{BOARD.title}</GradientText>
          <div style={{ color: MUTED, fontSize: 22, marginTop: 12 }}>
            {BOARD.subtitle}
          </div>
        </div>
        <GlassCard delay={start + 12} padding="12px 18px" glow="rgba(62,224,184,0.2)">
          <div style={{ color: CYAN, fontFamily: FONT_MONO, fontSize: 16, fontWeight: 700 }}>
            All · Crypto · Stocks
          </div>
        </GlassCard>
      </div>

      <GlassCard
        delay={start + 8}
        padding="0"
        glow="rgba(243,186,47,0.12)"
        style={{ overflow: "hidden" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 2fr 1.2fr 1fr 1fr",
            padding: "16px 28px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            color: MUTED,
            fontFamily: FONT_MONO,
            fontSize: 14,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          <span>Symbol</span>
          <span>Name</span>
          <span>Price</span>
          <span>24h</span>
          <span>Tier</span>
        </div>
        {BOARD.rows.map((row, i) => {
          const delay = start + 18 + i * 12;
          const local = frame - delay;
          const fly = interpolate(local, [0, 22], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const fromX = i % 2 === 0 ? -120 : 120;
          const opacity = interpolate(local, [0, 16], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const up = row.chg.startsWith("+");
          return (
            <div
              key={row.symbol}
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 2fr 1.2fr 1fr 1fr",
                padding: "20px 28px",
                borderBottom:
                  i === BOARD.rows.length - 1
                    ? "none"
                    : "1px solid rgba(255,255,255,0.05)",
                opacity,
                transform: `translateX(${fromX * fly}px)`,
                background:
                  i === 0 ? "rgba(243,186,47,0.06)" : "transparent",
              }}
            >
              <span style={{ color: ACCENT, fontWeight: 800, fontSize: 22 }}>
                {row.symbol}
              </span>
              <span style={{ color: FG, fontSize: 22, fontWeight: 600 }}>
                {row.name}
              </span>
              <span
                style={{
                  color: FG,
                  fontFamily: FONT_MONO,
                  fontSize: 20,
                  fontWeight: 700,
                }}
              >
                {row.price}
              </span>
              <span
                style={{
                  color: up ? CYAN : RED,
                  fontFamily: FONT_MONO,
                  fontSize: 20,
                  fontWeight: 700,
                }}
              >
                {row.chg}
              </span>
              <span style={{ color: MUTED, fontFamily: FONT_MONO, fontSize: 16 }}>
                {row.tier}
              </span>
            </div>
          );
        })}
      </GlassCard>
    </AbsoluteFill>
  );
}
