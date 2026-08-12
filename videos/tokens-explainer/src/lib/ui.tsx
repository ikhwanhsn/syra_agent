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
  FG,
  FONT,
  FONT_DISPLAY,
  FONT_MONO,
  MUTED,
} from "../content/theme";

export function Background() {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 48) * 8;
  return (
    <AbsoluteFill style={{ backgroundColor: BG, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: -80,
          background: `
            radial-gradient(ellipse 70% 50% at 20% 20%, rgba(243,186,47,0.12), transparent 55%),
            radial-gradient(ellipse 60% 45% at 80% 70%, rgba(62,224,184,0.08), transparent 50%),
            radial-gradient(ellipse 50% 40% at 50% 100%, rgba(167,139,250,0.06), transparent 45%)
          `,
          transform: `translateY(${drift}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          opacity: 0.5,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: "inset 0 0 180px rgba(0,0,0,0.65)",
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
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      {children}
    </AbsoluteFill>
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
        fontSize: 16,
        fontWeight: 700,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        marginBottom: 18,
      }}
    >
      {text}
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
        fontWeight: 700,
        letterSpacing: "-0.03em",
        lineHeight: 1.08,
        background: `linear-gradient(135deg, ${FG} 0%, ${ACCENT} 100%)`,
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
  padding = "28px 26px",
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
    config: { damping: 200, stiffness: 120, mass: 0.9 },
  });
  return (
    <div
      style={{
        width,
        padding,
        borderRadius: 18,
        border: `1px solid ${CARD_BORDER}`,
        background: CARD,
        boxShadow: `0 0 40px ${glow}, 0 18px 40px rgba(0,0,0,0.35)`,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 28}px) scale(${0.96 + enter * 0.04})`,
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
    config: { damping: 180, stiffness: 100, mass: 1 },
  });
  const glow = 0.35 + 0.15 * Math.sin(frame / 14);
  return (
    <div
      style={{
        opacity: enter,
        transform: `scale(${0.7 + enter * 0.3})`,
        filter: `drop-shadow(0 0 ${28 * glow}px rgba(243,186,47,0.55))`,
      }}
    >
      <Img
        src={staticFile("images/logo.png")}
        style={{ width: size, height: size, objectFit: "contain" }}
      />
    </div>
  );
}

export function CountUp({
  target,
  delay,
  duration = 36,
  prefix = "",
  suffix = "",
  decimals = 0,
  fontSize = 36,
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
  const value = target * t;
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
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/** Adapted Caption: Syra dark, readable info strip. */
export function CaptionBar({
  text,
  duration,
  bottom = 56,
}: {
  text: string;
  duration: number;
  bottom?: number;
}) {
  const frame = useCurrentFrame();
  const inT = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const outT = interpolate(frame, [duration - 10, duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 14,
        fontFamily: FONT_MONO,
        fontSize: 20,
        letterSpacing: "0.08em",
        color: MUTED,
        opacity: inT * outT,
        transform: `translateY(${(1 - inT) * 10}px)`,
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 2,
          background: ACCENT,
          boxShadow: `0 0 12px ${ACCENT}`,
        }}
      />
      <span style={{ color: FG, fontWeight: 600 }}>{text}</span>
    </div>
  );
}

export function StatusPill({
  label,
  tone = "safe",
}: {
  label: string;
  tone?: "safe" | "warn" | "danger";
}) {
  const color =
    tone === "safe" ? "#3EE0B8" : tone === "warn" ? ACCENT : "#FF5C6A";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 14px",
        borderRadius: 999,
        border: `1px solid ${color}66`,
        background: `${color}18`,
        color,
        fontSize: 16,
        fontWeight: 700,
        fontFamily: FONT_MONO,
        letterSpacing: "0.06em",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 8px ${color}`,
        }}
      />
      {label}
    </span>
  );
}

export { DigitRoll } from "../lib/DigitRoll";
export { FlashCut } from "../lib/FlashCut";
