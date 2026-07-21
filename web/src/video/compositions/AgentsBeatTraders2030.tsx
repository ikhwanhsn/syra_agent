import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/** ~90s @ 30fps — dark motion-graphics explainer. */
export const AGENTS_BEAT_TRADERS_FPS = 30;
export const AGENTS_BEAT_TRADERS_DURATION = 90 * AGENTS_BEAT_TRADERS_FPS;
export const AGENTS_BEAT_TRADERS_WIDTH = 1920;
export const AGENTS_BEAT_TRADERS_HEIGHT = 1080;

const BG = "#050505";
const FG = "rgba(255,255,255,0.95)";
const MUTED = "rgba(255,255,255,0.48)";
const GOLD = "#F3BA2F";
const CYAN = "#3EE0B8";
const RED = "#FF5C6A";

function clamp(frame: number, inRange: [number, number], outRange: [number, number]) {
  return interpolate(frame, inRange, outRange, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
}

function Scene({
  from,
  to,
  children,
}: {
  from: number;
  to: number;
  children: React.ReactNode;
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

function Caption({ text, from, to }: { text: string; from: number; to: number }) {
  const frame = useCurrentFrame();
  if (frame < from || frame > to) return null;
  const opacity = clamp(frame, [from, from + 10], [0, 1]);
  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        right: 80,
        bottom: 56,
        opacity,
        textAlign: "center",
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 28,
        fontWeight: 600,
        color: "rgba(255,255,255,0.88)",
        letterSpacing: "-0.01em",
        textShadow: "0 2px 24px rgba(0,0,0,0.85)",
      }}
    >
      {text}
    </div>
  );
}

function TweetCard({
  handle,
  body,
  x,
  y,
  rotate,
  delay,
}: {
  handle: string;
  body: string;
  x: number;
  y: number;
  rotate: number;
  delay: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200, stiffness: 120, mass: 0.9 },
  });
  const float = Math.sin((frame + delay) / 28) * 6;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + float,
        width: 360,
        padding: "18px 20px",
        borderRadius: 18,
        background: "linear-gradient(165deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03))",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
        transform: `scale(${0.86 + enter * 0.14}) rotate(${rotate}deg)`,
        opacity: enter,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div style={{ color: GOLD, fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{handle}</div>
      <div style={{ color: FG, fontSize: 18, lineHeight: 1.35, fontWeight: 500 }}>{body}</div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  accent,
  x,
  y,
  delay,
}: {
  label: string;
  value: string;
  accent: string;
  x: number;
  y: number;
  delay: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200, stiffness: 130, mass: 0.85 },
  });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 340,
        padding: "28px 30px",
        borderRadius: 22,
        background: "linear-gradient(165deg, rgba(255,255,255,0.09), rgba(255,255,255,0.02))",
        border: "1px solid rgba(255,255,255,0.12)",
        opacity: enter,
        transform: `translateY(${(1 - enter) * 28}px)`,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div style={{ color: MUTED, fontSize: 16, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ color: accent, fontSize: 48, fontWeight: 800, marginTop: 10, letterSpacing: "-0.03em" }}>
        {value}
      </div>
    </div>
  );
}

function Background() {
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
          background: "radial-gradient(ellipse 60% 50% at 80% 80%, rgba(62,224,184,0.05), transparent 65%)",
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

function SceneHook() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleIn = spring({ frame, fps, config: { damping: 200, stiffness: 110, mass: 1 } });
  const yearIn = spring({ frame: frame - 18, fps, config: { damping: 200, stiffness: 120, mass: 0.8 } });
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          opacity: yearIn,
          color: GOLD,
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: "0.28em",
          marginBottom: 28,
          textTransform: "uppercase",
        }}
      >
        Market Thesis
      </div>
      <div
        style={{
          opacity: titleIn,
          transform: `translateY(${(1 - titleIn) * 36}px)`,
          color: FG,
          fontSize: 86,
          fontWeight: 850,
          letterSpacing: "-0.045em",
          textAlign: "center",
          lineHeight: 1.05,
          maxWidth: 1500,
        }}
      >
        AI Agents can beat
        <br />
        <span style={{ color: GOLD }}>all traders</span> in 2030
      </div>
    </AbsoluteFill>
  );
}

