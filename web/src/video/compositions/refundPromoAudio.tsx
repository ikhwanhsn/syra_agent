/**
 * Declarative SFX + BGM for the refund promo.
 * Licensed files live under remotion-public/audio/video/llm-exchange/.
 * Cue map is a return motif (riser on reverse, sparkle on settle), not a clone of LLM Exchange.
 */
import { Audio, interpolate, Sequence, staticFile } from "remotion";
import {
  PROMO_REVEALS,
  PROMO_SCENES,
  REFUND_PROMO_DURATION,
} from "@/video/content/refundPromo";

const BGM = staticFile("audio/video/llm-exchange-bgm.mp3");
const WHOOSH = staticFile("audio/video/llm-exchange/whoosh-fast.mp3");
const SWOOSH = staticFile("audio/video/llm-exchange/swoosh-quick.mp3");
const POP = staticFile("audio/video/llm-exchange/pop.mp3");
const HIT = staticFile("audio/video/llm-exchange/impact-cine-big.mp3");
const HIT_FAST = staticFile("audio/video/llm-exchange/hit-fast-exciting.mp3");
const RISER = staticFile("audio/video/llm-exchange/riser-cine.mp3");
const SPARKLE = staticFile("audio/video/llm-exchange/sparkle.mp3");
const SHIMMER = staticFile("audio/video/llm-exchange/shimmer-sparkle-sweep.mp3");
const SWITCH = staticFile("audio/video/llm-exchange/switch-tap.mp3");
const SCAN = staticFile("audio/video/llm-exchange/data-scan.mp3");
const COMPUTE = staticFile("audio/video/llm-exchange/data-compute.mp3");
const KEY = staticFile("audio/video/llm-exchange/typewriter-digital.mp3");
const BASS = staticFile("audio/video/llm-exchange/bass-hit-short.mp3");

type Cue = {
  from: number;
  src: string;
  volume: number;
  durationInFrames?: number;
  note: string;
};

function buildCues(): Cue[] {
  const cues: Cue[] = [];
  for (const scene of PROMO_SCENES) {
    const r = PROMO_REVEALS[scene.id];
    if (!r) continue;
    cues.push({
      from: scene.from + 2,
      src: scene.id === "roundtrip" ? SWOOSH : WHOOSH,
      volume: scene.id === "roundtrip" ? 0.3 : 0.24,
      durationInFrames: 36,
      note: `${scene.id} enter`,
    });
    cues.push({
      from: scene.from + r.title,
      src:
        scene.id === "cta" || scene.id === "roundtrip"
          ? HIT
          : scene.id === "stakes"
            ? HIT_FAST
            : POP,
      volume: scene.id === "cta" || scene.id === "roundtrip" ? 0.4 : 0.2,
      durationInFrames: 40,
      note: `${scene.id} title`,
    });
    for (const [i, offset] of r.elements.entries()) {
      const src =
        scene.id === "rails"
          ? SWITCH
          : scene.id === "sdk"
            ? KEY
            : scene.id === "classify" || scene.id === "proof"
              ? SCAN
              : scene.id === "stakes" && i === 1
                ? HIT
                : POP;
      cues.push({
        from: scene.from + offset,
        src,
        volume: scene.id === "stakes" && i === 1 ? 0.34 : 0.17,
        durationInFrames: 28,
        note: `${scene.id} element@${offset}`,
      });
    }
  }

  const roundtrip = PROMO_SCENES.find((s) => s.id === "roundtrip")!;
  cues.push({
    from: roundtrip.from + 18,
    src: RISER,
    volume: 0.3,
    durationInFrames: 70,
    note: "roundtrip reverse riser",
  });
  cues.push({
    from: roundtrip.from + 104,
    src: SPARKLE,
    volume: 0.32,
    durationInFrames: 50,
    note: "roundtrip settle sparkle",
  });
  cues.push({
    from: roundtrip.from + 108,
    src: BASS,
    volume: 0.28,
    durationInFrames: 24,
    note: "roundtrip settle bass",
  });

  const classify = PROMO_SCENES.find((s) => s.id === "classify")!;
  cues.push({
    from: classify.from + PROMO_REVEALS.classify.elements[2],
    src: COMPUTE,
    volume: 0.22,
    durationInFrames: 36,
    note: "classify ledger compute",
  });

  const cta = PROMO_SCENES.find((s) => s.id === "cta")!;
  cues.push({
    from: Math.max(0, cta.from - 40),
    src: RISER,
    volume: 0.32,
    durationInFrames: 70,
    note: "cta riser",
  });
  cues.push({
    from: cta.from + PROMO_REVEALS.cta.title,
    src: SPARKLE,
    volume: 0.3,
    durationInFrames: 50,
    note: "cta sparkle",
  });
  cues.push({
    from: cta.from + 4,
    src: SWOOSH,
    volume: 0.24,
    durationInFrames: 30,
    note: "cta swoosh",
  });
  cues.push({
    from: cta.from + PROMO_REVEALS.cta.elements[2] + 8,
    src: SHIMMER,
    volume: 0.26,
    durationInFrames: 60,
    note: "cta brand shimmer",
  });

  return cues.sort((a, b) => a.from - b.from);
}

const CUES = buildCues();

export type RefundPromoAudioProps = {
  bgm?: boolean;
  durationInFrames?: number;
};

export function RefundPromoAudio({
  bgm = true,
  durationInFrames = REFUND_PROMO_DURATION,
}: RefundPromoAudioProps) {
  const fadeIn = 18;
  const fadeOut = 40;
  const bgmVolume = (f: number) => {
    const up = interpolate(f, [0, fadeIn], [0, 0.26], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const down = interpolate(
      f,
      [durationInFrames - fadeOut, durationInFrames],
      [1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );
    return up * down;
  };

  return (
    <>
      {bgm ? <Audio src={BGM} volume={bgmVolume} loop /> : null}
      {CUES.map((cue, i) => (
        <Sequence
          key={`${cue.note}-${i}`}
          from={cue.from}
          durationInFrames={cue.durationInFrames ?? 45}
          layout="none"
        >
          <Audio src={cue.src} volume={cue.volume} />
        </Sequence>
      ))}
    </>
  );
}
