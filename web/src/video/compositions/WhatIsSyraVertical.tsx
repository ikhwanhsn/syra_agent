/**
 * What Is Syra - 9:16 vertical cut (~60s @ 30fps) for X / Shorts / Reels.
 * Reuses shared primitives and content; portrait-relayouted scenes.
 */
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  CAPABILITIES,
  CTA,
  HOOK,
  HOW_TO,
  IDEA,
  PILLARS,
  PROBLEM,
  SYRA_EXPLAINER_FPS,
  TOKEN,
  VERTICAL_REVEALS,
  VERTICAL_SCENES,
  WHAT_IS_SYRA_V_DURATION,
  WHAT_IS_SYRA_V_HEIGHT,
  WHAT_IS_SYRA_V_WIDTH,
  X402_STEPS,
} from "@/video/content/syraExplainer";
import { ExplainerAudio } from "@/video/compositions/whatIsSyraAudio";
import {
  Background,
  Caption,
  CountUp,
  CYAN,
  Eyebrow,
  FG,
  FONT,
  GlassCard,
  GOLD,
  GradientText,
  MUTED,
  Scene,
  StatusPill,
  SyraLogoMark,
} from "@/video/compositions/whatIsSyraShared";

export const WHAT_IS_SYRA_V_FPS = SYRA_EXPLAINER_FPS;
export {
  WHAT_IS_SYRA_V_DURATION,
  WHAT_IS_SYRA_V_WIDTH,
  WHAT_IS_SYRA_V_HEIGHT,
};

function scene(id: string) {
  const s = VERTICAL_SCENES.find((x) => x.id === id);
  if (!s) throw new Error(`Missing vertical scene ${id}`);
  return s;
}

function reveals(id: string) {
  const r = VERTICAL_REVEALS[id];
  if (!r) throw new Error(`Missing vertical reveals ${id}`);
  return r;
}

function VHook() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const r = reveals("hook");
  const titleIn = spring({
    frame: frame - r.title,
    fps,
    config: { damping: 200, stiffness: 110, mass: 1 },
  });
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        fontFamily: FONT,
        padding: "0 56px",
      }}
    >
      <SyraLogoMark size={140} delay={r.elements[0]} />
      <div style={{ height: 36 }} />
      <Eyebrow text={HOOK.eyebrow} fontSize={18} />
      <div
        style={{
          opacity: titleIn,
          transform: `translateY(${(1 - titleIn) * 28}px)`,
          textAlign: "center",
        }}
      >
        <GradientText fontSize={64}>{HOOK.title}</GradientText>
      </div>
      <div
        style={{
          marginTop: 22,
          color: MUTED,
          fontSize: 26,
          textAlign: "center",
          lineHeight: 1.4,
          maxWidth: 880,
        }}
      >
        Machine money for AI agents on Solana
      </div>
    </AbsoluteFill>
  );
}

function VProblem() {
  const start = scene("problem").from;
  const r = reveals("problem");
  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT,
        padding: "100px 56px 120px",
        justifyContent: "center",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Eyebrow text={PROBLEM.eyebrow} fontSize={18} />
      <div style={{ whiteSpace: "pre-line", marginBottom: 24 }}>
        <GradientText fontSize={46}>{PROBLEM.title}</GradientText>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {PROBLEM.painPoints.map((item, i) => (
          <GlassCard
            key={item.title}
            delay={start + r.elements[i]}
            padding="22px 24px"
            glow={i === 0 ? "rgba(255,92,106,0.25)" : "rgba(243,186,47,0.22)"}
          >
            <div
              style={{
                color: GOLD,
                fontSize: 26,
                fontWeight: 800,
                marginBottom: 8,
              }}
            >
              {item.title}
            </div>
            <div style={{ color: MUTED, fontSize: 22, lineHeight: 1.35 }}>
              {item.detail}
            </div>
          </GlassCard>
        ))}
      </div>
    </AbsoluteFill>
  );
}

