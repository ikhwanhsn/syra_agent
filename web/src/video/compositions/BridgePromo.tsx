/**
 * Relay Bridge launch promo — ~38s @ 30fps, 1920×1080.
 * Craft reference alongside LlmExchange (QUALITY_BAR). New promos should diverge
 * in story spine and audio; reuse promoKit as a toolkit, not this scene order.
 */
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  BRIDGE_PROMO_DURATION,
  BRIDGE_PROMO_FPS,
  BRIDGE_PROMO_HEIGHT,
  BRIDGE_PROMO_WIDTH,
  COPY,
  PROMO_REVEALS,
  PROMO_SCENES,
  sceneById,
} from "@/video/content/bridgePromo";
import { BridgePromoAudio } from "@/video/compositions/bridgePromoAudio";
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

export const BRIDGE_PROMO_FPS_EXPORT = BRIDGE_PROMO_FPS;
export { BRIDGE_PROMO_DURATION, BRIDGE_PROMO_WIDTH, BRIDGE_PROMO_HEIGHT };

const WIDGET_TEX = staticFile("video-assets/bridge/bridge-widget.png");

export type BridgePromoProps = {
  bgm?: boolean;
};

function SceneCover() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = sceneById("cover");
  const local = frame - s.from;
  const r = PROMO_REVEALS.cover;
  const logo = enterSpring(local, 4, fps, 0.7);
  const titleIn = enterSpring(local, r.title, fps, 0.95);
  const subIn = enterSpring(local, r.elements[0], fps, 0.85);
  const ring = clamp(local, [8, 50], [0, 1]);
  const float = Math.sin(local / 22) * 6;
  const shimmer = clamp(local, [r.title + 8, r.title + 36], [0, 1]);

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
          width: 520,
          height: 520,
          borderRadius: "50%",
          border: `1px solid rgba(243,186,47,${0.15 + ring * 0.25})`,
          transform: `scale(${0.7 + ring * 0.45})`,
          opacity: 0.7,
        }}
      />
      <div
        style={{
          opacity: logo,
          transform: `translateY(${float}px) scale(${0.9 + logo * 0.1})`,
          fontFamily: DISPLAY,
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: GOLD,
          marginBottom: 18,
        }}
      >
        SYRA
      </div>
      <div
        style={{
          opacity: enterSpring(local, 6, fps, 0.7),
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: MUTED,
        }}
      >
        {COPY.cover.eyebrow}
      </div>
      <div
        style={{
          opacity: titleIn,
          transform: `translateY(${(1 - titleIn) * 40}px) scale(${0.94 + titleIn * 0.06})`,
          fontFamily: DISPLAY,
          fontSize: 120,
          fontWeight: 700,
          letterSpacing: "-0.045em",
          color: FG,
          marginTop: 14,
          textAlign: "center",
          backgroundImage: `linear-gradient(90deg, ${FG} ${shimmer * 40}%, ${GOLD} ${shimmer * 55}%, ${FG} ${shimmer * 70}%)`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: shimmer > 0.05 ? "transparent" : FG,
          textShadow: "0 12px 40px rgba(243,186,47,0.18)",
        }}
      >
        {COPY.cover.title}
      </div>
      <GoldRule delay={s.from + r.title + 6} width={180} />
      <div
        style={{
          opacity: subIn,
          transform: `translateY(${(1 - subIn) * 18}px)`,
          maxWidth: 980,
          textAlign: "center",
          fontSize: 34,
          fontWeight: 500,
          color: MUTED,
          lineHeight: 1.35,
          marginTop: 8,
        }}
      >
        {COPY.cover.subtitle}
      </div>
      <CaptionBar
        text={COPY.cover.caption}
        from={s.from + r.caption}
        to={s.to}
      />
    </AbsoluteFill>
  );
}

