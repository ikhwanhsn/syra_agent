/**
 * What Is Syra - 16:9 beginner explainer (~105s @ 30fps).
 * Cinematic motion-graphics composition for Remotion Studio / CLI render.
 */
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  CAPABILITIES,
  CTA,
  HOOK,
  HOW_TO,
  IDEA,
  LANDSCAPE_REVEALS,
  LANDSCAPE_SCENES,
  PILLARS,
  PROBLEM,
  TOKEN,
  WHAT_IS_SYRA_DURATION,
  WHAT_IS_SYRA_HEIGHT,
  WHAT_IS_SYRA_WIDTH,
  X402_STEPS,
  SYRA_EXPLAINER_FPS,
} from "@/video/content/syraExplainer";
import { ExplainerAudio } from "@/video/compositions/whatIsSyraAudio";
import {
  AccentGlow,
  Background,
  Caption,
  CountUp,
  CYAN,
  Eyebrow,
  FG,
  FlowConnector,
  FlowStepCard,
  FONT,
  GlassCard,
  GOLD,
  GradientText,
  MUTED,
  RED,
  Scene,
  StatusPill,
  SyraLogoMark,
  VIOLET,
} from "@/video/compositions/whatIsSyraShared";

export const WHAT_IS_SYRA_FPS = SYRA_EXPLAINER_FPS;
export {
  WHAT_IS_SYRA_DURATION,
  WHAT_IS_SYRA_WIDTH,
  WHAT_IS_SYRA_HEIGHT,
};

function scene(id: string) {
  const s = LANDSCAPE_SCENES.find((x) => x.id === id);
  if (!s) throw new Error(`Missing scene ${id}`);
  return s;
}

function reveals(id: string) {
  const r = LANDSCAPE_REVEALS[id];
  if (!r) throw new Error(`Missing reveals ${id}`);
  return r;
}

function SceneHook() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const r = reveals("hook");
  const titleIn = spring({
    frame: frame - r.title,
    fps,
    config: { damping: 200, stiffness: 110, mass: 1 },
  });
  const subIn = spring({
    frame: frame - r.title - 16,
    fps,
    config: { damping: 200, stiffness: 120, mass: 0.85 },
  });
  const parallax = Math.sin(frame / 36) * 6;
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        fontFamily: FONT,
      }}
    >
      <SyraLogoMark size={132} delay={r.elements[0]} />
      <div style={{ height: 28 }} />
      <Eyebrow text={HOOK.eyebrow} />
      <div
        style={{
          opacity: titleIn,
          transform: `translateY(${(1 - titleIn) * 32}px)`,
          textAlign: "center",
        }}
      >
        <GradientText fontSize={86}>{HOOK.title}</GradientText>
      </div>
      <div
        style={{
          opacity: subIn,
          marginTop: 24,
          color: MUTED,
          fontSize: 30,
          fontWeight: 500,
          textAlign: "center",
          maxWidth: 1100,
          lineHeight: 1.4,
          transform: `translateY(${parallax}px)`,
        }}
      >
        {HOOK.subtitle}
      </div>
    </AbsoluteFill>
  );
}

