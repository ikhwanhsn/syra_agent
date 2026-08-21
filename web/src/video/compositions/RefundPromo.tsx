/**
 * In-house x402 refund promo. ~42s @ 30fps, 1920x1080.
 * Signature hero: a gold payment token flies out, the provider cracks, the arc reverses.
 * Toolkit: engine/promoKit.tsx. Not a reskin of LLM Exchange or Bridge.
 */
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { CSSProperties, ReactNode } from "react";
import {
  COPY,
  PROMO_REVEALS,
  PROMO_SCENES,
  REFUND_PROMO_DURATION,
  REFUND_PROMO_FPS,
  REFUND_PROMO_HEIGHT,
  REFUND_PROMO_WIDTH,
  sceneById,
} from "@/video/content/refundPromo";
import { RefundPromoAudio } from "@/video/compositions/refundPromoAudio";
import {
  PROMO_BG as BG,
  PROMO_CAPTION_ZONE as CAPTION_ZONE,
  PROMO_DISPLAY as DISPLAY,
  PROMO_FG as FG,
  PROMO_FONT as FONT,
  PROMO_GOLD as GOLD,
  PROMO_MONO as MONO,
  PROMO_MUTED as MUTED,
  PROMO_PAD_X as PAD_X,
  PromoBackground as Background,
  PromoCaptionBar as CaptionBar,
  PromoCard as Card,
  PromoGoldRule as GoldRule,
  PromoScene as Scene,
  PromoSceneShell as SceneShell,
  PromoSceneWipes,
  promoClamp as clamp,
  promoEnterSpring as enterSpring,
} from "@/video/engine/promoKit";

export {
  REFUND_PROMO_DURATION,
  REFUND_PROMO_WIDTH,
  REFUND_PROMO_HEIGHT,
};
export const REFUND_PROMO_FPS_EXPORT = REFUND_PROMO_FPS;

export type RefundPromoProps = {
  bgm?: boolean;
};

const ARC_P0: [number, number] = [96, 132];
const ARC_P1: [number, number] = [300, 18];
const ARC_P2: [number, number] = [700, 18];
const ARC_P3: [number, number] = [904, 132];
const ARC_VB = { w: 1000, h: 320 };

function cubicPoint(t: number): [number, number] {
  const u = 1 - t;
  const x =
    u * u * u * ARC_P0[0] +
    3 * u * u * t * ARC_P1[0] +
    3 * u * t * t * ARC_P2[0] +
    t * t * t * ARC_P3[0];
  const y =
    u * u * u * ARC_P0[1] +
    3 * u * u * t * ARC_P1[1] +
    3 * u * t * t * ARC_P2[1] +
    t * t * t * ARC_P3[1];
  return [x, y];
}

function GoldToken({
  size = 56,
  glow = 1,
  label = "USDC",
}: {
  size?: number;
  glow?: number;
  label?: string;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 99,
        background: `radial-gradient(circle at 32% 28%, #fff6c8, ${GOLD} 56%, #c49212)`,
        boxShadow: `0 0 ${16 * glow}px rgba(243,186,47,${0.5 * glow}), 0 8px 18px rgba(0,0,0,0.16)`,
        border: "1.5px solid rgba(255,255,255,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: MONO,
        fontSize: Math.max(10, size * 0.22),
        fontWeight: 800,
        color: "#5a4300",
        letterSpacing: "-0.04em",
      }}
    >
      {label}
    </div>
  );
}

