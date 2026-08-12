import React from "react";
import { AbsoluteFill } from "remotion";
import { FOUNDATION } from "../content/script";
import { ACCENT, CYAN, FG, FONT_MONO, MUTED } from "../content/theme";
import { CountUp, Eyebrow, GlassCard, GradientText } from "../lib/ui";

/** Shot cards: letterspace-materialize + icon-field-colorize */
export function ShotFoundation({ start }: { start: number }) {
  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "70px 100px 140px",
      }}
    >
      <div style={{ display: "flex", gap: 48, alignItems: "flex-start" }}>
        <div style={{ flex: 1.4, maxWidth: 980 }}>
          <Eyebrow text={FOUNDATION.eyebrow} color={CYAN} />
          <GradientText fontSize={52}>{FOUNDATION.title}</GradientText>
          <div
            style={{
              color: MUTED,
              fontSize: 24,
              marginTop: 22,
              lineHeight: 1.45,
              maxWidth: 860,
            }}
          >
            {FOUNDATION.body}
          </div>
          <div style={{ marginTop: 28, display: "flex", gap: 14, flexWrap: "wrap" }}>
            {FOUNDATION.bullets.map((b, i) => (
              <GlassCard
                key={b}
                delay={start + 20 + i * 16}
                padding="16px 18px"
                glow="rgba(62,224,184,0.2)"
              >
                <div style={{ color: FG, fontSize: 18, fontWeight: 600 }}>{b}</div>
              </GlassCard>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, width: 280 }}>
          {FOUNDATION.stats.map((s, i) => (
            <GlassCard
              key={s.label}
              delay={start + 28 + i * 12}
              padding="22px 20px"
              glow="rgba(243,186,47,0.28)"
              style={{ textAlign: "center" }}
            >
              {s.value === "OSS" ? (
                <div
                  style={{
                    color: ACCENT,
                    fontSize: 40,
                    fontWeight: 800,
                    fontFamily: FONT_MONO,
                  }}
                >
                  OSS
                </div>
              ) : (
                <CountUp
                  target={Number(s.value)}
                  delay={start + 28 + i * 12}
                  duration={32}
                  fontSize={40}
                  color={ACCENT}
                />
              )}
              <div style={{ color: MUTED, fontSize: 14, marginTop: 8 }}>
                {s.label}
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      <div
        style={{
          marginTop: 36,
          display: "flex",
          gap: 20,
          justifyContent: "center",
        }}
      >
        {["github.com/solana-foundation/tokens", "api.tokens.xyz", "docs.tokens.xyz"].map(
          (url, i) => (
            <GlassCard
              key={url}
              delay={start + 70 + i * 10}
              padding="12px 18px"
              glow="rgba(62,224,184,0.15)"
            >
              <div
                style={{
                  color: CYAN,
                  fontFamily: FONT_MONO,
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                {url}
              </div>
            </GlassCard>
          ),
        )}
      </div>
    </AbsoluteFill>
  );
}
