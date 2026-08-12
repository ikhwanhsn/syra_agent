import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { PROBLEM } from "../content/script";
import { ACCENT, FG, MUTED, RED } from "../content/theme";
import { Eyebrow, GlassCard, GradientText } from "../lib/ui";

/** Shot cards: fracture + card scatter */
export function ShotProblem({ start }: { start: number }) {
  const frame = useCurrentFrame();
  const local = frame - start;

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 90,
          right: 90,
          top: 90,
          bottom: 120,
          display: "flex",
          gap: 48,
        }}
      >
        <div
          style={{
            flex: 1.1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            maxWidth: 860,
          }}
        >
          <Eyebrow text={PROBLEM.eyebrow} color={RED} />
          <div style={{ whiteSpace: "pre-line" }}>
            <GradientText fontSize={52}>{PROBLEM.title}</GradientText>
          </div>
          <div
            style={{
              color: MUTED,
              fontSize: 24,
              marginTop: 24,
              lineHeight: 1.5,
              maxWidth: 720,
            }}
          >
            {PROBLEM.body}
          </div>
          <div
            style={{
              marginTop: 28,
              display: "inline-flex",
              alignSelf: "flex-start",
              padding: "14px 18px",
              borderRadius: 12,
              border: `1px solid ${RED}55`,
              background: `${RED}14`,
              color: RED,
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            Result: agents stall before the decision
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 18,
            alignContent: "center",
          }}
        >
          {PROBLEM.fragments.map((item, i) => {
            const delay = start + 24 + i * 16;
            const shatter = interpolate(local, [20 + i * 8, 80 + i * 8], [18, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const rot = ((i % 2 === 0 ? 1 : -1) * shatter) / 4;
            return (
              <div
                key={item.label}
                style={{
                  transform: `translate(${(i % 2 === 0 ? -1 : 1) * shatter}px, ${shatter}px) rotate(${rot}deg)`,
                }}
              >
                <GlassCard
                  delay={delay}
                  padding="26px 22px"
                  glow={i === 2 ? "rgba(255,92,106,0.25)" : "rgba(243,186,47,0.18)"}
                >
                  <div
                    style={{
                      color: i === 2 ? RED : ACCENT,
                      fontSize: 22,
                      fontWeight: 800,
                      marginBottom: 10,
                    }}
                  >
                    {item.label}
                  </div>
                  <div style={{ color: MUTED, fontSize: 18, lineHeight: 1.4 }}>
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
