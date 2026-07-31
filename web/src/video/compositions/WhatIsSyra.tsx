/**
 * What Is Syra - 16:9 beginner explainer (~150s @ 30fps).
 * Cinematic motion-graphics composition for Remotion Studio / CLI render.
 */
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  CAPABILITIES,
  CTA,
  HOOK,
  HOW_TO,
  IDEA,
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
import {
  Background,
  Caption,
  CYAN,
  Eyebrow,
  FG,
  FlowStepCard,
  FONT,
  GlassCard,
  GOLD,
  MUTED,
  Scene,
  StatusPill,
  SyraLogoMark,
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

function SceneHook() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleIn = spring({
    frame: frame - 12,
    fps,
    config: { damping: 200, stiffness: 110, mass: 1 },
  });
  const subIn = spring({
    frame: frame - 28,
    fps,
    config: { damping: 200, stiffness: 120, mass: 0.85 },
  });
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        fontFamily: FONT,
      }}
    >
      <SyraLogoMark size={132} delay={0} />
      <div style={{ height: 36 }} />
      <Eyebrow text={HOOK.eyebrow} />
      <div
        style={{
          opacity: titleIn,
          transform: `translateY(${(1 - titleIn) * 32}px)`,
          color: FG,
          fontSize: 86,
          fontWeight: 850,
          letterSpacing: "-0.045em",
          textAlign: "center",
          lineHeight: 1.05,
        }}
      >
        {HOOK.title}
      </div>
      <div
        style={{
          opacity: subIn,
          marginTop: 28,
          color: MUTED,
          fontSize: 30,
          fontWeight: 500,
          textAlign: "center",
          maxWidth: 1100,
          lineHeight: 1.4,
        }}
      >
        {HOOK.subtitle}
      </div>
    </AbsoluteFill>
  );
}

function SceneProblem() {
  const start = scene("problem").from;
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <div style={{ position: "absolute", left: 100, top: 120, maxWidth: 820 }}>
        <Eyebrow text={PROBLEM.eyebrow} color={GOLD} />
        <div
          style={{
            color: FG,
            fontSize: 56,
            fontWeight: 850,
            letterSpacing: "-0.035em",
            lineHeight: 1.1,
            whiteSpace: "pre-line",
          }}
        >
          {PROBLEM.title}
        </div>
        <div
          style={{
            color: MUTED,
            fontSize: 26,
            marginTop: 24,
            lineHeight: 1.45,
            maxWidth: 700,
          }}
        >
          {PROBLEM.body}
        </div>
      </div>
      {PROBLEM.painPoints.map((item, i) => (
        <div
          key={item.title}
          style={{ position: "absolute", right: 100, top: 180 + i * 220 }}
        >
          <GlassCard delay={start + 20 + i * 16} width={520}>
            <div
              style={{
                color: GOLD,
                fontSize: 28,
                fontWeight: 800,
                marginBottom: 10,
              }}
            >
              {item.title}
            </div>
            <div style={{ color: MUTED, fontSize: 22, lineHeight: 1.4 }}>
              {item.detail}
            </div>
          </GlassCard>
        </div>
      ))}
    </AbsoluteFill>
  );
}

function SceneIdea() {
  const start = scene("idea").from;
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <div style={{ position: "absolute", left: 100, top: 130, maxWidth: 1000 }}>
        <Eyebrow text={IDEA.eyebrow} color={CYAN} />
        <div
          style={{
            color: FG,
            fontSize: 60,
            fontWeight: 850,
            letterSpacing: "-0.035em",
            lineHeight: 1.08,
          }}
        >
          {IDEA.title}
        </div>
        <div
          style={{
            color: MUTED,
            fontSize: 28,
            marginTop: 28,
            lineHeight: 1.45,
            maxWidth: 920,
          }}
        >
          {IDEA.body}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 100,
          bottom: 140,
          display: "flex",
          gap: 24,
        }}
      >
        {IDEA.bullets.map((b, i) => (
          <GlassCard key={b} delay={start + 24 + i * 14} width={540} padding="22px 26px">
            <div style={{ color: CYAN, fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
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
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <div style={{ position: "absolute", left: 100, top: 100 }}>
        <Eyebrow text="How x402 Works" />
        <div
          style={{
            color: FG,
            fontSize: 48,
            fontWeight: 850,
            letterSpacing: "-0.03em",
          }}
        >
          Four steps. Zero API key chaos.
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          top: 280,
          display: "flex",
          justifyContent: "space-between",
          gap: 20,
        }}
      >
        {X402_STEPS.map((s, i) => (
          <FlowStepCard
            key={s.step}
            step={s.step}
            title={s.title}
            detail={s.detail}
            delay={start + 16 + i * 18}
            width={420}
          />
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: 100,
          right: 100,
          bottom: 130,
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
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <div style={{ position: "absolute", left: 100, top: 100 }}>
        <Eyebrow text="What You Get" />
        <div
          style={{
            color: FG,
            fontSize: 52,
            fontWeight: 850,
            letterSpacing: "-0.03em",
          }}
        >
          Crypto intelligence, pay per call
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 100,
          right: 100,
          top: 260,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 28,
        }}
      >
        {CAPABILITIES.map((c, i) => (
          <GlassCard key={c.title} delay={start + 14 + i * 12} padding="30px 28px">
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
    </AbsoluteFill>
  );
}

function ScenePillars() {
  const start = scene("pillars").from;
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <div style={{ position: "absolute", left: 100, top: 100 }}>
        <Eyebrow text="Five Pillars" />
        <div
          style={{
            color: FG,
            fontSize: 52,
            fontWeight: 850,
            letterSpacing: "-0.03em",
          }}
        >
          One narrative. Honest maturity.
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          top: 280,
          display: "flex",
          gap: 18,
          justifyContent: "space-between",
        }}
      >
        {PILLARS.map((p, i) => (
          <GlassCard
            key={p.name}
            delay={start + 16 + i * 14}
            width={340}
            padding="26px 22px"
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
                marginTop: 16,
              }}
            >
              {p.purpose}
            </div>
          </GlassCard>
        ))}
      </div>
    </AbsoluteFill>
  );
}

