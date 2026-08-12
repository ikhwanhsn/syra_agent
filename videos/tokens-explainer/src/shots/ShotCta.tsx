import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CTA } from "../content/script";
import { ACCENT, MUTED } from "../content/theme";
import { GradientText, SyraLogoMark } from "../lib/ui";

/** Shot card: logo-shrink-wordmark-lockup */
export function ShotCta({ start }: { start: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - start;
  const enter = spring({
    frame: local,
    fps,
    config: { damping: 200, stiffness: 115, mass: 0.95 },
  });
  const pulse = 1 + 0.03 * Math.sin(local / 12);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        paddingBottom: 80,
      }}
    >
      <div
        style={{
          opacity: enter,
          transform: `translateY(${(1 - enter) * 24}px)`,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <SyraLogoMark size={110} delay={start} />
        <div style={{ height: 28 }} />
        <div style={{ whiteSpace: "pre-line" }}>
          <GradientText fontSize={64}>{CTA.title}</GradientText>
        </div>
        <div
          style={{
            display: "flex",
            gap: 20,
            marginTop: 40,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              padding: "16px 34px",
              borderRadius: 999,
              background: ACCENT,
              color: "#111",
              fontSize: 24,
              fontWeight: 800,
              transform: `scale(${pulse})`,
              boxShadow: "0 0 36px rgba(243,186,47,0.55)",
            }}
          >
            {CTA.primary}
          </div>
          <div
            style={{
              padding: "16px 34px",
              borderRadius: 999,
              border: `1px solid ${ACCENT}`,
              color: ACCENT,
              fontSize: 24,
              fontWeight: 700,
              boxShadow: "0 0 20px rgba(243,186,47,0.2)",
            }}
          >
            {CTA.secondary}
          </div>
        </div>
        <div
          style={{
            marginTop: 36,
            color: ACCENT,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "0.22em",
            textShadow: "0 0 20px rgba(243,186,47,0.45)",
          }}
        >
          {CTA.badge}
        </div>
        <div style={{ marginTop: 18, color: MUTED, fontSize: 18 }}>
          OSS · 13 tokens tools · 1 agent research path
        </div>
      </div>
    </AbsoluteFill>
  );
}
