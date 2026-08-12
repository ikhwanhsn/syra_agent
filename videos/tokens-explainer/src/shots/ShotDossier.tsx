import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { DOSSIER } from "../content/script";
import { ACCENT, CYAN, FG, FONT_DISPLAY, FONT_MONO, MUTED, SAFE } from "../content/theme";
import { DigitRoll, Eyebrow, GlassCard, GradientText, StatusPill } from "../lib/ui";

/** Shot cards: product-card-progressive-assemble + odometer-digit-roll */
export function ShotDossier({ start }: { start: number }) {
  const frame = useCurrentFrame();
  const local = frame - start;

  const candleCount = 24;
  const candles = Array.from({ length: candleCount }, (_, i) => {
    // Deterministic pseudo heights from index (no Math.random)
    const seed = ((i * 17 + 11) % 23) / 23;
    const h = 28 + seed * 90;
    const up = (i * 3) % 5 !== 0;
    return { h, up };
  });

  const chartReveal = interpolate(local, [40, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "50px 80px 120px",
      }}
    >
      <div style={{ display: "flex", gap: 28, alignItems: "stretch" }}>
        <div style={{ flex: 1.6 }}>
          <Eyebrow text={DOSSIER.eyebrow} />
          <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
            <GradientText fontSize={64}>{DOSSIER.title}</GradientText>
            <span style={{ color: MUTED, fontSize: 26 }}>{DOSSIER.fullName}</span>
            <StatusPill label="SAFE · A" tone="safe" />
          </div>
          <div
            style={{
              marginTop: 8,
              color: MUTED,
              fontFamily: FONT_MONO,
              fontSize: 16,
            }}
          >
            assetId: {DOSSIER.assetId}
          </div>

          <div style={{ display: "flex", gap: 16, marginTop: 24 }}>
            {[
              { label: "Price", value: DOSSIER.price },
              { label: "24h", value: DOSSIER.change24h },
              { label: "MCap", value: DOSSIER.mcap },
              { label: "Volume", value: DOSSIER.volume },
            ].map((m, i) => (
              <GlassCard
                key={m.label}
                delay={start + 16 + i * 10}
                padding="18px 20px"
                style={{ flex: 1 }}
                glow="rgba(243,186,47,0.18)"
              >
                <div style={{ color: MUTED, fontSize: 14, marginBottom: 8 }}>
                  {m.label}
                </div>
                <div
                  style={{
                    color: m.label === "24h" ? CYAN : FG,
                    fontFamily: FONT_DISPLAY,
                    fontSize: 28,
                    fontWeight: 800,
                  }}
                >
                  {m.value}
                </div>
              </GlassCard>
            ))}
          </div>

          <GlassCard
            delay={start + 48}
            padding="22px 24px"
            style={{ marginTop: 18 }}
            glow="rgba(62,224,184,0.15)"
          >
            <div
              style={{
                color: MUTED,
                fontFamily: FONT_MONO,
                fontSize: 13,
                letterSpacing: "0.12em",
                marginBottom: 14,
              }}
            >
              OHLCV · 1H
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 8,
                height: 140,
                clipPath: `inset(0 ${100 - chartReveal * 100}% 0 0)`,
              }}
            >
              {candles.map((c, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: c.h,
                    borderRadius: 3,
                    background: c.up
                      ? `linear-gradient(180deg, ${CYAN}, ${CYAN}88)`
                      : `linear-gradient(180deg, #FF5C6A, #FF5C6A88)`,
                    boxShadow: c.up
                      ? `0 0 10px ${CYAN}44`
                      : "0 0 10px rgba(255,92,106,0.25)",
                  }}
                />
              ))}
            </div>
          </GlassCard>
        </div>

        <div style={{ width: 420, display: "flex", flexDirection: "column", gap: 16 }}>
          <GlassCard
            delay={start + 24}
            padding="28px 26px"
            glow="rgba(62,224,184,0.28)"
          >
            <div style={{ color: MUTED, fontSize: 14, marginBottom: 8 }}>
              Tokens.xyz risk grade
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 20,
                  border: `2px solid ${SAFE}`,
                  background: `${SAFE}18`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: SAFE,
                  fontSize: 48,
                  fontWeight: 800,
                  fontFamily: FONT_DISPLAY,
                  boxShadow: `0 0 28px ${SAFE}55`,
                }}
              >
                {DOSSIER.grade}
              </div>
              <div>
                <div style={{ color: MUTED, fontSize: 14, marginBottom: 6 }}>
                  Score
                </div>
                <DigitRoll
                  value={String(DOSSIER.score)}
                  delay={24}
                  fontSize={42}
                  color={SAFE}
                />
                <div style={{ color: SAFE, fontSize: 14, marginTop: 6 }}>
                  Trusted launch
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard delay={start + 48} padding="22px 22px" glow="rgba(243,186,47,0.16)">
            <div
              style={{
                color: ACCENT,
                fontFamily: FONT_MONO,
                fontSize: 13,
                letterSpacing: "0.1em",
                marginBottom: 12,
              }}
            >
              TOP MARKETS
            </div>
            {DOSSIER.markets.map((m) => (
              <div
                key={m.venue}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  color: FG,
                  fontSize: 18,
                }}
              >
                <span style={{ fontWeight: 700 }}>{m.venue}</span>
                <span style={{ color: MUTED, fontFamily: FONT_MONO, fontSize: 15 }}>
                  {m.liq} · {m.vol}
                </span>
              </div>
            ))}
          </GlassCard>
        </div>
      </div>
    </AbsoluteFill>
  );
}