function RailNode({
  label,
  sub,
  cracked,
  enter,
  align,
}: {
  label: string;
  sub: string;
  cracked?: boolean;
  enter: number;
  align: "left" | "right";
}) {
  return (
    <div
      style={{
        position: "absolute",
        [align]: 0,
        top: 92,
        width: 220,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 18}px) ${cracked ? "rotate(-1.4deg)" : ""}`,
        borderRadius: 18,
        border: cracked
          ? "1.5px solid rgba(0,0,0,0.45)"
          : "1px solid rgba(0,0,0,0.1)",
        background: cracked
          ? "linear-gradient(165deg, rgba(0,0,0,0.08), #fff 70%)"
          : "linear-gradient(165deg, rgba(243,186,47,0.12), #fff 62%)",
        boxShadow: cracked
          ? "0 18px 36px -28px rgba(0,0,0,0.45)"
          : "0 18px 36px -28px rgba(243,186,47,0.45)",
        padding: "16px 18px",
        textAlign: align,
      }}
    >
      <div
        style={{
          fontFamily: DISPLAY,
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: "-0.03em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 4,
          fontFamily: MONO,
          fontSize: 13,
          fontWeight: 650,
          color: cracked ? FG : MUTED,
        }}
      >
        {sub}
      </div>
    </div>
  );
}

function PaymentArcStage({
  t,
  tokenOpacity,
  cracked,
  leftEnter,
  rightEnter,
  direction,
  leftSub,
  rightSub,
  cameraScale = 1,
  tokenSize = 58,
  children,
}: {
  t: number;
  tokenOpacity: number;
  cracked: boolean;
  leftEnter: number;
  rightEnter: number;
  direction: "out" | "back";
  leftSub?: string;
  rightSub?: string;
  cameraScale?: number;
  tokenSize?: number;
  children?: ReactNode;
}) {
  const [px, py] = cubicPoint(t);
  const dOut = `M ${ARC_P0[0]} ${ARC_P0[1]} C ${ARC_P1[0]} ${ARC_P1[1]}, ${ARC_P2[0]} ${ARC_P2[1]}, ${ARC_P3[0]} ${ARC_P3[1]}`;
  const dBack = `M ${ARC_P3[0]} ${ARC_P3[1]} C ${ARC_P2[0]} ${ARC_P2[1]}, ${ARC_P1[0]} ${ARC_P1[1]}, ${ARC_P0[0]} ${ARC_P0[1]}`;
  const pathLen = 980;
  const paint = direction === "out" ? t : 1 - t;
  const moving = t > 0.04 && t < 0.96;
  const ghosts = moving
    ? [0.055, 0.11, 0.165]
        .map((delta) => (direction === "out" ? t - delta : t + delta))
        .filter((g) => g >= 0 && g <= 1)
    : [];

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: 320,
        minHeight: 320,
        transform: `scale(${cameraScale})`,
        transformOrigin: direction === "back" ? "8% 55%" : "50% 50%",
      }}
    >
      <svg
        viewBox={`0 0 ${ARC_VB.w} ${ARC_VB.h}`}
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        <path
          d={dOut}
          fill="none"
          stroke="rgba(0,0,0,0.1)"
          strokeWidth={4}
          strokeLinecap="round"
        />
        <path
          d={direction === "out" ? dOut : dBack}
          fill="none"
          stroke={GOLD}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={`${paint * pathLen} ${pathLen}`}
          opacity={0.95}
        />
      </svg>
      {ghosts.map((g, i) => {
        const [gx, gy] = cubicPoint(g);
        return (
          <div
            key={`ghost-${i}`}
            style={{
              position: "absolute",
              left: `${(gx / ARC_VB.w) * 100}%`,
              top: `${(gy / ARC_VB.h) * 100}%`,
              transform: "translate(-50%, -50%)",
              opacity: tokenOpacity * (0.28 - i * 0.07),
              zIndex: 2,
              filter: "blur(0.6px)",
            }}
          >
            <GoldToken size={Math.round(tokenSize * (0.78 - i * 0.08))} glow={0.4} />
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: `${(px / ARC_VB.w) * 100}%`,
          top: `${(py / ARC_VB.h) * 100}%`,
          transform: "translate(-50%, -50%)",
          opacity: tokenOpacity,
          zIndex: 3,
        }}
      >
        <GoldToken size={tokenSize} glow={1.2 + paint * 0.25} />
      </div>
      <RailNode
        label="Agent"
        sub={leftSub ?? "pays x402"}
        enter={leftEnter}
        align="left"
      />
      <RailNode
        label="Provider"
        sub={rightSub ?? (cracked ? "5xx" : "upstream")}
        cracked={cracked}
        enter={rightEnter}
        align="right"
      />
      {children}
    </div>
  );
}

/** Gold smear traveling right-to-left: money coming back. */
function ReverseGoldWipe({ at }: { at: number }) {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < -2 || t > 20) return null;
  const opacity = interpolate(t, [0, 4, 16, 20], [0, 0.34, 0.1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const x = interpolate(t, [0, 20], [118, -18], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        background: `linear-gradient(255deg, transparent ${x - 18}%, rgba(243,186,47,0.7) ${x}%, transparent ${x + 18}%)`,
        pointerEvents: "none",
        zIndex: 42,
      }}
    />
  );
}

function ReverseFlash({ at }: { at: number }) {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0 || t > 12) return null;
  const opacity = interpolate(t, [0, 2, 12], [0.22, 0.1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: GOLD,
        opacity,
        mixBlendMode: "multiply",
        pointerEvents: "none",
        zIndex: 41,
      }}
    />
  );
}

function StampReturned({ visible }: { visible: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 42,
        top: 78,
        opacity: visible,
        transform: `rotate(-8deg) scale(${0.82 + visible * 0.18})`,
        fontFamily: MONO,
        fontSize: 22,
        fontWeight: 800,
        letterSpacing: "0.12em",
        color: "#5a4300",
        border: `2.5px solid ${GOLD}`,
        borderRadius: 8,
        padding: "6px 12px",
        background: "rgba(255,255,255,0.94)",
        boxShadow: "0 10px 24px -12px rgba(243,186,47,0.8)",
        zIndex: 4,
      }}
    >
      RETURNED
    </div>
  );
}

function Stamp5xx({ visible }: { visible: number }) {
  const frame = useCurrentFrame();
  const jitter = Math.sin(frame / 2.2) * 2.4 * visible;
  return (
    <div
      style={{
        position: "absolute",
        right: 28,
        top: 42,
        opacity: visible,
        transform: `translate(${jitter}px, ${-jitter * 0.4}px) rotate(-12deg) scale(${0.82 + visible * 0.18})`,
        fontFamily: MONO,
        fontSize: 28,
        fontWeight: 800,
        letterSpacing: "0.14em",
        color: FG,
        border: "2.5px solid rgba(0,0,0,0.82)",
        borderRadius: 8,
        padding: "6px 12px",
        background: "rgba(255,255,255,0.92)",
        zIndex: 4,
      }}
    >
      5xx
    </div>
  );
}

function MonoChip({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        fontFamily: MONO,
        fontSize: 15,
        fontWeight: 650,
        padding: "8px 12px",
        borderRadius: 999,
        border: "1px solid rgba(0,0,0,0.1)",
        background: "#fff",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SceneCover() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = sceneById("cover");
  const local = frame - s.from;
  const r = PROMO_REVEALS.cover;
  const drop = enterSpring(local, 4, fps, 0.95);
  const logo = enterSpring(local, 8, fps, 0.7);
  const titleIn = enterSpring(local, r.title, fps, 0.95);
  const subIn = enterSpring(local, r.elements[0], fps, 0.85);
  const ring = clamp(local, [6, 48], [0, 1]);
  const float = Math.sin(local / 20) * 5;
  const settleGlow = 0.7 + 0.3 * Math.sin(local / 14);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        fontFamily: FONT,
        padding: `0 ${PAD_X}px ${CAPTION_ZONE}px`,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 460,
          height: 460,
          borderRadius: "50%",
          border: `1px solid rgba(243,186,47,${0.12 + ring * 0.28})`,
          transform: `scale(${0.55 + ring * 0.5})`,
          opacity: 0.75,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 320,
          height: 320,
          borderRadius: "50%",
          border: `1px solid rgba(243,186,47,${0.08 + ring * 0.18})`,
          transform: `scale(${0.7 + ring * 0.28})`,
        }}
      />
      <div
        style={{
          opacity: drop,
          transform: `translateY(${(1 - drop) * -90 + float}px) scale(${0.7 + drop * 0.3})`,
          marginBottom: 10,
        }}
      >
        <GoldToken size={92} glow={settleGlow} />
      </div>
      <div
        style={{
          opacity: logo,
          fontFamily: DISPLAY,
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: GOLD,
          marginTop: 8,
        }}
      >
        SYRA
      </div>
      <div
        style={{
          opacity: enterSpring(local, 10, fps, 0.7),
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: MUTED,
          marginTop: 10,
        }}
      >
        {COPY.cover.eyebrow}
      </div>
      <div
        style={{
          opacity: titleIn,
          transform: `translateY(${(1 - titleIn) * 36}px) scale(${0.94 + titleIn * 0.06})`,
          fontFamily: DISPLAY,
          fontSize: 92,
          fontWeight: 700,
          letterSpacing: "-0.045em",
          color: FG,
          marginTop: 10,
          textAlign: "center",
          textShadow: "0 12px 40px rgba(243,186,47,0.16)",
        }}
      >
        {COPY.cover.title}
      </div>
      <GoldRule delay={s.from + r.title + 6} width={180} />
      <div
        style={{
          opacity: subIn,
          transform: `translateY(${(1 - subIn) * 16}px)`,
          maxWidth: 980,
          textAlign: "center",
          fontSize: 30,
          fontWeight: 500,
          color: MUTED,
          lineHeight: 1.35,
          marginTop: 8,
        }}
      >
        {COPY.cover.subtitle}
      </div>
      <CaptionBar text={COPY.cover.caption} from={s.from + r.caption} to={s.to} />
    </AbsoluteFill>
  );
}

function SceneStakes() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = sceneById("stakes");
  const local = frame - s.from;
  const r = PROMO_REVEALS.stakes;
  const t = clamp(local, [10, 58], [0, 1]);
  const cracked = clamp(local, [44, 58], [0, 1]);
  const tokenFade = interpolate(local, [58, 92], [1, 0.22], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneShell
      eyebrow={COPY.stakes.eyebrow}
      title={COPY.stakes.title}
      delay={s.from}
      caption={COPY.stakes.caption}
      captionFrom={s.from + r.caption}
      captionTo={s.to}
    >
      <PaymentArcStage
        t={t}
        tokenOpacity={enterSpring(local, 2, fps, 0.8) * tokenFade}
        cracked={cracked > 0.4}
        leftEnter={enterSpring(local, 0, fps, 0.7)}
        rightEnter={enterSpring(local, 4, fps, 0.7)}
        direction="out"
        leftSub="x402 settled"
        rightSub={cracked > 0.4 ? "5xx" : "no receipt"}
        tokenSize={56}
      >
        <Stamp5xx visible={cracked} />
      </PaymentArcStage>
    </SceneShell>
  );
}

function SceneRoundtrip() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = sceneById("roundtrip");
  const local = frame - s.from;
  const r = PROMO_REVEALS.roundtrip;
  const t = clamp(local, [18, 108], [1, 0]);
  const settled = clamp(local, [104, 124], [0, 1]);
  const cam = interpolate(settled, [0, 1], [1, 1.07], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const burst = 0.85 + settled * 0.5;

  return (
    <SceneShell
      eyebrow={COPY.roundtrip.eyebrow}
      title={COPY.roundtrip.title}
      delay={s.from}
      caption={COPY.roundtrip.caption}
      captionFrom={s.from + r.caption}
      captionTo={s.to}
    >
      <PaymentArcStage
        t={t}
        tokenOpacity={enterSpring(local, 0, fps, 0.65)}
        cracked={local < 36}
        leftEnter={enterSpring(local, 0, fps, 0.6)}
        rightEnter={enterSpring(local, 2, fps, 0.6)}
        direction="back"
        leftSub="wallet"
        rightSub={local < 36 ? "5xx" : "upstream"}
        cameraScale={cam}
        tokenSize={62}
      >
        {settled > 0 ? (
          <div
            style={{
              position: "absolute",
              left: 8,
              top: 48,
              width: 210,
              height: 210,
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(243,186,47,${0.36 * settled}), transparent 68%)`,
              transform: `scale(${burst})`,
              pointerEvents: "none",
            }}
          />
        ) : null}
        <StampReturned visible={settled} />
      </PaymentArcStage>
    </SceneShell>
  );
}