function SceneMyth() {
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 100,
          top: 160,
          fontFamily: "Inter, system-ui, sans-serif",
          maxWidth: 780,
        }}
      >
        <div style={{ color: GOLD, fontSize: 20, fontWeight: 700, letterSpacing: "0.2em", marginBottom: 20 }}>
          THE MYTH
        </div>
        <div style={{ color: FG, fontSize: 58, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.1 }}>
          Humans still own
          <br />
          the edge.
        </div>
        <div style={{ color: MUTED, fontSize: 28, marginTop: 24, lineHeight: 1.4, maxWidth: 620 }}>
          Discretion. Experience. Gut feel. That’s the story CT still sells.
        </div>
      </div>
      <TweetCard handle="@alpha_calls" body="Trust the chart. Trust the trader. AI can’t feel the market." x={1080} y={160} rotate={-4} delay={158} />
      <TweetCard handle="@desk_legend" body="Been trading 12 years. No bot replaces intuition." x={1180} y={420} rotate={3} delay={168} />
      <TweetCard handle="@macro_king" body="Agents are toys. Real money needs a human." x={980} y={680} rotate={-2} delay={178} />
    </AbsoluteFill>
  );
}

function SceneHumanLimits() {
  const frame = useCurrentFrame();
  const local = frame - 390;
  const items = [
    { title: "Sleep", detail: "Markets never close. Traders do.", color: RED },
    { title: "Emotion", detail: "FOMO, revenge trades, panic exits.", color: GOLD },
    { title: "Bandwidth", detail: "One brain. Thousands of pairs.", color: CYAN },
  ];
  return (
    <AbsoluteFill style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ position: "absolute", left: 100, top: 120, color: GOLD, fontSize: 20, fontWeight: 700, letterSpacing: "0.2em" }}>
        HUMAN LIMITS
      </div>
      <div style={{ position: "absolute", left: 100, top: 170, color: FG, fontSize: 52, fontWeight: 800, letterSpacing: "-0.03em" }}>
        Biology is the bottleneck
      </div>
      {items.map((item, i) => {
        const enter = spring({
          frame: local - i * 14,
          fps: 30,
          config: { damping: 200, stiffness: 125, mass: 0.85 },
        });
        return (
          <div
            key={item.title}
            style={{
              position: "absolute",
              left: 100 + i * 560,
              top: 360,
              width: 500,
              padding: "36px 34px",
              borderRadius: 24,
              background: "linear-gradient(165deg, rgba(255,255,255,0.09), rgba(255,255,255,0.02))",
              border: "1px solid rgba(255,255,255,0.12)",
              opacity: enter,
              transform: `translateY(${(1 - enter) * 30}px)`,
            }}
          >
            <div style={{ color: item.color, fontSize: 36, fontWeight: 800, marginBottom: 14 }}>{item.title}</div>
            <div style={{ color: MUTED, fontSize: 24, lineHeight: 1.4 }}>{item.detail}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

function SceneAgentEdge() {
  const start = 660;
  return (
    <AbsoluteFill style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ position: "absolute", left: 100, top: 110, color: CYAN, fontSize: 20, fontWeight: 700, letterSpacing: "0.2em" }}>
        AGENT EDGE
      </div>
      <div style={{ position: "absolute", left: 100, top: 160, color: FG, fontSize: 54, fontWeight: 800, letterSpacing: "-0.035em", maxWidth: 900 }}>
        Machines don’t flinch.
        <br />
        They just execute.
      </div>
      <MetricCard label="Latency" value="< 50ms" accent={CYAN} x={100} y={420} delay={start + 8} />
      <MetricCard label="Uptime" value="24 / 7" accent={GOLD} x={480} y={420} delay={start + 20} />
      <MetricCard label="Feeds watched" value="10,000+" accent={FG} x={860} y={420} delay={start + 32} />
      <MetricCard label="Emotions" value="0" accent={RED} x={1240} y={420} delay={start + 44} />
    </AbsoluteFill>
  );
}

function SceneHeadToHead() {
  const frame = useCurrentFrame();
  const local = frame - 990;
  const humanScore = Math.round(clamp(local, [20, 70], [62, 41]));
  const agentScore = Math.round(clamp(local, [20, 70], [48, 89]));
  const barH = clamp(local, [30, 90], [0, 1]);
  return (
    <AbsoluteFill style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ position: "absolute", left: 100, top: 100, color: GOLD, fontSize: 20, fontWeight: 700, letterSpacing: "0.2em" }}>
        HEAD TO HEAD · 2030 SIM
      </div>
      <div style={{ position: "absolute", left: 100, top: 150, color: FG, fontSize: 48, fontWeight: 800, letterSpacing: "-0.03em" }}>
        Same market. Different species.
      </div>

      <div style={{ position: "absolute", left: 280, top: 300, width: 520, textAlign: "center" }}>
        <div style={{ color: MUTED, fontSize: 22, fontWeight: 700, marginBottom: 18 }}>HUMAN DESK</div>
        <div style={{ color: RED, fontSize: 96, fontWeight: 850, letterSpacing: "-0.04em" }}>{humanScore}</div>
        <div
          style={{
            margin: "24px auto 0",
            width: 120,
            height: 220 * barH * (humanScore / 100),
            borderRadius: 14,
            background: `linear-gradient(180deg, ${RED}, rgba(255,92,106,0.2))`,
          }}
        />
        <div style={{ color: MUTED, marginTop: 18, fontSize: 18 }}>alpha score</div>
      </div>

      <div style={{ position: "absolute", left: 1120, top: 300, width: 520, textAlign: "center" }}>
        <div style={{ color: MUTED, fontSize: 22, fontWeight: 700, marginBottom: 18 }}>AI AGENT SWARM</div>
        <div style={{ color: CYAN, fontSize: 96, fontWeight: 850, letterSpacing: "-0.04em" }}>{agentScore}</div>
        <div
          style={{
            margin: "24px auto 0",
            width: 120,
            height: 220 * barH * (agentScore / 100),
            borderRadius: 14,
            background: `linear-gradient(180deg, ${CYAN}, rgba(62,224,184,0.2))`,
          }}
        />
        <div style={{ color: MUTED, marginTop: 18, fontSize: 18 }}>alpha score</div>
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 520,
          transform: "translateX(-50%)",
          color: GOLD,
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: "0.12em",
        }}
      >
        VS
      </div>
    </AbsoluteFill>
  );
}

