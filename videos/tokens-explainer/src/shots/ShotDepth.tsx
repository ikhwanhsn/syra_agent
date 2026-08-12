import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { DEPTH } from "../content/script";
import { ACCENT, CYAN, FG, FONT_DISPLAY, MUTED, WARN } from "../content/theme";
import { CountUp, Eyebrow, GlassCard, GradientText, StatusPill } from "../lib/ui";

/** Shot card: gauge-readout-moves */
export function ShotDepth({ start }: { start: number }) {
  const frame = useCurrentFrame();
  const local = frame - start;
  const gauge = interpolate(local, [30, 90], [0, DEPTH.alpha], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sweep = (gauge / 100) * 220 - 110;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "60px 90px 130px",
      }}
    >
      <div style={{ display: "flex", gap: 40, alignItems: "center" }}>
        <div style={{ flex: 1.2 }}>
          <Eyebrow text={DEPTH.eyebrow} color={WARN} />
          <GradientText fontSize={48}>{DEPTH.title}</GradientText>
          <div
            style={{
              color: MUTED,
              fontSize: 22,
              marginTop: 20,
              lineHeight: 1.45,
              maxWidth: 760,
            }}
          >
            {DEPTH.body}
          </div>
          <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
            <StatusPill label="TOKENS.XYZ GRADE" tone="warn" />
            <StatusPill label="ON-CHAIN AUTHORITY" tone="safe" />
          </div>
        </div>

        <GlassCard
          delay={start + 16}
          width={380}
          padding="36px 28px"
          glow="rgba(243,186,47,0.28)"
          style={{ textAlign: "center" }}
        >
          <div style={{ color: MUTED, fontSize: 14, marginBottom: 8 }}>
            Syra Alpha score
          </div>
          <div style={{ position: "relative", height: 180, marginBottom: 8 }}>
            <svg width="320" height="180" viewBox="0 0 320 180">
              <path
                d="M40 150 A120 120 0 0 1 280 150"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="16"
                strokeLinecap="round"
              />
              <path
                d="M40 150 A120 120 0 0 1 280 150"
                fill="none"
                stroke={ACCENT}
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray={`${(gauge / 100) * 377} 377`}
                style={{ filter: `drop-shadow(0 0 10px ${ACCENT})` }}
              />
              <line
                x1="160"
                y1="150"
                x2="160"
                y2="50"
                stroke={FG}
                strokeWidth="3"
                transform={`rotate(${sweep} 160 150)`}
              />
              <circle cx="160" cy="150" r="8" fill={ACCENT} />
            </svg>
          </div>
          <CountUp
            target={DEPTH.alpha}
            delay={start + 40}
            duration={40}
            fontSize={56}
            color={ACCENT}
          />
          <div style={{ color: WARN, fontSize: 18, fontWeight: 700, marginTop: 6 }}>
            Watch
          </div>
        </GlassCard>
      </div>

      <div
        style={{
          marginTop: 28,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: 16,
        }}
      >
        {DEPTH.checks.map((c, i) => (
          <GlassCard
            key={c.label}
            delay={start + 16 + i * 14}
            padding="20px 18px"
            glow={
              i === 3 ? "rgba(243,186,47,0.25)" : "rgba(62,224,184,0.16)"
            }
          >
            <div style={{ color: MUTED, fontSize: 13, marginBottom: 8 }}>
              {c.label}
            </div>
            <div
              style={{
                color: i === 0 || i === 3 ? WARN : CYAN,
                fontSize: 20,
                fontWeight: 700,
                fontFamily: FONT_DISPLAY,
              }}
            >
              {c.value}
            </div>
          </GlassCard>
        ))}
      </div>
    </AbsoluteFill>
  );
}