function SceneProblem() {
  const start = scene("problem").from;
  const r = reveals("problem");
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <div
        style={{
          position: "absolute",
          left: 90,
          right: 90,
          top: 90,
          bottom: 120,
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
          gap: 48,
        }}
      >
        <div
          style={{
            flex: 1.1,
            maxWidth: 860,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Eyebrow text={PROBLEM.eyebrow} color={GOLD} />
          <div style={{ whiteSpace: "pre-line" }}>
            <GradientText fontSize={56}>{PROBLEM.title}</GradientText>
          </div>
          <div
            style={{
              color: MUTED,
              fontSize: 26,
              marginTop: 26,
              lineHeight: 1.5,
              maxWidth: 720,
            }}
          >
            {PROBLEM.body}
          </div>
          <div
            style={{
              marginTop: 32,
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 20px",
              borderRadius: 14,
              border: `1px solid ${RED}55`,
              background: `${RED}14`,
              color: RED,
              fontSize: 20,
              fontWeight: 700,
              alignSelf: "flex-start",
            }}
          >
            Result: agents stall before the data
          </div>
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            maxWidth: 600,
            gap: 20,
          }}
        >
          {PROBLEM.painPoints.map((item, i) => (
            <div
              key={item.title}
              style={{
                flex: 1,
                display: "flex",
                minHeight: 0,
              }}
            >
              <GlassCard
                delay={start + r.elements[i]}
                width="100%"
                padding="36px 34px"
                glow={
                  i === 0 ? "rgba(255,92,106,0.25)" : "rgba(243,186,47,0.22)"
                }
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    color: GOLD,
                    fontSize: 30,
                    fontWeight: 800,
                    marginBottom: 12,
                  }}
                >
                  {item.title}
                </div>
                <div style={{ color: MUTED, fontSize: 23, lineHeight: 1.4 }}>
                  {item.detail}
                </div>
              </GlassCard>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
}

function SceneIdea() {
  const start = scene("idea").from;
  const r = reveals("idea");
  const miniFlow = ["Request", "402", "Pay USDC"];
  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "70px 100px 140px",
      }}
    >
      <AccentGlow color={CYAN} size={520} x="78%" y="42%" opacity={0.28} />
      <div style={{ display: "flex", gap: 48, alignItems: "flex-start" }}>
        <div style={{ flex: 1.4, maxWidth: 1000 }}>
          <Eyebrow text={IDEA.eyebrow} color={CYAN} />
          <GradientText fontSize={56}>{IDEA.title}</GradientText>
          <div
            style={{
              color: MUTED,
              fontSize: 26,
              marginTop: 22,
              lineHeight: 1.45,
              maxWidth: 920,
            }}
          >
            {IDEA.body}
          </div>
        </div>
        <GlassCard
          delay={start + r.elements[0]}
          width={360}
          padding="22px 24px"
          glow="rgba(62,224,184,0.25)"
        >
          <div
            style={{
              color: CYAN,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.14em",
              marginBottom: 14,
            }}
          >
            MINI FLOW
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {miniFlow.map((label, i) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  color: FG,
                  fontSize: 20,
                  fontWeight: 700,
                }}
              >
                <span style={{ color: GOLD, minWidth: 28 }}>0{i + 1}</span>
                {label}
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
      <div
        style={{
          marginTop: 40,
          display: "flex",
          gap: 20,
        }}
      >
        {IDEA.bullets.map((b, i) => (
          <GlassCard
            key={b}
            delay={start + r.elements[i]}
            width="100%"
            padding="24px 26px"
            glow="rgba(62,224,184,0.22)"
            style={{ flex: 1 }}
          >
            <div
              style={{
                color: CYAN,
                fontSize: 18,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              0{i + 1}
            </div>
            <div style={{ color: FG, fontSize: 24, fontWeight: 700 }}>{b}</div>
          </GlassCard>
        ))}
      </div>
    </AbsoluteFill>
  );
}

function SceneX402() {
  const start = scene("x402").from;
  const r = reveals("x402");
  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "60px 80px 130px",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <Eyebrow text="How x402 Works" />
        <GradientText fontSize={48}>Four steps. Zero API key chaos.</GradientText>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 16,
          marginBottom: 36,
        }}
      >
        <GlassCard
          delay={start + (r.counts?.[0] ?? 8)}
          padding="14px 22px"
          glow="rgba(62,224,184,0.28)"
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <div style={{ color: MUTED, fontSize: 18, fontWeight: 600 }}>
              Sample call
            </div>
            <CountUp
              target={0.01}
              delay={start + (r.counts?.[0] ?? 8)}
              duration={40}
              prefix="$"
              suffix=" USDC"
              decimals={2}
              fontSize={28}
              color={CYAN}
            />
          </div>
        </GlassCard>
        <GlassCard
          delay={start + r.elements[0]}
          padding="14px 22px"
          glow="rgba(243,186,47,0.22)"
        >
          <div style={{ color: GOLD, fontSize: 18, fontWeight: 700 }}>
            Settles on Solana
          </div>
        </GlassCard>
      </div>
      <div style={{ position: "relative", paddingTop: 24 }}>
        <FlowConnector delay={start + 10} top={0} left={40} right={40} />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 18,
            marginTop: 28,
          }}
        >
          {X402_STEPS.map((s, i) => (
            <FlowStepCard
              key={s.step}
              step={s.step}
              title={s.title}
              detail={s.detail}
              delay={start + r.elements[i]}
              width={420}
            />
          ))}
        </div>
      </div>
      <div
        style={{
          marginTop: 32,
          color: MUTED,
          fontSize: 22,
          textAlign: "center",
        }}
      >
        Settlement happens on Solana. Your agent keeps building.
      </div>
    </AbsoluteFill>
  );
}

