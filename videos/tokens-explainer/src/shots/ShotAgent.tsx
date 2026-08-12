import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { AGENT } from "../content/script";
import { ACCENT, CYAN, FG, FONT_MONO, MUTED } from "../content/theme";
import { Eyebrow, GlassCard, GradientText } from "../lib/ui";

/** Shot cards: integration-hub-map + flow connector */
export function ShotAgent({ start }: { start: number }) {
  const frame = useCurrentFrame();
  const local = frame - start;
  const line = interpolate(local, [20, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "60px 80px 130px",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <Eyebrow text={AGENT.eyebrow} color={CYAN} />
        <GradientText fontSize={48}>{AGENT.title}</GradientText>
      </div>

      <div style={{ position: "relative", marginBottom: 28 }}>
        <div
          style={{
            position: "absolute",
            top: 48,
            left: 80,
            right: 80,
            height: 3,
            background: `linear-gradient(90deg, ${ACCENT}, ${CYAN})`,
            transformOrigin: "left center",
            transform: `scaleX(${line})`,
            boxShadow: `0 0 16px ${ACCENT}88`,
            borderRadius: 2,
          }}
        />
        <div style={{ display: "flex", gap: 18, justifyContent: "space-between" }}>
          {AGENT.flow.map((step, i) => (
            <GlassCard
              key={step.step}
              delay={start + 16 + i * 18}
              width={400}
              padding="28px 22px"
              glow={i === 3 ? "rgba(62,224,184,0.28)" : "rgba(243,186,47,0.18)"}
              style={{ flex: 1 }}
            >
              <div
                style={{
                  color: ACCENT,
                  fontFamily: FONT_MONO,
                  fontSize: 16,
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                {step.step}
              </div>
              <div style={{ color: FG, fontSize: 28, fontWeight: 800, marginBottom: 10 }}>
                {step.title}
              </div>
              <div style={{ color: MUTED, fontSize: 18, lineHeight: 1.4 }}>
                {step.detail}
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
        {AGENT.tools.map((tool, i) => (
          <GlassCard
            key={tool}
            delay={start + 24 + i * 12}
            padding="12px 16px"
            glow="rgba(62,224,184,0.16)"
          >
            <div
              style={{
                color: CYAN,
                fontFamily: FONT_MONO,
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              {tool}
            </div>
          </GlassCard>
        ))}
      </div>

      <div
        style={{
          marginTop: 24,
          textAlign: "center",
          color: MUTED,
          fontSize: 20,
        }}
      >
        {AGENT.note}
      </div>
    </AbsoluteFill>
  );
}