function SceneTimeline() {
  const frame = useCurrentFrame();
  const local = frame - 1380;
  const steps = [
    { year: "2025", text: "Agents assist. Humans decide.", accent: MUTED },
    { year: "2027", text: "Agents co-pilot every desk.", accent: GOLD },
    { year: "2030", text: "Agents set the market tempo.", accent: CYAN },
  ];
  return (
    <AbsoluteFill style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ position: "absolute", left: 100, top: 120, color: GOLD, fontSize: 20, fontWeight: 700, letterSpacing: "0.2em" }}>
        THE SHIFT
      </div>
      <div style={{ position: "absolute", left: 100, top: 170, color: FG, fontSize: 52, fontWeight: 800, letterSpacing: "-0.03em" }}>
        Edge migrates to software
      </div>
      <div
        style={{
          position: "absolute",
          left: 160,
          right: 160,
          top: 430,
          height: 4,
          background: "rgba(255,255,255,0.12)",
          borderRadius: 4,
        }}
      />
      {steps.map((step, i) => {
        const enter = spring({
          frame: local - i * 18,
          fps: 30,
          config: { damping: 200, stiffness: 120, mass: 0.85 },
        });
        const x = 220 + i * 560;
        return (
          <div key={step.year} style={{ position: "absolute", left: x, top: 360, width: 380, opacity: enter, transform: `translateY(${(1 - enter) * 24}px)` }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 99,
                background: step.accent,
                marginBottom: 36,
                boxShadow: `0 0 24px ${step.accent}`,
              }}
            />
            <div style={{ color: step.accent, fontSize: 42, fontWeight: 850, letterSpacing: "-0.03em" }}>{step.year}</div>
            <div style={{ color: MUTED, fontSize: 24, marginTop: 14, lineHeight: 1.35 }}>{step.text}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

function ScenePunchline() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - 1740;
  const enter = spring({ frame: local, fps, config: { damping: 200, stiffness: 115, mass: 1 } });
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          opacity: enter,
          transform: `scale(${0.92 + enter * 0.08})`,
          textAlign: "center",
          maxWidth: 1400,
        }}
      >
        <div style={{ color: GOLD, fontSize: 22, fontWeight: 700, letterSpacing: "0.24em", marginBottom: 28 }}>
          THE PUNCHLINE
        </div>
        <div style={{ color: FG, fontSize: 68, fontWeight: 850, letterSpacing: "-0.04em", lineHeight: 1.12 }}>
          Markets won’t wait
          <br />
          for humans to wake up.
        </div>
        <div style={{ color: MUTED, fontSize: 30, marginTop: 32, lineHeight: 1.4 }}>
          By 2030, the winning trader is not a person —
          <br />
          it’s an agent stack that never blinks.
        </div>
      </div>
    </AbsoluteFill>
  );
}

