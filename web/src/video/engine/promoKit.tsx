/**
 * Shared cinematic promo primitives — quality floor for Syra launch videos.
 * Gold reference consumer: compositions/LlmExchangePromo.tsx
 * Standards: web/src/video/QUALITY_BAR.md
 */
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { CSSProperties, ReactNode } from "react";
import { SYRA_VIDEO_THEME } from "@/video/style/theme";

export const PROMO_BG = SYRA_VIDEO_THEME.bg;
export const PROMO_FG = SYRA_VIDEO_THEME.fg;
export const PROMO_MUTED = SYRA_VIDEO_THEME.muted;
export const PROMO_GOLD = SYRA_VIDEO_THEME.accent;
export const PROMO_FONT = "Inter, system-ui, sans-serif";
export const PROMO_DISPLAY = '"Space Grotesk", Inter, system-ui, sans-serif';
export const PROMO_MONO = '"JetBrains Mono", ui-monospace, monospace';

export const PROMO_PAD_X = 96;
export const PROMO_PAD_TOP = 64;
export const PROMO_CAPTION_ZONE = 110;
export const PROMO_BODY_BOTTOM = PROMO_CAPTION_ZONE + 24;

/** Deterministic pseudo-random from index (never Math.random in Remotion). */
export function promoHash01(i: number): number {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function promoClamp(
  frame: number,
  inRange: [number, number],
  outRange: [number, number],
  easing: (t: number) => number = Easing.bezier(0, 0, 0.2, 1),
) {
  return interpolate(frame, inRange, outRange, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });
}

export function promoEnterSpring(
  frame: number,
  delay: number,
  fps: number,
  mass = 0.85,
) {
  return spring({
    frame: frame - delay,
    fps,
    config: { damping: 18, stiffness: 140, mass },
  });
}