function SceneProblem() {
  const s = sceneById("problem");
  const r = PROMO_REVEALS.problem;
  const frame = useCurrentFrame();
  const local = frame - s.from;
  const vs = clamp(local, [36, 70], [0, 1]);

  return (
    <SceneShell
      eyebrow={COPY.problem.eyebrow}
      title={COPY.problem.title}
      delay={s.from}
      caption={COPY.problem.caption}
      captionFrom={s.from + r.caption}
      captionTo={s.to}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gap: 28,
          alignItems: "stretch",
          width: "100%",
          maxHeight: 420,
        }}
      >
        <Card delay={s.from + r.elements[0]} style={{ minHeight: 260 }}>
          <div
            style={{
              fontFamily: DISPLAY,
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              marginBottom: 14,
            }}
          >
            {COPY.problem.left.title}
          </div>
          <div style={{ fontSize: 24, color: MUTED, lineHeight: 1.45, fontWeight: 500 }}>
            {COPY.problem.left.body}
          </div>
        </Card>
        <div
          style={{
            alignSelf: "center",
            opacity: vs,
            transform: `scale(${0.7 + vs * 0.4})`,
            fontFamily: DISPLAY,
            fontSize: 42,
            fontWeight: 800,
            color: GOLD,
            letterSpacing: "-0.04em",
          }}
        >
          VS
        </div>
        <Card delay={s.from + r.elements[1]} style={{ minHeight: 260 }}>
          <div
            style={{
              fontFamily: DISPLAY,
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              marginBottom: 14,
            }}
          >
            {COPY.problem.right.title}
          </div>
          <div style={{ fontSize: 24, color: MUTED, lineHeight: 1.45, fontWeight: 500 }}>
            {COPY.problem.right.body}
          </div>
        </Card>
      </div>
    </SceneShell>
  );
}

function SceneReveal() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = sceneById("reveal");
  const local = frame - s.from;
  const r = PROMO_REVEALS.reveal;
  const path = COPY.reveal.title;
  const typed = Math.floor(
    clamp(local, [r.title, r.title + 28], [0, path.length]),
  );
  const titleText = path.slice(0, typed) || " ";

  return (
    <SceneShell
      eyebrow={COPY.reveal.eyebrow}
      title={titleText}
      titleMono
      delay={s.from}
      subtitle={COPY.reveal.body}
      caption={COPY.reveal.caption}
      captionFrom={s.from + r.caption}
      captionTo={s.to}
    >
      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          justifyContent: "center",
          width: "100%",
          opacity: enterSpring(local, r.elements[1], fps, 0.8),
        }}
      >
        {["RelayKit widget", "EVM + Solana", "App fee 0.25%"].map((chip, i) => {
          const on = enterSpring(local, r.elements[1] + i * 8, fps, 0.7);
          return (
            <div
              key={chip}
              style={{
                opacity: on,
                transform: `translateY(${(1 - on) * 18}px)`,
                padding: "16px 22px",
                borderRadius: 999,
                border: "1px solid rgba(0,0,0,0.1)",
                background: i === 2 ? "rgba(243,186,47,0.14)" : "#fff",
                fontFamily: MONO,
                fontSize: 20,
                fontWeight: 650,
                color: FG,
              }}
            >
              {chip}
            </div>
          );
        })}
      </div>
    </SceneShell>
  );
}

