import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  ACCENT,
  ACCENT_SOFT,
  BG,
  CARD,
  CARD_BORDER,
  CYAN,
  FG,
  FONT,
  FONT_DISPLAY,
  FONT_MONO,
  MUTED,
} from "../content/theme";

/** Deterministic screen shake for impact frames. */
export function useShake(intensity = 10, duration = 10, start = 0) {
  const frame = useCurrentFrame();
  const t = frame - start;
  if (t < 0 || t > duration) return { x: 0, y: 0 };
  const fall = 1 - t / duration;
  // Fixed pseudo-random from frame index
  const sx = Math.sin(t * 12.9898) * 43758.5453;
  const sy = Math.sin(t * 78.233) * 43758.5453;
  const rx = (sx - Math.floor(sx)) * 2 - 1;
  const ry = (sy - Math.floor(sy)) * 2 - 1;
  return { x: rx * intensity * fall, y: ry * intensity * fall };
}

export function Background({ energy = 1 }: { energy?: number }) {
  const frame = useCurrentFrame();
  const pulse = 0.55 + 0.45 * Math.sin(frame / 18);
  return (
    <AbsoluteFill style={{ backgroundColor: BG, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: -100,
          background: `
            radial-gradient(ellipse 55% 45% at 50% 35%, rgba(243,186,47,${0.16 * energy * pulse}), transparent 60%),
            radial-gradient(ellipse 40% 35% at 15% 80%, rgba(62,224,184,${0.1 * energy}), transparent 55%),
            radial-gradient(ellipse 40% 35% at 85% 20%, rgba(167,139,250,${0.1 * energy}), transparent 55%)
          `,
        }}
      />
      {/* orbiting sparks */}
      {Array.from({ length: 18 }).map((_, i) => {
        const a = (i / 18) * Math.PI * 2 + frame / 40;
        const r = 220 + (i % 5) * 70;
        const x = 960 + Math.cos(a) * r;
        const y = 540 + Math.sin(a * 0.85) * (r * 0.45);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 3 + (i % 3),
              height: 3 + (i % 3),
              borderRadius: "50%",
              background: i % 3 === 0 ? ACCENT : i % 3 === 1 ? CYAN : "#A78BFA",
              opacity: 0.25 + (i % 4) * 0.08,
              boxShadow: `0 0 10px ${i % 3 === 0 ? ACCENT : CYAN}`,
            }}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          opacity: 0.35,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: "inset 0 0 200px rgba(0,0,0,0.7)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
}

export function Scene({
  from,
  to,
  children,
}: {
  from: number;
  to: number;
  children: React.ReactNode;
}) {
  const frame = useCurrentFrame();
  if (frame < from || frame >= to) return null;
  const opacity = interpolate(
    frame,
    [from, from + 6, to - 8, to],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return (
    <AbsoluteFill style={{ fontFamily: FONT, opacity }}>{children}</AbsoluteFill>
  );
}

export function Eyebrow({
  text,
  color = ACCENT,
}: {
  text: string;
  color?: string;
}) {
  return (
    <div
      style={{
        color,
        fontFamily: FONT_MONO,
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: "0.28em",
        marginBottom: 16,
      }}
    >
      {text}
    </div>
  );
}

export function SmashText({
  children,
  fontSize = 96,
  delay = 0,
  color,
}: {
  children: React.ReactNode;
  fontSize?: number;
  delay?: number;
  color?: string;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - delay,
    fps,
    config: { damping: 14, stiffness: 160, mass: 0.7 },
  });
  const scale = interpolate(enter, [0, 1], [1.55, 1]);
  return (
    <div
      style={{
        fontFamily: FONT_DISPLAY,
        fontSize,
        fontWeight: 800,
        letterSpacing: "-0.04em",
        lineHeight: 0.95,
        color: color ?? FG,
        opacity: Math.min(1, enter * 1.2),
        transform: `scale(${scale})`,
        textShadow: color
          ? `0 0 40px ${color}88`
          : "0 0 40px rgba(243,186,47,0.35)",
      }}
    >
      {children}
    </div>
  );
}

export function GradientText({
  children,
  fontSize = 64,
}: {
  children: React.ReactNode;
  fontSize?: number;
}) {
  return (
    <div
      style={{
        fontFamily: FONT_DISPLAY,
        fontSize,
        fontWeight: 800,
        letterSpacing: "-0.03em",
        lineHeight: 1.05,
        background: `linear-gradient(135deg, ${FG} 10%, ${ACCENT} 90%)`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}
    >
      {children}
    </div>
  );
}

export function GlassCard({
  delay,
  children,
  width,
  padding = "26px 24px",
  glow = ACCENT_SOFT,
  style,
}: {
  delay: number;
  children: React.ReactNode;
  width?: number | string;
  padding?: string;
  glow?: string;
  style?: React.CSSProperties;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - delay,
    fps,
    config: { damping: 16, stiffness: 140, mass: 0.75 },
  });
  return (
    <div
      style={{
        width,
        padding,
        borderRadius: 18,
        border: `1px solid ${CARD_BORDER}`,
        background: CARD,
        boxShadow: `0 0 48px ${glow}, 0 20px 48px rgba(0,0,0,0.4)`,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 40}px) scale(${0.88 + enter * 0.12})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function SyraLogoMark({
  size = 120,
  delay = 0,
}: {
  size?: number;
  delay?: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 120, mass: 0.8 },
  });
  return (
    <div
      style={{
        opacity: enter,
        transform: `scale(${0.4 + enter * 0.6})`,
        filter: "drop-shadow(0 0 36px rgba(243,186,47,0.65))",
      }}
    >
      <Img
        src={staticFile("images/logo.png")}
        style={{ width: size, height: size, objectFit: "contain" }}
      />
    </div>
  );
}

export function CaptionBar({
  text,
  duration,
}: {
  text: string;
  duration: number;
}) {
  const frame = useCurrentFrame();
  const inT = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const outT = interpolate(frame, [duration - 8, duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 48,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
        fontFamily: FONT_MONO,
        fontSize: 18,
        letterSpacing: "0.06em",
        color: FG,
        opacity: inT * outT,
        transform: `translateY(${(1 - inT) * 12}px)`,
        textShadow: "0 2px 20px rgba(0,0,0,0.9)",
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 2,
          background: ACCENT,
          boxShadow: `0 0 14px ${ACCENT}`,
        }}
      />
      <span style={{ fontWeight: 600 }}>{text}</span>
    </div>
  );
}

export function CountUp({
  target,
  delay,
  duration = 28,
  prefix = "",
  suffix = "",
  decimals = 0,
  fontSize = 40,
  color = ACCENT,
}: {
  target: number;
  delay: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  fontSize?: number;
  color?: string;
}) {
  const frame = useCurrentFrame();
  const t = interpolate(frame - delay, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <span
      style={{
        fontFamily: FONT_DISPLAY,
        fontSize,
        fontWeight: 800,
        color,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {prefix}
      {(target * t).toFixed(decimals)}
      {suffix}
    </span>
  );
}

export { FlashCut } from "./FlashCut";