function VIdea() {
  const start = scene("idea").from;
  const r = reveals("idea");
  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT,
        padding: "100px 56px 120px",
        justifyContent: "center",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Eyebrow text={IDEA.eyebrow} color={CYAN} fontSize={18} />
      <div style={{ marginBottom: 18 }}>
        <GradientText fontSize={46}>{IDEA.title}</GradientText>
      </div>
      <div
        style={{
          color: MUTED,
          fontSize: 24,
          lineHeight: 1.45,
          marginBottom: 28,
        }}
      >
        Pay tiny USDC per call, automatically. No per-vendor API keys.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {IDEA.bullets.map((b, i) => (
          <GlassCard
            key={b}
            delay={start + r.elements[i]}
            padding="20px 24px"
            glow="rgba(62,224,184,0.22)"
          >
            <div style={{ color: FG, fontSize: 24, fontWeight: 700 }}>{b}</div>
          </GlassCard>
        ))}
      </div>
    </AbsoluteFill>
  );
}

function VX402() {
  const start = scene("x402").from;
  const r = reveals("x402");
  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT,
        padding: "90px 48px 110px",
        justifyContent: "center",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Eyebrow text="How x402 Works" fontSize={18} />
      <div style={{ marginBottom: 12 }}>
        <GradientText fontSize={42}>Call. Pay. Get data.</GradientText>
      </div>
      <div
        style={{
          marginBottom: 18,
          display: "flex",
          alignItems: "baseline",
          gap: 8,
        }}
      >
        <span style={{ color: MUTED, fontSize: 18 }}>Sample</span>
        <CountUp
          target={0.01}
          delay={start + (r.counts?.[0] ?? 6)}
          duration={28}
          prefix="$"
          suffix=" USDC"
          decimals={2}
          fontSize={24}
          color={CYAN}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {X402_STEPS.map((s, i) => (
          <GlassCard
            key={s.step}
            delay={start + r.elements[i]}
            padding="18px 22px"
          >
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div
                style={{
                  color: GOLD,
                  fontSize: 28,
                  fontWeight: 850,
                  minWidth: 36,
                }}
              >
                {s.step}
              </div>
              <div>
                <div
                  style={{
                    color: FG,
                    fontSize: 24,
                    fontWeight: 750,
                    marginBottom: 6,
                  }}
                >
                  {s.title}
                </div>
                <div style={{ color: MUTED, fontSize: 18, lineHeight: 1.35 }}>
                  {s.detail}
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </AbsoluteFill>
  );
}

function VCapabilities() {
  const start = scene("capabilities").from;
  const r = reveals("capabilities");
  const items = CAPABILITIES.slice(0, 4);
  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT,
        padding: "100px 48px 120px",
        justifyContent: "center",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Eyebrow text="What You Get" fontSize={18} />
      <div style={{ marginBottom: 24 }}>
        <GradientText fontSize={42}>Crypto intelligence</GradientText>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
        }}
      >
        {items.map((c, i) => (
          <GlassCard
            key={c.title}
            delay={start + r.elements[i]}
            padding="22px 20px"
          >
            <div
              style={{
                color: GOLD,
                fontSize: 24,
                fontWeight: 800,
                marginBottom: 8,
              }}
            >
              {c.title}
            </div>
            <div style={{ color: MUTED, fontSize: 18, lineHeight: 1.35 }}>
              {c.detail}
            </div>
          </GlassCard>
        ))}
      </div>
    </AbsoluteFill>
  );
}

function VPillars() {
  const start = scene("pillars").from;
  const r = reveals("pillars");
  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT,
        padding: "90px 48px 110px",
        justifyContent: "center",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Eyebrow text="Five Pillars" fontSize={18} />
      <div style={{ marginBottom: 20 }}>
        <GradientText fontSize={40}>Honest maturity</GradientText>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {PILLARS.map((p, i) => (
          <GlassCard
            key={p.name}
            delay={start + r.elements[i]}
            padding="16px 20px"
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    color: FG,
                    fontSize: 26,
                    fontWeight: 800,
                    marginBottom: 4,
                  }}
                >
                  {p.name}
                </div>
                <div style={{ color: MUTED, fontSize: 16 }}>{p.purpose}</div>
              </div>
              <StatusPill status={p.status} />
            </div>
          </GlassCard>
        ))}
      </div>
    </AbsoluteFill>
  );
}