function SceneClassify() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = sceneById("classify");
  const local = frame - s.from;
  const r = PROMO_REVEALS.classify;
  const stamped = enterSpring(local, r.elements[2], fps, 0.7);
  const sigLen = Math.floor(
    clamp(local, [r.elements[2] + 4, r.elements[2] + 28], [0, COPY.classify.ledger.signature.length]),
  );
  const sig = COPY.classify.ledger.signature.slice(0, Math.max(1, sigLen));

  return (
    <SceneShell
      eyebrow={COPY.classify.eyebrow}
      title={COPY.classify.title}
      delay={s.from}
      caption={COPY.classify.caption}
      captionFrom={s.from + r.caption}
      captionTo={s.to}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 1.2fr",
          gap: 28,
          width: "100%",
          alignItems: "stretch",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {COPY.classify.chips.map((chip, i) => {
            const enter = enterSpring(local, r.elements[Math.min(i, r.elements.length - 1)], fps, 0.75);
            return (
              <div
                key={chip.id}
                style={{
                  opacity: enter,
                  transform: `translateX(${(1 - enter) * 28}px)`,
                  borderRadius: 16,
                  border: "1px solid rgba(0,0,0,0.1)",
                  background: "#fff",
                  padding: "16px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: DISPLAY,
                    fontSize: 28,
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                  }}
                >
                  {chip.label}
                </div>
                <MonoChip>{chip.detail}</MonoChip>
              </div>
            );
          })}
          <div
            style={{
              opacity: enterSpring(local, r.elements[1], fps, 0.75),
              marginTop: 4,
              fontSize: 18,
              fontWeight: 600,
              color: MUTED,
            }}
          >
            {COPY.classify.cap.label}: {COPY.classify.cap.value}
          </div>
        </div>

        <Card delay={s.from + r.elements[2]} accent style={{ minHeight: 280 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: MUTED,
            }}
          >
            Refund ledger
          </div>
          <div
            style={{
              marginTop: 18,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontFamily: MONO, fontSize: 18, color: MUTED }}>
              {COPY.classify.ledger.chain} · {COPY.classify.ledger.amount}
            </div>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: "0.08em",
                color: stamped > 0.7 ? "#5a4300" : MUTED,
                background:
                  stamped > 0.7 ? "rgba(243,186,47,0.28)" : "rgba(0,0,0,0.05)",
                borderRadius: 999,
                padding: "8px 14px",
                transform: `scale(${0.92 + stamped * 0.1})`,
              }}
            >
              {stamped > 0.55
                ? COPY.classify.ledger.statusTo.toUpperCase()
                : COPY.classify.ledger.statusFrom.toUpperCase()}
            </div>
          </div>
          <div
            style={{
              marginTop: 28,
              fontFamily: MONO,
              fontSize: 22,
              fontWeight: 650,
              letterSpacing: "-0.02em",
              color: FG,
              minHeight: 32,
            }}
          >
            tx {sig}
            <span
              style={{
                opacity: sigLen < COPY.classify.ledger.signature.length ? 1 : 0,
                color: GOLD,
              }}
            >
              |
            </span>
          </div>
        </Card>
      </div>
    </SceneShell>
  );
}