function SceneChains() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = sceneById("chains");
  const local = frame - s.from;
  const r = PROMO_REVEALS.chains;

  return (
    <SceneShell
      eyebrow={COPY.chains.eyebrow}
      title={COPY.chains.title}
      delay={s.from}
      caption={COPY.chains.caption}
      captionFrom={s.from + r.caption}
      captionTo={s.to}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 22,
          width: "100%",
          maxHeight: 420,
        }}
      >
        {COPY.chains.items.map((item, i) => {
          const enter = enterSpring(local, r.elements[i], fps, 0.8);
          return (
            <div
              key={item.id}
              style={{
                opacity: enter,
                transform: `translateY(${(1 - enter) * 36}px) scale(${0.96 + enter * 0.04})`,
                borderRadius: 22,
                border: "1px solid rgba(0,0,0,0.1)",
                padding: "28px 26px",
                background: "#fff",
                boxShadow: "0 24px 48px -36px rgba(0,0,0,0.35)",
                minHeight: 170,
              }}
            >
              <div
                style={{
                  fontFamily: DISPLAY,
                  fontSize: 36,
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  marginTop: 12,
                  fontSize: 22,
                  color: MUTED,
                  lineHeight: 1.4,
                  fontWeight: 500,
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

function SceneWidget() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = sceneById("widget");
  const local = frame - s.from;
  const r = PROMO_REVEALS.widget;
  const push = clamp(local, [18, 140], [1, 1.12]);
  const panX = interpolate(local, [18, 160], [0, -40], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const panY = interpolate(local, [18, 160], [0, -24], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneShell
      eyebrow={COPY.widget.eyebrow}
      title={COPY.widget.title}
      delay={s.from}
      caption={COPY.widget.caption}
      captionFrom={s.from + r.caption}
      captionTo={s.to}
    >
      <div
        style={{
          width: "100%",
          height: 430,
          borderRadius: 28,
          overflow: "hidden",
          border: "1px solid rgba(0,0,0,0.1)",
          boxShadow: "0 32px 64px -40px rgba(0,0,0,0.45)",
          background: "#f4f4f2",
          opacity: enterSpring(local, r.elements[0], fps, 0.85),
        }}
      >
        <Img
          src={WIDGET_TEX}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `translate(${panX}px, ${panY}px) scale(${push})`,
            transformOrigin: "55% 45%",
          }}
        />
      </div>
    </SceneShell>
  );
}

function SceneFee() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = sceneById("fee");
  const local = frame - s.from;
  const r = PROMO_REVEALS.fee;
  const activeIdx = Math.min(
    3,
    Math.floor(clamp(local, [24, 120], [0, 3.99])),
  );

  return (
    <SceneShell
      eyebrow={COPY.fee.eyebrow}
      title={COPY.fee.title}
      delay={s.from}
      caption={COPY.fee.caption}
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
        {COPY.fee.points.map((point, i) => {
          const enter = enterSpring(local, r.elements[i], fps, 0.75);
          const on = i === activeIdx;
          return (
            <div
              key={point.label}
              style={{
                opacity: enter,
                transform: `translateY(${(1 - enter) * 32}px) scale(${on ? 1.05 : 0.98})`,
                borderRadius: 22,
                padding: "30px 18px",
                textAlign: "center",
                border: on
                  ? "1.5px solid rgba(243,186,47,0.8)"
                  : "1px solid rgba(0,0,0,0.1)",
                background: on
                  ? "linear-gradient(180deg, rgba(243,186,47,0.2), #fff)"
                  : "#fff",
                boxShadow: on
                  ? "0 24px 48px -28px rgba(243,186,47,0.6)"
                  : "0 18px 36px -30px rgba(0,0,0,0.3)",
                minHeight: 210,
              }}
            >
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}
              >
                {point.label}
              </div>
              <div
                style={{
                  marginTop: 14,
                  fontSize: 18,
                  color: MUTED,
                  lineHeight: 1.35,
                  fontWeight: 550,
                }}
              >
                {point.detail}
              </div>
            </div>
          );
        })}
      </div>
    </SceneShell>
  );
}

function SceneBuyback() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = sceneById("buyback");
  const local = frame - s.from;
  const r = PROMO_REVEALS.buyback;
  const progress = clamp(local, [20, 110], [0, 1]);

  return (
    <SceneShell
      eyebrow={COPY.buyback.eyebrow}
      title={COPY.buyback.title}
      delay={s.from}
      caption={COPY.buyback.caption}
      captionFrom={s.from + r.caption}
      captionTo={s.to}
    >
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 22 }}>
        <div
          style={{
            position: "relative",
            height: 10,
            margin: "0 4%",
            borderRadius: 99,
            background: "rgba(0,0,0,0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress * 100}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${GOLD}, rgba(243,186,47,0.45))`,
              boxShadow: "0 0 14px rgba(243,186,47,0.65)",
            }}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 20,
            width: "100%",
          }}
        >
          {COPY.buyback.steps.map((step, i) => {
            const enter = enterSpring(local, r.elements[i], fps, 0.8);
            const lit = progress > i / 3.2;
            return (
              <div
                key={step.step}
                style={{
                  opacity: enter,
                  transform: `translateY(${(1 - enter) * 36}px)`,
                  borderRadius: 22,
                  border: lit
                    ? "1.5px solid rgba(243,186,47,0.65)"
                    : "1px solid rgba(0,0,0,0.1)",
                  padding: "28px 22px",
                  background: lit
                    ? "linear-gradient(180deg, rgba(243,186,47,0.14), #fff)"
                    : "#fff",
                  boxShadow: "0 24px 48px -36px rgba(0,0,0,0.35)",
                  minHeight: 230,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 16,
                    fontWeight: 700,
                    color: GOLD,
                    letterSpacing: "0.08em",
                  }}
                >
                  {step.step}
                </div>
                <div
                  style={{
                    fontFamily: DISPLAY,
                    fontSize: 34,
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                    marginTop: 12,
                  }}
                >
                  {step.title}
                </div>
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 20,
                    color: MUTED,
                    lineHeight: 1.4,
                    fontWeight: 550,
                  }}
                >
                  {step.detail}
                </div>
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
  const burst = clamp(local, [r.title, r.title + 20], [0, 1]);

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
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(243,186,47,${0.22 * burst}), transparent 65%)`,
          transform: `scale(${0.8 + burst * 0.35})`,
        }}
      />
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
          transform: `translateY(${(1 - titleIn) * 32}px)`,
          fontFamily: DISPLAY,
          fontSize: 78,
          fontWeight: 700,
          letterSpacing: "-0.045em",
          textAlign: "center",
          marginTop: 18,
          maxWidth: 1400,
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
          marginTop: 32,
          width: "100%",
          maxWidth: 1400,
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
                padding: "26px 28px",
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
                  fontSize: 22,
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
      <CaptionBar
        text={COPY.cta.caption}
        from={s.from + r.caption}
        to={s.to}
      />
    </AbsoluteFill>
  );
}

export function BridgePromo({ bgm = true }: BridgePromoProps) {
  const cover = sceneById("cover");
  const problem = sceneById("problem");
  const reveal = sceneById("reveal");
  const chains = sceneById("chains");
  const widget = sceneById("widget");
  const fee = sceneById("fee");
  const buyback = sceneById("buyback");
  const cta = sceneById("cta");

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <Background />
      <Scene from={cover.from} to={cover.to}>
        <SceneCover />
      </Scene>
      <Scene from={problem.from} to={problem.to}>
        <SceneProblem />
      </Scene>
      <Scene from={reveal.from} to={reveal.to}>
        <SceneReveal />
      </Scene>
      <Scene from={chains.from} to={chains.to}>
        <SceneChains />
      </Scene>
      <Scene from={widget.from} to={widget.to}>
        <SceneWidget />
      </Scene>
      <Scene from={fee.from} to={fee.to}>
        <SceneFee />
      </Scene>
      <Scene from={buyback.from} to={buyback.to}>
        <SceneBuyback />
      </Scene>
      <Scene from={cta.from} to={cta.to}>
        <SceneCta />
      </Scene>
      <PromoSceneWipes scenes={PROMO_SCENES} />
      <BridgePromoAudio bgm={bgm} />
    </AbsoluteFill>
  );
}
