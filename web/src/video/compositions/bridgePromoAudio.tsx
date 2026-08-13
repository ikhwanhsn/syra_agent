/**
 * Declarative SFX + BGM for Bridge promo.
 * Reuses llm-exchange audio assets under remotion-public.
 */
import { Audio, interpolate, Sequence, staticFile } from "remotion";
import {
  BRIDGE_PROMO_DURATION,
  PROMO_REVEALS,
  PROMO_SCENES,
} from "@/video/content/bridgePromo";

const BGM = staticFile("audio/video/llm-exchange-bgm.mp3");
const WHOOSH = staticFile("audio/video/llm-exchange/whoosh-fast.mp3");
const SWOOSH = staticFile("audio/video/llm-exchange/swoosh-quick.mp3");
const POP = staticFile("audio/video/llm-exchange/pop.mp3");
const HIT = staticFile("audio/video/llm-exchange/impact-cine-big.mp3");
const RISER = staticFile("audio/video/llm-exchange/riser-cine.mp3");
const SPARKLE = staticFile("audio/video/llm-exchange/sparkle.mp3");
const SWITCH = staticFile("audio/video/llm-exchange/switch-tap.mp3");
const SCAN = staticFile("audio/video/llm-exchange/data-scan.mp3");
const KEY = staticFile("audio/video/llm-exchange/typewriter-digital.mp3");

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
      src: WHOOSH,
      volume: 0.26,
      durationInFrames: 36,
      note: `${scene.id} enter`,
    });
    cues.push({
      from: scene.from + r.title,
      src: scene.id === "cta" || scene.id === "reveal" ? HIT : POP,
      volume: scene.id === "cta" || scene.id === "reveal" ? 0.42 : 0.22,
      durationInFrames: 40,
      note: `${scene.id} title`,
    });
    for (const offset of r.elements) {
      cues.push({
        from: scene.from + offset,
        src:
          scene.id === "fee"
            ? SWITCH
            : scene.id === "reveal"
              ? KEY
              : scene.id === "buyback"
                ? SCAN
                : POP,
        volume: 0.18,
        durationInFrames: 28,
        note: `${scene.id} element@${offset}`,
      });
    }
  }
  const cta = PROMO_SCENES.find((s) => s.id === "cta")!;
  cues.push({
    from: Math.max(0, cta.from - 45),
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
  return cues.sort((a, b) => a.from - b.from);
}

const CUES = buildCues();

export type BridgePromoAudioProps = {
  bgm?: boolean;
  durationInFrames?: number;
};

export function BridgePromoAudio({
  bgm = true,
  durationInFrames = BRIDGE_PROMO_DURATION,
}: BridgePromoAudioProps) {
  const fadeIn = 18;
  const fadeOut = 40;
  const bgmVolume = (f: number) => {
    const up = interpolate(f, [0, fadeIn], [0, 0.28], {
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