function SceneRails() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = sceneById("rails");
  const local = frame - s.from;
  const r = PROMO_REVEALS.rails;
  const activeIdx = Math.min(
    3,
    Math.max(0, Math.floor((local - 16) / 20)),
  );

  return (
    <SceneShell
      eyebrow={COPY.rails.eyebrow}
      title={COPY.rails.title}
      delay={s.from}
      caption={COPY.rails.caption}
      captionFrom={s.from + r.caption}
      captionTo={s.to}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 18,
          width: "100%",
        }}
      >
        {COPY.rails.items.map((item, i) => {
          const enter = enterSpring(local, r.elements[i], fps, 0.75);
          const on = i === activeIdx;
          return (
            <div
              key={item.id}
              style={{
                opacity: enter,
                transform: `translateY(${(1 - enter) * 32}px) scale(${on ? 1.04 : 0.98})`,
                borderRadius: 22,
                padding: "32px 20px",
                textAlign: "center",
                minHeight: 240,
                border: on
                  ? "1.5px solid rgba(243,186,47,0.8)"
                  : "1px solid rgba(0,0,0,0.1)",
                background: on
                  ? "linear-gradient(180deg, rgba(243,186,47,0.2), #fff)"
                  : "#fff",
                boxShadow: on
                  ? "0 24px 48px -28px rgba(243,186,47,0.6)"
                  : "0 18px 36px -30px rgba(0,0,0,0.3)",
              }}
            >
              <div
                style={{
                  fontFamily: DISPLAY,
                  fontSize: 32,
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  marginTop: 14,
                  fontFamily: MONO,
                  fontSize: 16,
                  fontWeight: 650,
                  color: MUTED,
                }}
              >
                {item.detail}
              </div>
            </div>
          );
        })}
      </div>
    </SceneShell>
  );
}