function SceneCapabilities() {
  const start = scene("capabilities").from;
  const r = reveals("capabilities");
  const glows = [
    "rgba(243,186,47,0.22)",
    "rgba(62,224,184,0.2)",
    "rgba(167,139,250,0.22)",
  ];
  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "70px 100px 140px",
      }}
    >
      <div style={{ marginBottom: 32 }}>
        <Eyebrow text="What You Get" />
        <GradientText fontSize={52}>Crypto intelligence, pay per call</GradientText>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 24,
        }}
      >
        {CAPABILITIES.map((c, i) => (
          <GlassCard
            key={c.title}
            delay={start + r.elements[i]}
            padding="34px 30px"
            glow={glows[i % glows.length]}
          >
            <div
              style={{
                color: GOLD,
                fontSize: 28,
                fontWeight: 800,
                marginBottom: 12,
              }}
            >
              {c.title}
            </div>
            <div style={{ color: MUTED, fontSize: 22, lineHeight: 1.4 }}>
              {c.detail}
            </div>
          </GlassCard>
        ))}
      </div>
      <div
        style={{
          marginTop: 28,
          textAlign: "center",
          color: CYAN,
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: "0.06em",
        }}
      >
        One API. Pay per call.
      </div>
    </AbsoluteFill>
  );
}