function SceneHowTo() {
  const start = scene("howto").from;
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <div style={{ position: "absolute", left: 100, top: 110 }}>
        <Eyebrow text={HOW_TO.eyebrow} color={CYAN} />
        <div
          style={{
            color: FG,
            fontSize: 52,
            fontWeight: 850,
            letterSpacing: "-0.03em",
          }}
        >
          {HOW_TO.title}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 100,
          right: 100,
          top: 300,
          display: "flex",
          gap: 28,
        }}
      >
        {HOW_TO.paths.map((path, i) => (
          <GlassCard key={path.name} delay={start + 18 + i * 16} width={560}>
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
                marginBottom: 16,
              }}
            >
              {path.detail}
            </div>
            <div
              style={{
                color: CYAN,
                fontSize: 20,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                background: "rgba(0,0,0,0.35)",
                borderRadius: 12,
                padding: "14px 16px",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {path.line}
            </div>
          </GlassCard>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: 100,
          right: 100,
          bottom: 130,
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

function SceneToken() {
  const start = scene("token").from;
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <div style={{ position: "absolute", left: 100, top: 90, maxWidth: 900 }}>
        <Eyebrow text={TOKEN.eyebrow} />
        <div
          style={{
            color: FG,
            fontSize: 48,
            fontWeight: 850,
            letterSpacing: "-0.03em",
          }}
        >
          {TOKEN.title}
        </div>
        <div
          style={{
            color: MUTED,
            fontSize: 24,
            marginTop: 18,
            lineHeight: 1.45,
            maxWidth: 820,
          }}
        >
          {TOKEN.body}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 100,
          top: 400,
          display: "flex",
          gap: 22,
        }}
      >
        {TOKEN.utilities.map((u, i) => (
          <GlassCard key={u.title} delay={start + 16 + i * 14} width={540}>
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
          position: "absolute",
          right: 100,
          top: 110,
          display: "flex",
          gap: 16,
        }}
      >
        {TOKEN.stats.map((s, i) => (
          <GlassCard
            key={s.label}
            delay={start + 10 + i * 10}
            width={180}
            padding="20px 18px"
            style={{ textAlign: "center" }}
          >
            <div
              style={{
                color: GOLD,
                fontSize: 32,
                fontWeight: 850,
                letterSpacing: "-0.03em",
              }}
            >
              {s.value}
            </div>
            <div style={{ color: MUTED, fontSize: 14, marginTop: 8 }}>
              {s.label}
            </div>
          </GlassCard>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: 100,
          right: 100,
          bottom: 120,
          color: MUTED,
          fontSize: 20,
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
  const local = frame - start;
  const enter = spring({
    frame: local,
    fps,
    config: { damping: 200, stiffness: 115, mass: 0.95 },
  });
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          opacity: enter,
          transform: `translateY(${(1 - enter) * 24}px)`,
          textAlign: "center",
        }}
      >
        <SyraLogoMark size={110} delay={start} />
        <div style={{ height: 28 }} />
        <div
          style={{
            color: FG,
            fontSize: 68,
            fontWeight: 850,
            letterSpacing: "-0.04em",
            lineHeight: 1.08,
          }}
        >
          {CTA.title}
        </div>
        <div
          style={{
            color: MUTED,
            fontSize: 28,
            marginTop: 20,
            marginBottom: 36,
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
            }}
          >
            {CTA.secondary}
          </div>
        </div>
        <div
          style={{
            marginTop: 40,
            color: GOLD,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "0.2em",
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