export function PromoScene({
  from,
  to,
  children,
}: {
  from: number;
  to: number;
  children: ReactNode;
}) {
  const frame = useCurrentFrame();
  if (frame < from - 10 || frame > to + 10) return null;
  const opacity = interpolate(
    frame,
    [from, from + 14, to - 12, to],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const scale = interpolate(
    frame,
    [from, from + 16, to - 12, to],
    [0.985, 1, 1, 1.012],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return (
    <AbsoluteFill
      style={{
        opacity,
        transform: `scale(${scale})`,
        pointerEvents: "none",
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

export type PromoSceneMarker = { id: string; from: number };

/** Soft gold wipe flash between scenes. */
export function PromoSceneWipes({ scenes }: { scenes: PromoSceneMarker[] }) {
  const frame = useCurrentFrame();
  return (
    <>
      {scenes.slice(1).map((s) => {
        const t = frame - s.from;
        if (t < -2 || t > 18) return null;
        const opacity = interpolate(t, [0, 5, 14, 18], [0, 0.22, 0.08, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const x = interpolate(t, [0, 18], [-20, 100], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={`wipe-${s.id}`}
            style={{
              position: "absolute",
              inset: 0,
              opacity,
              background: `linear-gradient(105deg, transparent ${x - 18}%, rgba(243,186,47,0.55) ${x}%, transparent ${x + 18}%)`,
              pointerEvents: "none",
              zIndex: 40,
            }}
          />
        );
      })}
    </>
  );
}

export function PromoParticles({ count = 28 }: { count?: number }) {
  const frame = useCurrentFrame();
  const dots = Array.from({ length: count }, (_, i) => {
    const x = promoHash01(i) * 100;
    const y0 = promoHash01(i + 40) * 100;
    const speed = 0.08 + promoHash01(i + 80) * 0.12;
    const size = 2 + promoHash01(i + 120) * 3;
    const y = (y0 + frame * speed) % 110;
    const opacity = 0.08 + promoHash01(i + 160) * 0.18;
    const gold = promoHash01(i + 200) > 0.55;
    return { x, y, size, opacity, gold };
  });
  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      {dots.map((d, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: d.size,
            height: d.size,
            borderRadius: 99,
            background: d.gold ? PROMO_GOLD : "rgba(0,0,0,0.35)",
            opacity: d.opacity,
            filter: d.gold ? "blur(0.4px)" : undefined,
          }}
        />
      ))}
    </AbsoluteFill>
  );
}

export function PromoBackground() {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 42) * 18;
  const drift2 = Math.cos(frame / 55) * 14;
  return (
    <AbsoluteFill style={{ backgroundColor: PROMO_BG }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(1000px 560px at ${74 + drift * 0.15}% ${-6 + drift2 * 0.1}%, rgba(243,186,47,0.18), transparent 62%),
            radial-gradient(780px 460px at ${8 + drift2 * 0.2}% ${108 + drift * 0.1}%, rgba(0,0,0,0.06), transparent 58%),
            radial-gradient(500px 360px at 50% 50%, rgba(243,186,47,0.04), transparent 70%)
          `,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          opacity: 0.55,
          maskImage:
            "radial-gradient(ellipse at center, black 15%, transparent 78%)",
        }}
      />
      <PromoParticles />
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: "inset 0 0 120px rgba(0,0,0,0.06)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
}

export function PromoGoldRule({
  delay,
  width = 140,
}: {
  delay: number;
  width?: number;
}) {
  const frame = useCurrentFrame();
  const w = promoClamp(frame, [delay, delay + 16], [0, width]);
  const glow = 0.35 + 0.2 * Math.sin(frame / 14);
  return (
    <div
      style={{
        width: w,
        height: 3,
        borderRadius: 99,
        marginTop: 16,
        background: `linear-gradient(90deg, ${PROMO_GOLD}, rgba(243,186,47,0.2))`,
        boxShadow: `0 0 16px rgba(243,186,47,${glow})`,
      }}
    />
  );
}

export function PromoCaptionBar({
  text,
  from,
  to,
}: {
  text: string;
  from: number;
  to: number;
}) {
  const frame = useCurrentFrame();
  if (frame < from || frame > to) return null;
  const opacity = promoClamp(frame, [from, from + 10], [0, 1]);
  const y = promoClamp(frame, [from, from + 12], [16, 0]);
  return (
    <div
      style={{
        position: "absolute",
        left: PROMO_PAD_X,
        right: PROMO_PAD_X,
        bottom: 36,
        height: PROMO_CAPTION_ZONE - 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity,
        transform: `translateY(${y}px)`,
        textAlign: "center",
        fontFamily: PROMO_FONT,
        fontSize: 36,
        fontWeight: 650,
        color: "rgba(0,0,0,0.78)",
        letterSpacing: "-0.015em",
        lineHeight: 1.25,
      }}
    >
      {text}
    </div>
  );
}

/** Header + body + caption shell — required for proportional scenes. */
export function PromoSceneShell({
  eyebrow,
  title,
  titleMono,
  delay,
  children,
  caption,
  captionFrom,
  captionTo,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  titleMono?: boolean;
  delay: number;
  children: ReactNode;
  caption: string;
  captionFrom: number;
  captionTo: number;
  subtitle?: string;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const eye = promoEnterSpring(frame, delay + 2, fps, 0.7);
  const titleIn = promoEnterSpring(frame, delay + 8, fps, 0.9);
  const subIn = promoEnterSpring(frame, delay + 18, fps, 0.8);
  const shimmer = promoClamp(frame, [delay + 10, delay + 40], [-30, 130]);

  return (
    <AbsoluteFill
      style={{
        fontFamily: PROMO_FONT,
        padding: `${PROMO_PAD_TOP}px ${PROMO_PAD_X}px ${PROMO_BODY_BOTTOM}px`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ flex: "0 0 auto" }}>
        <div
          style={{
            opacity: eye,
            transform: `translateY(${(1 - eye) * 10}px)`,
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: PROMO_MUTED,
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            opacity: titleIn,
            transform: `translateY(${(1 - titleIn) * 28}px)`,
            marginTop: 12,
            maxWidth: 1600,
          }}
        >
          <div
            style={{
              fontFamily: titleMono ? PROMO_MONO : PROMO_DISPLAY,
              fontSize: titleMono ? 64 : 54,
              fontWeight: 700,
              letterSpacing: titleMono ? "-0.04em" : "-0.035em",
              color: PROMO_FG,
              lineHeight: 1.12,
            }}
          >
            {title}
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(100deg, transparent ${shimmer - 12}%, rgba(243,186,47,0.35) ${shimmer}%, transparent ${shimmer + 12}%)`,
              mixBlendMode: "multiply",
              pointerEvents: "none",
            }}
          />
        </div>
        {subtitle ? (
          <div
            style={{
              opacity: subIn,
              transform: `translateY(${(1 - subIn) * 14}px)`,
              marginTop: 14,
              maxWidth: 820,
              fontSize: 24,
              fontWeight: 500,
              color: PROMO_MUTED,
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </div>
        ) : null}
        <PromoGoldRule delay={delay + 14} />
      </div>

      <div
        style={{
          flex: "1 1 auto",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          marginTop: 20,
        }}
      >
        {children}
      </div>

      <PromoCaptionBar text={caption} from={captionFrom} to={captionTo} />
    </AbsoluteFill>
  );
}

export function PromoCard({
  delay,
  children,
  style,
  accent,
}: {
  delay: number;
  children: ReactNode;
  style?: CSSProperties;
  accent?: boolean;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = promoEnterSpring(frame, delay, fps, 0.82);
  const pulse = accent ? 1 + 0.015 * Math.sin(frame / 10) : 1;
  return (
    <div
      style={{
        opacity: enter,
        transform: `translateY(${(1 - enter) * 36}px) scale(${(0.94 + enter * 0.06) * pulse})`,
        borderRadius: 24,
        border: accent
          ? "1.5px solid rgba(243,186,47,0.75)"
          : "1px solid rgba(0,0,0,0.1)",
        background: accent
          ? "linear-gradient(165deg, rgba(243,186,47,0.16), #fff 55%)"
          : "linear-gradient(165deg, rgba(0,0,0,0.03), #fff 60%)",
        boxShadow: accent
          ? "0 28px 56px -32px rgba(243,186,47,0.55), 0 0 0 1px rgba(243,186,47,0.15)"
          : "0 28px 56px -36px rgba(0,0,0,0.35)",
        padding: "28px 30px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
