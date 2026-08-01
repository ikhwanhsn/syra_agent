/**
 * Shared Remotion primitives for WhatIsSyra landscape + vertical compositions.
 * Rich cinematic look: mesh bg, particles, glow cards, count-ups, flow lines.
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
export const VIOLET = "#A78BFA";
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

/** Soft radial glow behind focal elements. */
export function AccentGlow({
  color = GOLD,
  size = 420,
  x = "50%",
  y = "40%",
  opacity = 0.45,
}: {
  color?: string;
  size?: number;
  x?: number | string;
  y?: number | string;
  opacity?: number;
}) {
  const frame = useCurrentFrame();
  const pulse = 0.85 + 0.15 * Math.sin(frame / 28);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color} 0%, transparent 68%)`,
        opacity: opacity * pulse,
        filter: "blur(2px)",
        pointerEvents: "none",
      }}
    />
  );
}

const PARTICLE_SEEDS = Array.from({ length: 24 }, (_, i) => ({
  x: ((i * 97) % 100) / 100,
  y: ((i * 53) % 100) / 100,
  size: 2 + (i % 4),
  speed: 0.4 + (i % 5) * 0.15,
  phase: i * 1.7,
  color: i % 3 === 0 ? GOLD : i % 3 === 1 ? CYAN : VIOLET,
}));

export function Particles() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      {PARTICLE_SEEDS.map((p, i) => {
        const driftY = Math.sin((frame + p.phase * 10) / (40 / p.speed)) * 18;
        const driftX = Math.cos((frame + p.phase * 8) / (55 / p.speed)) * 12;
        const twinkle = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin((frame + p.phase * 20) / 22));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `calc(${p.x * 100}% + ${driftX}px)`,
              top: `calc(${p.y * 100}% + ${driftY}px)`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: p.color,
              opacity: twinkle,
              boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
}

export function Background() {
  const frame = useCurrentFrame();
  const pulse = 0.5 + 0.5 * Math.sin(frame / 40);
  const drift1 = Math.sin(frame / 90) * 6;
  const drift2 = Math.cos(frame / 110) * 8;
  const sheen = ((frame * 0.35) % 140) - 20;
  const gridX = (frame * 0.15) % 48;
  const gridY = (frame * 0.08) % 48;

  return (
    <AbsoluteFill style={{ backgroundColor: BG, overflow: "hidden" }}>
      {/* Mesh blobs */}
      <div
        style={{
          position: "absolute",
          width: "70%",
          height: "60%",
          left: `${18 + drift1}%`,
          top: `${-8 + drift2}%`,
          background: `radial-gradient(ellipse, rgba(243,186,47,${0.14 + pulse * 0.04}), transparent 70%)`,
          transform: "translate(-50%, 0)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "55%",
          height: "50%",
          right: `${-5 + drift2}%`,
          bottom: `${5 + drift1}%`,
          background: `radial-gradient(ellipse, rgba(62,224,184,${0.1 + pulse * 0.03}), transparent 68%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "40%",
          height: "40%",
          left: `${55 + drift1 * 0.5}%`,
          top: `${45 + drift2 * 0.4}%`,
          background: `radial-gradient(ellipse, rgba(167,139,250,${0.08 + pulse * 0.02}), transparent 70%)`,
        }}
      />

      {/* Dot grid with parallax */}
      <div
        style={{
          position: "absolute",
          inset: -48,
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.11) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          backgroundPosition: `${gridX}px ${gridY}px`,
          opacity: 0.35,
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 40%, black 20%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 70% at 50% 40%, black 20%, transparent 75%)",
        }}
      />

      {/* Diagonal sheen */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `${sheen}%`,
          width: "28%",
          background:
            "linear-gradient(105deg, transparent, rgba(255,255,255,0.03), transparent)",
          transform: "skewX(-18deg)",
          pointerEvents: "none",
        }}
      />

      <Particles />

      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 75% 70% at 50% 45%, transparent 40%, rgba(0,0,0,0.55) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Film grain (cheap CSS noise via repeating gradient) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.04,
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 2px), repeating-linear-gradient(90deg, rgba(0,0,0,0.03) 0 1px, transparent 1px 3px)",
          pointerEvents: "none",
        }}
      />

      {/* Top accent line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${GOLD}, ${CYAN}, transparent)`,
          opacity: 0.35,
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
        textShadow: `0 0 24px ${color}55`,
      }}
    >
      {text}
    </div>
  );
}

/** Animated gold-to-white gradient sweep for titles. */
export function GradientText({
  children,
  fontSize = 64,
  fontWeight = 850,
  style,
}: {
  children: ReactNode;
  fontSize?: number;
  fontWeight?: number;
  style?: CSSProperties;
}) {
  const frame = useCurrentFrame();
  const shift = (frame * 1.2) % 200;
  return (
    <div
      style={{
        fontSize,
        fontWeight,
        letterSpacing: "-0.04em",
        lineHeight: 1.08,
        fontFamily: FONT,
        backgroundImage: `linear-gradient(105deg, ${FG} 0%, ${GOLD} ${30 + shift * 0.1}%, ${FG} 70%, ${CYAN} 100%)`,
        backgroundSize: "200% 100%",
        backgroundPosition: `${shift}% 0`,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Animate a number from 0 to target with an optional suffix. */
export function CountUp({
  target,
  delay = 0,
  duration = 36,
  suffix = "",
  prefix = "",
  fontSize = 42,
  color = GOLD,
  decimals = 0,
}: {
  target: number;
  delay?: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  fontSize?: number;
  color?: string;
  decimals?: number;
}) {
  const frame = useCurrentFrame();
  const progress = interpolate(frame - delay, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const value = target * progress;
  const display =
    decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString();
  return (
    <div
      style={{
        color,
        fontSize,
        fontWeight: 850,
        letterSpacing: "-0.03em",
        fontFamily: FONT,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {prefix}
      {display}
      {suffix}
    </div>
  );
}

export function GlassCard({
  children,
  delay,
  width,
  padding = "28px 30px",
  style,
  glow,
}: {
  children: ReactNode;
  delay: number;
  width?: number | string;
  padding?: string;
  style?: CSSProperties;
  glow?: string;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200, stiffness: 125, mass: 0.85 },
  });
  const sheenX = interpolate(frame - delay, [0, 40], [-40, 140], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const glowColor = glow ?? "rgba(243,186,47,0.25)";
  return (
    <div
      style={{
        position: "relative",
        width,
        padding,
        borderRadius: 22,
        background:
          "linear-gradient(165deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 55%, rgba(255,255,255,0.01) 100%)",
        border: "1px solid transparent",
        backgroundClip: "padding-box",
        boxShadow: `0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1), 0 0 40px ${glowColor}`,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 28}px) scale(${0.96 + enter * 0.04})`,
        fontFamily: FONT,
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Gradient hairline via inset overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 22,
          padding: 1,
          background: `linear-gradient(135deg, rgba(255,255,255,0.35), rgba(243,186,47,0.25), rgba(62,224,184,0.2), rgba(255,255,255,0.05))`,
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          pointerEvents: "none",
        }}
      />
      {/* Inner top highlight */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 16,
          right: 16,
          height: 1,
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
          opacity: 0.7,
          pointerEvents: "none",
        }}
      />
      {/* Enter sheen sweep */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `${sheenX}%`,
          width: "30%",
          background:
            "linear-gradient(105deg, transparent, rgba(255,255,255,0.08), transparent)",
          pointerEvents: "none",
          opacity: enter > 0.3 && enter < 1 ? 1 : 0,
        }}
      />
      <div style={{ position: "relative" }}>{children}</div>
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
        boxShadow: `0 0 18px ${color}55`,
        background: `${color}14`,
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
        position: "relative",
        width: size,
        height: size,
      }}
    >
      <AccentGlow
        size={size * 2.2}
        x={size / 2}
        y={size / 2}
        opacity={0.5 * enter}
      />
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.22)",
          boxShadow: `0 0 40px rgba(243,186,47,${0.35 * enter}), 0 0 0 1px rgba(243,186,47,0.2)`,
          opacity: enter,
          transform: `scale(${0.86 + enter * 0.14})`,
          background: "#000",
          position: "relative",
        }}
      >
        <Img
          src={staticFile("images/logo.jpg")}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </div>
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
    <GlassCard delay={delay} width={width} padding="24px 26px" glow="rgba(62,224,184,0.2)">
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

/**
 * Animated connector line for the 4-step x402 pipeline.
 * Spans full width between cards; traveler dot moves left to right.
 */
export function FlowConnector({
  delay = 0,
  top = 0,
  left = 80,
  right = 80,
}: {
  delay?: number;
  top?: number;
  left?: number;
  right?: number;
}) {
  const frame = useCurrentFrame();
  const progress = interpolate(frame - delay, [0, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const dashOffset = -((frame - delay) * 2);
  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        right,
        height: 4,
        opacity: interpolate(frame - delay, [0, 12], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 4,
          background: "rgba(255,255,255,0.08)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: "100%",
          width: `${progress * 100}%`,
          borderRadius: 4,
          background: `linear-gradient(90deg, ${GOLD}, ${CYAN})`,
          boxShadow: `0 0 12px ${CYAN}88`,
        }}
      />
      {/* Dashed overlay for motion */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `repeating-linear-gradient(90deg, transparent 0 10px, rgba(255,255,255,0.15) 10px 16px)`,
          backgroundPositionX: dashOffset,
          opacity: 0.5,
        }}
      />
      {/* Traveler */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: `${progress * 100}%`,
          width: 14,
          height: 14,
          marginTop: -7,
          marginLeft: -7,
          borderRadius: "50%",
          background: FG,
          boxShadow: `0 0 18px ${CYAN}, 0 0 36px ${GOLD}`,
        }}
      />
    </div>
  );
}
