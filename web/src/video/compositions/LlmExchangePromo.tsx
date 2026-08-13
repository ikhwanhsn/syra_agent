/**
 * LLM Exchange launch promo — ~40s @ 30fps, 1920×1080.
 * Craft reference for Syra motion density (see web/src/video/QUALITY_BAR.md).
 * Not a template to clone: new ships invent their own spine, sound, and heroes.
 * Layout/motion primitives live in engine/promoKit.tsx.
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
  COPY,
  LLM_EXCHANGE_PROMO_DURATION,
  LLM_EXCHANGE_PROMO_FPS,
  LLM_EXCHANGE_PROMO_HEIGHT,
  LLM_EXCHANGE_PROMO_WIDTH,
  PROMO_REVEALS,
  PROMO_SCENES,
  sceneById,
} from "@/video/content/llmExchangePromo";
import { LlmExchangePromoAudio } from "@/video/compositions/llmExchangePromoAudio";
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

export const LLM_EXCHANGE_PROMO_FPS_EXPORT = LLM_EXCHANGE_PROMO_FPS;
export {
  LLM_EXCHANGE_PROMO_DURATION,
  LLM_EXCHANGE_PROMO_WIDTH,
  LLM_EXCHANGE_PROMO_HEIGHT,
};

const EARN_TEX = staticFile("video-assets/llm-exchange/earn-llm.png");
const TERM_TEX = staticFile("video-assets/llm-exchange/route-terminal.png");

export type LlmExchangePromoProps = {
  bgm?: boolean;
};

/* ---------------- scenes ---------------- */

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
          fontSize: 108,
          fontWeight: 700,
          letterSpacing: "-0.045em",
          color: FG,
          marginTop: 14,
          textAlign: "center",
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
            width: 64,
            height: 64,
            borderRadius: 99,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `rgba(243,186,47,${0.12 + vs * 0.2})`,
            border: "1px solid rgba(243,186,47,0.45)",
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: 22,
            color: "#8a6a00",
            opacity: vs,
            transform: `scale(${0.6 + vs * 0.4})`,
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
  const panel = enterSpring(local, r.elements[0], fps, 1);
  const scan = clamp(local, [40, 120], [0, 100]);
  const typed = Math.floor(clamp(local, [r.title, r.title + 28], [0, COPY.reveal.title.length]));
  const titleText = COPY.reveal.title.slice(0, typed);

  return (
    <SceneShell
      eyebrow={COPY.reveal.eyebrow}
      title={titleText || " "}
      titleMono
      delay={s.from}
      subtitle={COPY.reveal.body}
      caption={COPY.reveal.caption}
      captionFrom={s.from + r.caption}
      captionTo={s.to}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "0.9fr 1.1fr",
          gap: 36,
          alignItems: "center",
          width: "100%",
          height: "100%",
          minHeight: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            opacity: enterSpring(local, r.elements[1], fps, 0.8),
          }}
        >
          {["OpenAI body in", "Protocol translate", "x402 settle", "Failover out"].map(
            (step, i) => {
              const on = enterSpring(local, r.elements[1] + i * 8, fps, 0.7);
              return (
                <div
                  key={step}
                  style={{
                    opacity: on,
                    transform: `translateX(${(1 - on) * 24}px)`,
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 18px",
                    borderRadius: 14,
                    border: "1px solid rgba(0,0,0,0.1)",
                    background: "#fff",
                    fontFamily: MONO,
                    fontSize: 18,
                    fontWeight: 600,
                  }}
                >
                  <span style={{ color: GOLD }}>{String(i + 1).padStart(2, "0")}</span>
                  {step}
                </div>
              );
            },
          )}
        </div>

        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            maxHeight: 520,
            opacity: panel,
            transform: `translateX(${(1 - panel) * 48}px) scale(${0.94 + panel * 0.06})`,
            borderRadius: 26,
            overflow: "hidden",
            border: "1px solid rgba(0,0,0,0.12)",
            boxShadow: "0 40px 80px -40px rgba(0,0,0,0.55)",
          }}
        >
          <Img
            src={TERM_TEX}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: `${scan}%`,
              height: 3,
              background:
                "linear-gradient(90deg, transparent, rgba(243,186,47,0.85), transparent)",
              boxShadow: "0 0 18px rgba(243,186,47,0.7)",
            }}
          />
        </div>
      </div>
    </SceneShell>
  );
}

function SceneProtocols() {
  const s = sceneById("protocols");
  const r = PROMO_REVEALS.protocols;
  const frame = useCurrentFrame();
  const local = frame - s.from;

  return (
    <SceneShell
      eyebrow={COPY.protocols.eyebrow}
      title={COPY.protocols.title}
      delay={s.from}
      caption={COPY.protocols.caption}
      captionFrom={s.from + r.caption}
      captionTo={s.to}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: 22,
          width: "100%",
          height: "100%",
          maxHeight: 480,
        }}
      >
        {COPY.protocols.items.map((item, i) => {
          const accent = i === Math.floor(clamp(local, [20, 100], [0, 3.99]));
          return (
            <Card
              key={item.id}
              delay={s.from + r.elements[i]}
              accent={accent}
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                minHeight: 0,
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignSelf: "flex-start",
                  padding: "5px 10px",
                  borderRadius: 8,
                  border: "1px solid rgba(243,186,47,0.5)",
                  background: "rgba(243,186,47,0.12)",
                  color: "#8a6a00",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                Protocol 0{i + 1}
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
                {item.label}
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 20,
                  color: MUTED,
                  fontWeight: 500,
                  lineHeight: 1.35,
                }}
              >
                {item.detail}
              </div>
            </Card>
          );
        })}
      </div>
    </SceneShell>
  );
}

