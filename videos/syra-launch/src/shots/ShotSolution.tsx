import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { SOLUTION } from "../content/script";
import { ACCENT, CYAN, FG, FONT_MONO, MUTED, VIOLET } from "../content/theme";
import { CountUp, Eyebrow, GlassCard, GradientText } from "../lib/ui";

export function ShotSolution({ start }: { start: number }) {
  const frame = useCurrentFrame();
  const local = frame - start;
  const ring = interpolate(local, [10, 80], [0.6, 1.15], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tones = { gold: ACCENT, cyan: CYAN, violet: VIOLET } as const;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "70px 100px 130px",
      }}
    >
      <div style={{ display: "flex", gap: 48, alignItems: "center" }}>
        <div style={{ flex: 1.3 }}>
          <Eyebrow text={SOLUTION.eyebrow} color={CYAN} />
          <GradientText fontSize={56}>{SOLUTION.title}</GradientText>
          <div
            style={{
              color: MUTED,
              fontSize: 26,
              marginTop: 22,
              lineHeight: 1.45,
              maxWidth: 780,
            }}
          >
            {SOLUTION.body}
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 28 }}>
            {SOLUTION.pillars.map((p, i) => (
              <GlassCard
                key={p.title}
                delay={start + 24 + i * 12}
                padding="18px 18px"
                glow={`${tones[p.tone as keyof typeof tones]}33`}
                style={{ flex: 1 }}
              >
                <div
                  style={{
                    color: tones[p.tone as keyof typeof tones],
                    fontSize: 18,
                    fontWeight: 800,
                  }}
                >
                  {p.title}
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        <GlassCard
          delay={start + 12}
          width={360}
          padding="36px 28px"
          glow="rgba(62,224,184,0.35)"
          style={{ textAlign: "center", position: "relative" }}
        >
          <div
            style={{
              position: "absolute",
              inset: -30,
              borderRadius: "50%",
              border: `2px solid ${CYAN}44`,
              transform: `scale(${ring})`,
              opacity: 0.5,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              color: CYAN,
              fontFamily: FONT_MONO,
              fontSize: 13,
              letterSpacing: "0.16em",
              marginBottom: 12,
            }}
          >
            SAMPLE CALL
          </div>
          <CountUp
            target={0.01}
            delay={start + 30}
            duration={36}
            prefix="$"
            suffix=" USDC"
            decimals={2}
            fontSize={48}
            color={ACCENT}
          />
          <div style={{ color: MUTED, fontSize: 16, marginTop: 14 }}>
            Auto-pay · Solana settle
          </div>
          <div
            style={{
              marginTop: 22,
              padding: "10px 14px",
              borderRadius: 10,
              background: "rgba(0,0,0,0.45)",
              border: `1px solid ${CYAN}44`,
              color: FG,
              fontFamily: FONT_MONO,
              fontSize: 14,
            }}
          >
            HTTP 402 → PAY → 200
          </div>
        </GlassCard>
      </div>
    </AbsoluteFill>
  );
}