function SceneSdk() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = sceneById("sdk");
  const local = frame - s.from;
  const r = PROMO_REVEALS.sdk;
  const code = COPY.sdk.codeLines.join("\n");
  const typed = Math.floor(clamp(local, [r.elements[0], r.elements[0] + 42], [0, code.length]));
  const shown = code.slice(0, typed);

  return (
    <SceneShell
      eyebrow={COPY.sdk.eyebrow}
      title={COPY.sdk.title}
      delay={s.from}
      caption={COPY.sdk.caption}
      captionFrom={s.from + r.caption}
      captionTo={s.to}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.45fr 0.9fr",
          gap: 24,
          width: "100%",
          alignItems: "stretch",
        }}
      >
        <Card delay={s.from + r.elements[0]} style={{ minHeight: 300, padding: "26px 28px" }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: MUTED,
              marginBottom: 16,
            }}
          >
            @syra-ai/x402-refund
          </div>
          <pre
            style={{
              margin: 0,
              fontFamily: MONO,
              fontSize: 20,
              lineHeight: 1.45,
              fontWeight: 550,
              color: FG,
              whiteSpace: "pre-wrap",
              minHeight: 210,
            }}
          >
            {shown}
            <span style={{ color: GOLD, opacity: typed < code.length ? 1 : 0 }}>|</span>
          </pre>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {COPY.sdk.notes.map((note, i) => {
            const enter = enterSpring(local, r.elements[Math.min(1 + i, r.elements.length - 1)], fps, 0.75);
            return (
              <div
                key={note.label}
                style={{
                  opacity: enter,
                  transform: `translateY(${(1 - enter) * 22}px)`,
                  borderRadius: 18,
                  border: "1px solid rgba(0,0,0,0.1)",
                  background: "#fff",
                  padding: "22px 22px",
                  flex: 1,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: MUTED,
                  }}
                >
                  {note.label}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontFamily: MONO,
                    fontSize: 20,
                    fontWeight: 650,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {note.value}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SceneShell>
  );
}

function SceneProof() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = sceneById("proof");
  const local = frame - s.from;
  const r = PROMO_REVEALS.proof;

  return (
    <SceneShell
      eyebrow={COPY.proof.eyebrow}
      title={COPY.proof.title}
      delay={s.from}
      caption={COPY.proof.caption}
      captionFrom={s.from + r.caption}
      captionTo={s.to}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18, width: "100%" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
          }}
        >
          {COPY.proof.stats.map((stat, i) => {
            const enter = enterSpring(local, r.elements[Math.min(i, r.elements.length - 1)], fps, 0.75);
            return (
              <div
                key={stat.label}
                style={{
                  opacity: enter,
                  transform: `translateY(${(1 - enter) * 20}px)`,
                  borderRadius: 18,
                  border: "1px solid rgba(0,0,0,0.1)",
                  background: "linear-gradient(180deg, rgba(243,186,47,0.12), #fff)",
                  padding: "18px 20px",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: MUTED,
                  }}
                >
                  {stat.label}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontFamily: MONO,
                    fontSize: 28,
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                  }}
                >
                  {stat.value}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {COPY.proof.rows.map((row, i) => {
            const enter = enterSpring(local, r.elements[Math.min(i, r.elements.length - 1)] + 8, fps, 0.75);
            return (
              <div
                key={row.sig}
                style={{
                  opacity: enter,
                  transform: `translateX(${(1 - enter) * 24}px)`,
                  display: "grid",
                  gridTemplateColumns: "140px 100px 90px 1fr",
                  gap: 16,
                  alignItems: "center",
                  borderRadius: 14,
                  border: "1px solid rgba(0,0,0,0.08)",
                  background: "#fff",
                  padding: "14px 20px",
                  fontFamily: MONO,
                  fontSize: 18,
                  fontWeight: 600,
                }}
              >
                <span>{row.chain}</span>
                <span>{row.amount}</span>
                <span style={{ color: "#8a6a00", fontWeight: 800 }}>{row.status}</span>
                <span style={{ color: MUTED }}>{row.sig}</span>
              </div>
            );
          })}
        </div>
      </div>
    </SceneShell>
  );
}

function SceneCta() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = sceneById("cta");
  const local = frame - s.from;
  const r = PROMO_REVEALS.cta;
  const titleIn = enterSpring(local, r.title, fps, 0.9);
  const burst = clamp(local, [r.title, r.title + 22], [0, 1]);
  const tokenIn = enterSpring(local, 6, fps, 0.95);
  const float = Math.sin(local / 18) * 4;

  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT,
        justifyContent: "center",
        alignItems: "center",
        padding: `0 ${PAD_X}px ${CAPTION_ZONE}px`,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 720,
          height: 720,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(243,186,47,${0.22 * burst}), transparent 65%)`,
          transform: `scale(${0.78 + burst * 0.38})`,
        }}
      />
      <div
        style={{
          opacity: tokenIn,
          transform: `translateY(${(1 - tokenIn) * -40 + float}px) scale(${0.86 + tokenIn * 0.14})`,
          marginBottom: 8,
        }}
      >
        <GoldToken size={76} glow={1.2 + burst * 0.4} />
      </div>
      <div
        style={{
          opacity: enterSpring(local, 4, fps, 0.7),
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: MUTED,
        }}
      >
        {COPY.cta.eyebrow}
      </div>
      <div
        style={{
          opacity: titleIn,
          transform: `translateY(${(1 - titleIn) * 28}px)`,
          fontFamily: DISPLAY,
          fontSize: 68,
          fontWeight: 700,
          letterSpacing: "-0.045em",
          textAlign: "center",
          marginTop: 14,
          maxWidth: 1500,
          lineHeight: 1.08,
        }}
      >
        {COPY.cta.title}
      </div>
      <GoldRule delay={s.from + r.title + 8} width={180} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 18,
          marginTop: 28,
          width: "100%",
          maxWidth: 1480,
        }}
      >
        {COPY.cta.links.map((link, i) => {
          const enter = enterSpring(local, r.elements[i], fps, 0.75);
          return (
            <div
              key={link.label}
              style={{
                opacity: enter,
                transform: `translateY(${(1 - enter) * 24}px)`,
                borderRadius: 20,
                border: "1px solid rgba(0,0,0,0.1)",
                padding: "24px 26px",
                background: "#fff",
                boxShadow: "0 24px 48px -36px rgba(0,0,0,0.35)",
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: MUTED,
                }}
              >
                {link.label}
              </div>
              <div
                style={{
                  marginTop: 10,
                  fontFamily: MONO,
                  fontSize: 20,
                  fontWeight: 650,
                  color: FG,
                  lineHeight: 1.3,
                  wordBreak: "break-all",
                }}
              >
                {link.value}
              </div>
            </div>
          );
        })}
      </div>
      <CaptionBar text={COPY.cta.caption} from={s.from + r.caption} to={s.to} />
    </AbsoluteFill>
  );
}

export function RefundPromo({ bgm = true }: RefundPromoProps) {
  const cover = sceneById("cover");
  const stakes = sceneById("stakes");
  const roundtrip = sceneById("roundtrip");
  const classify = sceneById("classify");
  const rails = sceneById("rails");
  const sdk = sceneById("sdk");
  const proof = sceneById("proof");
  const cta = sceneById("cta");

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <Background />
      <Scene from={cover.from} to={cover.to}>
        <SceneCover />
      </Scene>
      <Scene from={stakes.from} to={stakes.to}>
        <SceneStakes />
      </Scene>
      <Scene from={roundtrip.from} to={roundtrip.to}>
        <SceneRoundtrip />
      </Scene>
      <Scene from={classify.from} to={classify.to}>
        <SceneClassify />
      </Scene>
      <Scene from={rails.from} to={rails.to}>
        <SceneRails />
      </Scene>
      <Scene from={sdk.from} to={sdk.to}>
        <SceneSdk />
      </Scene>
      <Scene from={proof.from} to={proof.to}>
        <SceneProof />
      </Scene>
      <Scene from={cta.from} to={cta.to}>
        <SceneCta />
      </Scene>
      <PromoSceneWipes scenes={PROMO_SCENES} />
      <ReverseGoldWipe at={roundtrip.from} />
      <ReverseFlash at={roundtrip.from + 8} />
      <RefundPromoAudio bgm={bgm} />
    </AbsoluteFill>
  );
}