function SceneListUi() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = sceneById("listUi");
  const local = frame - s.from;
  const r = PROMO_REVEALS.listUi;
  const shot = enterSpring(local, r.elements[0], fps, 1.05);
  const zoom = interpolate(local, [20, 160], [1, 1.1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  const panX = interpolate(local, [20, 160], [0, -2.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const panY = interpolate(local, [20, 160], [0, -1.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneShell
      eyebrow={COPY.listUi.eyebrow}
      title={COPY.listUi.title}
      delay={s.from}
      caption={COPY.listUi.caption}
      captionFrom={s.from + r.caption}
      captionTo={s.to}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          maxHeight: 520,
          opacity: shot,
          transform: `scale(${0.94 + shot * 0.06})`,
          borderRadius: 26,
          overflow: "hidden",
          border: "1px solid rgba(0,0,0,0.12)",
          boxShadow: "0 40px 90px -42px rgba(0,0,0,0.5)",
        }}
      >
        <Img
          src={EARN_TEX}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center top",
            transform: `scale(${zoom}) translate(${panX}%, ${panY}%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.35) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 28,
            bottom: 24,
            padding: "10px 14px",
            borderRadius: 999,
            background: "rgba(0,0,0,0.72)",
            color: "#fff",
            fontFamily: MONO,
            fontSize: 14,
            fontWeight: 600,
            opacity: enterSpring(local, r.elements[1], fps, 0.7),
          }}
        >
          Provider type · Anthropic (Claude)
        </div>
      </div>
    </SceneShell>
  );
}

function SceneRouting() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = sceneById("routing");
  const local = frame - s.from;
  const r = PROMO_REVEALS.routing;
  const activeIdx = Math.min(
    3,
    Math.max(0, Math.floor((local - 18) / 22)),
  );

  return (
    <SceneShell
      eyebrow={COPY.routing.eyebrow}
      title={COPY.routing.title}
      delay={s.from}
      caption={COPY.routing.caption}
      captionFrom={s.from + r.caption}
      captionTo={s.to}
    >
      <div style={{ width: "100%" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 18,
            width: "100%",
          }}
        >
          {COPY.routing.policies.map((policy, i) => {
            const enter = enterSpring(local, r.elements[i], fps, 0.75);
            const on = i === activeIdx;
            return (
              <div
                key={policy}
                style={{
                  opacity: enter,
                  transform: `translateY(${(1 - enter) * 32}px) scale(${on ? 1.05 : 0.98})`,
                  borderRadius: 22,
                  padding: "34px 18px",
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
                }}
              >
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 26,
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {policy}
                </div>
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 13,
                    color: MUTED,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  X-Syra-Route
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            fontFamily: MONO,
            fontSize: 20,
            color: MUTED,
            opacity: enterSpring(local, 50, fps, 0.7),
          }}
        >
          {["failover", "next healthy", "OpenRouter fallback"].map((label, i) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span
                style={{
                  padding: "8px 14px",
                  borderRadius: 999,
                  border: "1px solid rgba(0,0,0,0.1)",
                  background: i === activeIdx % 3 ? "rgba(243,186,47,0.14)" : "#fff",
                  color: FG,
                  fontWeight: 600,
                }}
              >
                {label}
              </span>
              {i < 2 ? (
                <span style={{ color: GOLD, fontWeight: 800 }}>{">"}</span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </SceneShell>
  );
}

function SceneMoney() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = sceneById("money");
  const local = frame - s.from;
  const r = PROMO_REVEALS.money;
  const progress = clamp(local, [20, 110], [0, 1]);

  return (
    <SceneShell
      eyebrow={COPY.money.eyebrow}
      title={COPY.money.title}
      delay={s.from}
      caption={COPY.money.caption}
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
          {COPY.money.steps.map((step, i) => {
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

export function LlmExchangePromo({ bgm = true }: LlmExchangePromoProps) {
  const cover = sceneById("cover");
  const problem = sceneById("problem");
  const reveal = sceneById("reveal");
  const protocols = sceneById("protocols");
  const listUi = sceneById("listUi");
  const routing = sceneById("routing");
  const money = sceneById("money");
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
      <Scene from={protocols.from} to={protocols.to}>
        <SceneProtocols />
      </Scene>
      <Scene from={listUi.from} to={listUi.to}>
        <SceneListUi />
      </Scene>
      <Scene from={routing.from} to={routing.to}>
        <SceneRouting />
      </Scene>
      <Scene from={money.from} to={money.to}>
        <SceneMoney />
      </Scene>
      <Scene from={cta.from} to={cta.to}>
        <SceneCta />
      </Scene>
      <PromoSceneWipes scenes={PROMO_SCENES} />
      <LlmExchangePromoAudio bgm={bgm} />
    </AbsoluteFill>
  );
}