function SceneEnd() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - 2100;
  const enter = spring({ frame: local, fps, config: { damping: 200, stiffness: 120, mass: 0.9 } });
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div style={{ opacity: enter, textAlign: "center", transform: `translateY(${(1 - enter) * 20}px)` }}>
        <div style={{ color: FG, fontSize: 64, fontWeight: 850, letterSpacing: "-0.04em", lineHeight: 1.1 }}>
          AI Agents beat traders
          <br />
          <span style={{ color: GOLD }}>not by guessing —</span>
          <br />
          by outlasting them.
        </div>
        <div
          style={{
            marginTop: 48,
            display: "inline-block",
            padding: "14px 28px",
            borderRadius: 999,
            border: `1px solid ${GOLD}`,
            color: GOLD,
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "0.16em",
          }}
        >
          THESIS · 2030
        </div>
      </div>
    </AbsoluteFill>
  );
}

export function AgentsBeatTraders2030() {
  return (
    <AbsoluteFill style={{ backgroundColor: BG, overflow: "hidden" }}>
      <Background />

      <Scene from={0} to={150}>
        <SceneHook />
      </Scene>
      <Caption from={20} to={145} text="A 90-second thesis on why agent stacks take the edge." />

      <Scene from={150} to={390}>
        <SceneMyth />
      </Scene>
      <Caption from={165} to={385} text="The myth: human intuition is irreplaceable." />

      <Scene from={390} to={660}>
        <SceneHumanLimits />
      </Scene>
      <Caption from={405} to={655} text="Sleep, emotion, and bandwidth — the three hard ceilings." />

      <Scene from={660} to={990}>
        <SceneAgentEdge />
      </Scene>
      <Caption from={675} to={985} text="Agents win on latency, uptime, coverage, and zero panic." />

      <Scene from={990} to={1380}>
        <SceneHeadToHead />
      </Scene>
      <Caption from={1005} to={1375} text="Same tape. Agents compound the edge humans can’t sustain." />

      <Scene from={1380} to={1740}>
        <SceneTimeline />
      </Scene>
      <Caption from={1395} to={1735} text="2025 assist → 2027 co-pilot → 2030 tempo-setter." />

      <Scene from={1740} to={2100}>
        <ScenePunchline />
      </Scene>
      <Caption from={1755} to={2095} text="Liquidity follows whoever reacts fastest and longest." />

      <Scene from={2100} to={2700}>
        <SceneEnd />
      </Scene>
      <Caption from={2140} to={2680} text="AI agents can beat all traders in 2030 — by never blinking." />
    </AbsoluteFill>
  );
}