function ScenePillars() {
  const start = scene("pillars").from;
  const r = reveals("pillars");
  const statusGlow: Record<string, string> = {
    Live: "rgba(62,224,184,0.28)",
    Beta: "rgba(243,186,47,0.25)",
    Infra: "rgba(255,255,255,0.18)",
    Roadmap: "rgba(167,139,250,0.22)",
  };
  const legend = [
    { label: "Live", color: CYAN },
    { label: "Beta", color: GOLD },
    { label: "Infra", color: FG },
    { label: "Roadmap", color: VIOLET },
  ];
  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "70px 70px 140px",
      }}
    >
      <div style={{ marginBottom: 28 }}>
        <Eyebrow text="Five Pillars" />
        <GradientText fontSize={52}>One narrative. Honest maturity.</GradientText>
      </div>
      <div
        style={{
          display: "flex",
          gap: 16,
          justifyContent: "space-between",
        }}
      >
        {PILLARS.map((p, i) => (
          <GlassCard
            key={p.name}
            delay={start + r.elements[i]}
            width={340}
            padding="30px 22px"
            glow={statusGlow[p.status]}
          >
            <div
              style={{
                color: FG,
                fontSize: 30,
                fontWeight: 850,
                letterSpacing: "-0.02em",
                marginBottom: 14,
              }}
            >
              {p.name}
            </div>
            <StatusPill status={p.status} />
            <div
              style={{
                color: MUTED,
                fontSize: 18,
                lineHeight: 1.4,
                marginTop: 18,
              }}
            >
              {p.purpose}
            </div>
          </GlassCard>
        ))}
      </div>
      <div
        style={{
          marginTop: 28,
          display: "flex",
          justifyContent: "center",
          gap: 28,
        }}
      >
        {legend.map((item) => (
          <div
            key={item.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: MUTED,
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: item.color,
                boxShadow: `0 0 10px ${item.color}`,
              }}
            />
            {item.label}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
}

function TypeLine({
  text,
  delay,
}: {
  text: string;
  delay: number;
}) {
  const frame = useCurrentFrame();
  const chars = Math.floor(
    interpolate(frame - delay, [0, 28], [0, text.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  return (
    <div
      style={{
        color: CYAN,
        fontSize: 20,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        background: "rgba(0,0,0,0.4)",
        borderRadius: 12,
        padding: "14px 16px",
        border: "1px solid rgba(62,224,184,0.25)",
        boxShadow: "0 0 20px rgba(62,224,184,0.12)",
        minHeight: 52,
      }}
    >
      {text.slice(0, chars)}
      <span style={{ opacity: (frame - delay) % 20 < 10 ? 1 : 0.2 }}>|</span>
    </div>
  );
}

function SceneHowTo() {
  const start = scene("howto").from;
  const r = reveals("howto");
  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "70px 100px 140px",
      }}
    >
      <div style={{ marginBottom: 32 }}>
        <Eyebrow text={HOW_TO.eyebrow} color={CYAN} />
        <GradientText fontSize={52}>{HOW_TO.title}</GradientText>
      </div>
      <div style={{ display: "flex", gap: 24 }}>
        {HOW_TO.paths.map((path, i) => (
          <GlassCard
            key={path.name}
            delay={start + r.elements[i]}
            width="100%"
            padding="32px 28px"
            glow="rgba(62,224,184,0.2)"
            style={{ flex: 1 }}
          >
            <div
              style={{
                color: GOLD,
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: "0.12em",
                marginBottom: 10,
              }}
            >
              {path.name}
            </div>
            <div
              style={{
                color: FG,
                fontSize: 32,
                fontWeight: 800,
                marginBottom: 18,
              }}
            >
              {path.detail}
            </div>
            <TypeLine
              text={path.line}
              delay={start + (r.keys?.[i] ?? r.elements[i] + 10)}
            />
          </GlassCard>
        ))}
      </div>
      <div
        style={{
          marginTop: 28,
          color: MUTED,
          fontSize: 24,
          textAlign: "center",
        }}
      >
        {HOW_TO.note}
      </div>
    </AbsoluteFill>
  );
}

const TOKEN_COUNTUPS = [
  { target: 1, suffix: "B", label: "Total supply" },
  { target: 995, suffix: "M", label: "Circulating" },
  { target: 5, suffix: "M+", label: "Burned" },
];

function SceneToken() {
  const start = scene("token").from;
  const r = reveals("token");
  const stats = r.elements.slice(0, 3);
  const utilities = r.elements.slice(3, 6);
  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "60px 100px 130px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 40,
          alignItems: "flex-start",
          marginBottom: 28,
        }}
      >
        <div style={{ maxWidth: 900, flex: 1 }}>
          <Eyebrow text={TOKEN.eyebrow} />
          <GradientText fontSize={48}>{TOKEN.title}</GradientText>
          <div
            style={{
              color: MUTED,
              fontSize: 22,
              marginTop: 16,
              lineHeight: 1.45,
              maxWidth: 820,
            }}
          >
            {TOKEN.body}
          </div>
          <div
            style={{
              marginTop: 18,
              display: "inline-flex",
              padding: "10px 16px",
              borderRadius: 12,
              border: `1px solid ${GOLD}66`,
              background: `${GOLD}14`,
              color: GOLD,
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            ~80% buybacks feed usage rewards
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {TOKEN_COUNTUPS.map((s, i) => (
            <GlassCard
              key={s.label}
              delay={start + stats[i]}
              width={200}
              padding="18px 16px"
              style={{ textAlign: "center" }}
              glow="rgba(243,186,47,0.3)"
            >
              <CountUp
                target={s.target}
                delay={start + (r.counts?.[i] ?? stats[i] + 4)}
                duration={32}
                suffix={s.suffix}
                fontSize={30}
                color={GOLD}
              />
              <div style={{ color: MUTED, fontSize: 13, marginTop: 6 }}>
                {s.label}
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 20 }}>
        {TOKEN.utilities.map((u, i) => (
          <GlassCard
            key={u.title}
            delay={start + utilities[i]}
            width="100%"
            padding="28px 26px"
            glow="rgba(243,186,47,0.28)"
            style={{ flex: 1 }}
          >
            <div
              style={{
                color: GOLD,
                fontSize: 26,
                fontWeight: 800,
                marginBottom: 12,
              }}
            >
              {u.title}
            </div>
            <div style={{ color: MUTED, fontSize: 20, lineHeight: 1.4 }}>
              {u.detail}
            </div>
          </GlassCard>
        ))}
      </div>
      <div
        style={{
          marginTop: 24,
          color: MUTED,
          fontSize: 18,
          textAlign: "center",
          fontWeight: 500,
        }}
      >
        {TOKEN.disclaimer}
      </div>
    </AbsoluteFill>
  );
}

function SceneCta() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = scene("cta").from;
  const r = reveals("cta");
  const local = frame - start;
  const enter = spring({
    frame: local,
    fps,
    config: { damping: 200, stiffness: 115, mass: 0.95 },
  });
  const pulse = 1 + 0.03 * Math.sin(local / 12);
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        fontFamily: FONT,
        paddingTop: 20,
        paddingBottom: 80,
      }}
    >
      <div
        style={{
          opacity: enter,
          transform: `translateY(${(1 - enter) * 24}px)`,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <SyraLogoMark size={110} delay={start + r.elements[0]} />
        <div style={{ height: 24 }} />
        <GradientText fontSize={68}>{CTA.title}</GradientText>
        <div
          style={{
            color: MUTED,
            fontSize: 28,
            marginTop: 18,
            marginBottom: 32,
          }}
        >
          {CTA.subtitle}
        </div>
        <div
          style={{
            display: "flex",
            gap: 20,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              padding: "16px 32px",
              borderRadius: 999,
              background: GOLD,
              color: "#111",
              fontSize: 24,
              fontWeight: 800,
              transform: `scale(${pulse})`,
              boxShadow: `0 0 36px rgba(243,186,47,0.55)`,
            }}
          >
            {CTA.primary}
          </div>
          <div
            style={{
              padding: "16px 32px",
              borderRadius: 999,
              border: `1px solid ${GOLD}`,
              color: GOLD,
              fontSize: 24,
              fontWeight: 700,
              boxShadow: `0 0 20px rgba(243,186,47,0.2)`,
            }}
          >
            {CTA.secondary}
          </div>
        </div>
        <div
          style={{
            marginTop: 36,
            color: GOLD,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textShadow: `0 0 20px rgba(243,186,47,0.45)`,
          }}
        >
          {CTA.badge}
        </div>
      </div>
    </AbsoluteFill>
  );
}

