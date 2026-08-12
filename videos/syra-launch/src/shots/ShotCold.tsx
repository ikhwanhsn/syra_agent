import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLD } from "../content/script";
import { FG, MUTED, RED } from "../content/theme";
import { SmashText, useShake } from "../lib/ui";

export function ShotCold() {
  const frame = useCurrentFrame();
  const shake = useShake(14, 12, 8);
  const line2 = interpolate(frame, [28, 42], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const stamp = interpolate(frame, [55, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        transform: `translate(${shake.x}px, ${shake.y}px)`,
      }}
    >
      <SmashText fontSize={78} delay={4}>
        {COLD.line1}
      </SmashText>
      <div style={{ height: 18 }} />
      <div style={{ opacity: line2, transform: `scale(${0.9 + line2 * 0.1})` }}>
        <SmashText fontSize={78} delay={28} color={RED}>
          {COLD.line2}
        </SmashText>
      </div>
      <div
        style={{
          marginTop: 40,
          opacity: stamp,
          padding: "12px 22px",
          border: `2px solid ${RED}`,
          color: RED,
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: "0.18em",
          transform: `rotate(-6deg) scale(${0.8 + stamp * 0.2})`,
          boxShadow: `0 0 30px ${RED}55`,
        }}
      >
        BLOCKED
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 140,
          color: MUTED,
          fontSize: 20,
          opacity: stamp,
        }}
      >
        Until now.
      </div>
    </AbsoluteFill>
  );
}
