import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CTA } from "../content/script";
import { ACCENT, MUTED } from "../content/theme";
import { SmashText, SyraLogoMark, useShake } from "../lib/ui";

export function ShotCta({ start }: { start: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - start;
  const enter = spring({
    frame: local,
    fps,
    config: { damping: 14, stiffness: 130, mass: 0.75 },
  });
  const shake = useShake(12, 12, start + 8);
  const pulse = 1 + 0.04 * Math.sin(local / 10);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        transform: `translate(${shake.x}px, ${shake.y}px)`,
        paddingBottom: 60,
      }}
    >
      <div
        style={{
          opacity: enter,
          transform: `translateY(${(1 - enter) * 30}px)`,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <SyraLogoMark size={120} delay={start} />
        <div style={{ height: 24 }} />
        <SmashText fontSize={88} delay={start + 8} color={ACCENT}>
          {CTA.title}
        </SmashText>
        <div
          style={{
            color: MUTED,
            fontSize: 28,
            marginTop: 18,
            marginBottom: 34,
          }}
        >
          {CTA.subtitle}
        </div>
        <div style={{ display: "flex", gap: 18 }}>
          <div
            style={{
              padding: "18px 36px",
              borderRadius: 999,
              background: ACCENT,
              color: "#111",
              fontSize: 26,
              fontWeight: 800,
              transform: `scale(${pulse})`,
              boxShadow: "0 0 42px rgba(243,186,47,0.65)",
            }}
          >
            {CTA.primary}
          </div>
          <div
            style={{
              padding: "18px 36px",
              borderRadius: 999,
              border: `1px solid ${ACCENT}`,
              color: ACCENT,
              fontSize: 26,
              fontWeight: 700,
              boxShadow: "0 0 24px rgba(243,186,47,0.25)",
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
            fontWeight: 800,
            letterSpacing: "0.28em",
            textShadow: "0 0 24px rgba(243,186,47,0.5)",
          }}
        >
          {CTA.badge}
        </div>
      </div>
    </AbsoluteFill>
  );
}