export function WhatIsSyra() {
  const scenes = LANDSCAPE_SCENES;
  return (
    <AbsoluteFill style={{ backgroundColor: "#050505", overflow: "hidden" }}>
      <Background />
      <ExplainerAudio
        scenes={scenes}
        reveals={LANDSCAPE_REVEALS}
        durationInFrames={WHAT_IS_SYRA_DURATION}
        hookHitFrame={12}
      />

      <Scene from={scenes[0].from} to={scenes[0].to}>
        <SceneHook />
      </Scene>
      <Caption from={scenes[0].from + 20} to={scenes[0].to - 5} text={scenes[0].caption} />

      <Scene from={scenes[1].from} to={scenes[1].to}>
        <SceneProblem />
      </Scene>
      <Caption from={scenes[1].from + 15} to={scenes[1].to - 5} text={scenes[1].caption} />

      <Scene from={scenes[2].from} to={scenes[2].to}>
        <SceneIdea />
      </Scene>
      <Caption from={scenes[2].from + 15} to={scenes[2].to - 5} text={scenes[2].caption} />

      <Scene from={scenes[3].from} to={scenes[3].to}>
        <SceneX402 />
      </Scene>
      <Caption from={scenes[3].from + 15} to={scenes[3].to - 5} text={scenes[3].caption} />

      <Scene from={scenes[4].from} to={scenes[4].to}>
        <SceneCapabilities />
      </Scene>
      <Caption from={scenes[4].from + 15} to={scenes[4].to - 5} text={scenes[4].caption} />

      <Scene from={scenes[5].from} to={scenes[5].to}>
        <ScenePillars />
      </Scene>
      <Caption from={scenes[5].from + 15} to={scenes[5].to - 5} text={scenes[5].caption} />

      <Scene from={scenes[6].from} to={scenes[6].to}>
        <SceneHowTo />
      </Scene>
      <Caption from={scenes[6].from + 15} to={scenes[6].to - 5} text={scenes[6].caption} />

      <Scene from={scenes[7].from} to={scenes[7].to}>
        <SceneToken />
      </Scene>
      <Caption from={scenes[7].from + 15} to={scenes[7].to - 5} text={scenes[7].caption} />

      <Scene from={scenes[8].from} to={scenes[8].to}>
        <SceneCta />
      </Scene>
      <Caption from={scenes[8].from + 10} to={scenes[8].to - 2} text={scenes[8].caption} />
    </AbsoluteFill>
  );
}