function VHowTo() {
  const start = scene("howto").from;
  const r = reveals("howto");
  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT,
        padding: "100px 48px 120px",
        justifyContent: "center",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Eyebrow text={HOW_TO.eyebrow} color={CYAN} fontSize={18} />
      <div style={{ marginBottom: 24 }}>
        <GradientText fontSize={42}>Start in minutes</GradientText>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {HOW_TO.paths.map((path, i) => (
          <GlassCard
            key={path.name}
            delay={start + r.elements[i]}
            padding="20px 22px"
          >
            <div
              style={{
                color: GOLD,
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: "0.1em",
                marginBottom: 6,
              }}
            >
              {path.name}
            </div>
            <div
              style={{
                color: FG,
                fontSize: 26,
                fontWeight: 800,
                marginBottom: 10,
              }}
            >
              {path.detail}
            </div>
            <div
              style={{
                color: CYAN,
                fontSize: 16,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              }}
            >
              {path.line}
            </div>
          </GlassCard>
        ))}
      </div>
    </AbsoluteFill>
  );
}

function VToken() {
  const start = scene("token").from;
  const r = reveals("token");
  const stats = r.elements.slice(0, 3);
  const utilities = r.elements.slice(3, 6);
  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT,
        padding: "90px 48px 110px",
        justifyContent: "center",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Eyebrow text={TOKEN.eyebrow} fontSize={18} />
      <div style={{ marginBottom: 16 }}>
        <GradientText fontSize={40}>{TOKEN.title}</GradientText>
      </div>
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 16,
          justifyContent: "space-between",
        }}
      >
        {[
          { target: 1, suffix: "B", label: "Supply" },
          { target: 995, suffix: "M", label: "Circ." },
          { target: 5, suffix: "M+", label: "Burned" },
        ].map((s, i) => (
          <GlassCard
            key={s.label}
            delay={start + stats[i]}
            padding="14px 12px"
            style={{ flex: 1, textAlign: "center" }}
            glow="rgba(243,186,47,0.28)"
          >
            <CountUp
              target={s.target}
              delay={start + (r.counts?.[i] ?? stats[i] + 2)}
              duration={24}
              suffix={s.suffix}
              fontSize={26}
              color={GOLD}
            />
            <div style={{ color: MUTED, fontSize: 12, marginTop: 4 }}>
              {s.label}
            </div>
          </GlassCard>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {TOKEN.utilities.map((u, i) => (
          <GlassCard
            key={u.title}
            delay={start + utilities[i]}
            padding="18px 20px"
            glow="rgba(243,186,47,0.25)"
          >
            <div
              style={{
                color: GOLD,
                fontSize: 22,
                fontWeight: 800,
                marginBottom: 6,
              }}
            >
              {u.title}
            </div>
            <div style={{ color: MUTED, fontSize: 18, lineHeight: 1.35 }}>
              {u.detail}
            </div>
          </GlassCard>
        ))}
      </div>
      <div
        style={{
          color: MUTED,
          fontSize: 16,
          lineHeight: 1.4,
          textAlign: "center",
        }}
      >
        {TOKEN.disclaimer}
      </div>
    </AbsoluteFill>
  );
}

function VCta() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = scene("cta").from;
  const r = reveals("cta");
  const enter = spring({
    frame: frame - start,
    fps,
    config: { damping: 200, stiffness: 115, mass: 0.95 },
  });
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        fontFamily: FONT,
        padding: "0 48px 48px",
      }}
    >
      <div
        style={{
          opacity: enter,
          transform: `translateY(${(1 - enter) * 20}px)`,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <SyraLogoMark size={120} delay={start + r.elements[0]} />
        <div style={{ height: 24 }} />
        <GradientText fontSize={52}>{CTA.title}</GradientText>
        <div
          style={{
            color: MUTED,
            fontSize: 24,
            marginTop: 16,
            marginBottom: 28,
          }}
        >
          {CTA.subtitle}
        </div>
        <div
          style={{
            padding: "16px 36px",
            borderRadius: 999,
            background: GOLD,
            color: "#111",
            fontSize: 26,
            fontWeight: 800,
            display: "inline-block",
            boxShadow: "0 0 36px rgba(243,186,47,0.55)",
            transform: `scale(${1 + 0.03 * Math.sin((frame - start) / 12)})`,
          }}
        >
          {CTA.primary}
        </div>
        <div
          style={{
            marginTop: 18,
            color: GOLD,
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          {CTA.secondary}
        </div>
        <div
          style={{
            marginTop: 32,
            color: GOLD,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.18em",
          }}
        >
          {CTA.badge}
        </div>
      </div>
    </AbsoluteFill>
  );
}

export function WhatIsSyraVertical() {
  const scenes = VERTICAL_SCENES;
  const cap = {
    bottom: 72,
    fontSize: 22,
    sidePad: 40,
  };
  return (
    <AbsoluteFill style={{ backgroundColor: "#050505", overflow: "hidden" }}>
      <Background />
      <ExplainerAudio
        scenes={scenes}
        reveals={VERTICAL_REVEALS}
        durationInFrames={WHAT_IS_SYRA_V_DURATION}
        hookHitFrame={10}
      />

      <Scene from={scenes[0].from} to={scenes[0].to}>
        <VHook />
      </Scene>
      <Caption
        from={scenes[0].from + 16}
        to={scenes[0].to - 4}
        text={scenes[0].caption}
        {...cap}
      />

      <Scene from={scenes[1].from} to={scenes[1].to}>
        <VProblem />
      </Scene>
      <Caption
        from={scenes[1].from + 12}
        to={scenes[1].to - 4}
        text={scenes[1].caption}
        {...cap}
      />

      <Scene from={scenes[2].from} to={scenes[2].to}>
        <VIdea />
      </Scene>
      <Caption
        from={scenes[2].from + 12}
        to={scenes[2].to - 4}
        text={scenes[2].caption}
        {...cap}
      />

      <Scene from={scenes[3].from} to={scenes[3].to}>
        <VX402 />
      </Scene>
      <Caption
        from={scenes[3].from + 12}
        to={scenes[3].to - 4}
        text={scenes[3].caption}
        {...cap}
      />

      <Scene from={scenes[4].from} to={scenes[4].to}>
        <VCapabilities />
      </Scene>
      <Caption
        from={scenes[4].from + 12}
        to={scenes[4].to - 4}
        text={scenes[4].caption}
        {...cap}
      />

      <Scene from={scenes[5].from} to={scenes[5].to}>
        <VPillars />
      </Scene>
      <Caption
        from={scenes[5].from + 12}
        to={scenes[5].to - 4}
        text={scenes[5].caption}
        {...cap}
      />

      <Scene from={scenes[6].from} to={scenes[6].to}>
        <VHowTo />
      </Scene>
      <Caption
        from={scenes[6].from + 12}
        to={scenes[6].to - 4}
        text={scenes[6].caption}
        {...cap}
      />

      <Scene from={scenes[7].from} to={scenes[7].to}>
        <VToken />
      </Scene>
      <Caption
        from={scenes[7].from + 12}
        to={scenes[7].to - 4}
        text={scenes[7].caption}
        {...cap}
      />

      <Scene from={scenes[8].from} to={scenes[8].to}>
        <VCta />
      </Scene>
      <Caption
        from={scenes[8].from + 8}
        to={scenes[8].to - 2}
        text={scenes[8].caption}
        {...cap}
      />
    </AbsoluteFill>
  );
}
