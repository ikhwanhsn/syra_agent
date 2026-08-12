import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { PROBLEM } from "../content/script";
import { ACCENT, FG, MUTED, RED } from "../content/theme";
import { Eyebrow, GlassCard, GradientText } from "../lib/ui";

export function ShotProblem({ start }: { start: number }) {
  const frame = useCurrentFrame();
  const local = frame - start;

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 100,
          right: 100,
          top: 100,
          bottom: 120,
          display: "flex",
          gap: 48,
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1.1 }}>
          <Eyebrow text={PROBLEM.eyebrow} color={RED} />
          <GradientText fontSize={56}>{PROBLEM.title}</GradientText>
          <div
            style={{
              marginTop: 28,
              color: RED,
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "0.08em",
            }}
          >
            RESULT: AGENTS STALL
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          {PROBLEM.items.map((item, i) => {
            const delay = start + 16 + i * 14;
            const fly = interpolate(frame - delay, [0, 20], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const exit = interpolate(local, [150, 190], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const x = 140 * fly + exit * (80 + i * 40);
            const rot = exit * (i - 1) * 12;
            return (
              <div
                key={item.title}
                style={{
                  transform: `translateX(${x}px) rotate(${rot}deg)`,
                  opacity: 1 - exit * 0.85,
                }}
              >
                <GlassCard
                  delay={delay}
                  padding="28px 26px"
                  glow="rgba(255,92,106,0.28)"
                >
                  <div style={{ color: ACCENT, fontSize: 28, fontWeight: 800 }}>
                    {item.title}
                  </div>
                  <div style={{ color: MUTED, fontSize: 20, marginTop: 8 }}>
                    {item.detail}
                  </div>
                </GlassCard>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
}
