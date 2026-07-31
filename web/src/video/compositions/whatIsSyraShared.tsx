/**
 * Shared Remotion primitives for WhatIsSyra landscape + vertical compositions.
 */
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
import type { CSSProperties, ReactNode } from "react";
import { SYRA_VIDEO_THEME } from "@/video/style/theme";

export const BG = SYRA_VIDEO_THEME.bg;
export const FG = SYRA_VIDEO_THEME.fg;
export const MUTED = SYRA_VIDEO_THEME.muted;
export const GOLD = SYRA_VIDEO_THEME.accent;
export const CYAN = "#3EE0B8";
export const RED = "#FF5C6A";
export const FONT = "Inter, system-ui, sans-serif";

export function clamp(
  frame: number,
  inRange: [number, number],
  outRange: [number, number],
) {
  return interpolate(frame, inRange, outRange, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
}

export function Scene({
  from,
  to,
  children,
}: {
  from: number;
  to: number;
  children: ReactNode;
}) {
  const frame = useCurrentFrame();
  if (frame < from - 8 || frame > to + 8) return null;
  const opacity = interpolate(
    frame,
    [from, from + 12, to - 10, to],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return (
    <AbsoluteFill style={{ opacity, pointerEvents: "none" }}>{children}</AbsoluteFill>
  );
}

export function Caption({
  text,
  from,
  to,
  bottom = 56,
  fontSize = 28,
  sidePad = 80,
}: {
  text: string;
  from: number;
  to: number;
  bottom?: number;
  fontSize?: number;
  sidePad?: number;
}) {
  const frame = useCurrentFrame();
  if (frame < from || frame > to) return null;
  const opacity = clamp(frame, [from, from + 10], [0, 1]);
  return (
    <div
      style={{
        position: "absolute",
        left: sidePad,
        right: sidePad,
        bottom,
        opacity,
        textAlign: "center",
        fontFamily: FONT,
        fontSize,
        fontWeight: 600,
        color: "rgba(255,255,255,0.88)",
        letterSpacing: "-0.01em",
        textShadow: "0 2px 24px rgba(0,0,0,0.85)",
        lineHeight: 1.35,
      }}
    >
      {text}
    </div>
  );
}

export function Background() {
  const frame = useCurrentFrame();
  const pulse = 0.5 + 0.5 * Math.sin(frame / 40);
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 80% 55% at 50% 0%, rgba(243,186,47,${0.07 + pulse * 0.03}), transparent 70%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 60% 50% at 80% 80%, rgba(62,224,184,0.05), transparent 65%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: GOLD,
          opacity: 0.22,
        }}
      />
    </AbsoluteFill>
  );
}

export function Eyebrow({
  text,
  color = GOLD,
  fontSize = 20,
}: {
  text: string;
  color?: string;
  fontSize?: number;
}) {
  return (
    <div
      style={{
        color,
        fontSize,
        fontWeight: 700,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        marginBottom: 18,
      }}
    >
      {text}
    </div>
  );
}

export function GlassCard({
  children,
  delay,
  width,
  padding = "28px 30px",
  style,
}: {
  children: ReactNode;
  delay: number;
  width?: number | string;
  padding?: string;
  style?: CSSProperties;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200, stiffness: 125, mass: 0.85 },
  });
  return (
    <div
      style={{
        width,
        padding,
        borderRadius: 22,
        background:
          "linear-gradient(165deg, rgba(255,255,255,0.09), rgba(255,255,255,0.02))",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        opacity: enter,
        transform: `translateY(${(1 - enter) * 28}px)`,
        fontFamily: FONT,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function StatusPill({
  status,
}: {
  status: "Live" | "Beta" | "Infra" | "Roadmap";
}) {
  const color =
    status === "Live"
      ? CYAN
      : status === "Beta"
        ? GOLD
        : status === "Infra"
          ? FG
          : MUTED;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "6px 14px",
        borderRadius: 999,
        border: `1px solid ${color}`,
        color,
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      {status}
    </span>
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
    config: { damping: 200, stiffness: 120, mass: 0.9 },
  });
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.18)",
        boxShadow: "0 0 40px rgba(243,186,47,0.25)",
        opacity: enter,
        transform: `scale(${0.86 + enter * 0.14})`,
        background: "#000",
      }}
    >
      <Img
        src={staticFile("images/logo.jpg")}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </div>
  );
}

export function FlowStepCard({
  step,
  title,
  detail,
  delay,
  width = 400,
}: {
  step: string;
  title: string;
  detail: string;
  delay: number;
  width?: number;
}) {
  return (
    <GlassCard delay={delay} width={width} padding="24px 26px">
      <div
        style={{
          color: GOLD,
          fontSize: 32,
          fontWeight: 850,
          letterSpacing: "-0.03em",
          marginBottom: 10,
        }}
      >
        {step}
      </div>
      <div
        style={{
          color: FG,
          fontSize: 24,
          fontWeight: 750,
          letterSpacing: "-0.02em",
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      <div style={{ color: MUTED, fontSize: 18, lineHeight: 1.4 }}>{detail}</div>
    </GlassCard>
  );
}
