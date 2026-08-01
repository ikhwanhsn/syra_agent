/**
 * Shared audio layer for WhatIsSyra landscape + vertical explainers.
 * Real house-vibez bed + per-reveal SFX synced to LANDSCAPE/VERTICAL_REVEALS.
 */
import { Audio, interpolate, Sequence, staticFile } from "remotion";
import type {
  SceneRevealTiming,
  SceneTiming,
} from "@/video/content/syraExplainer";

const BED = staticFile("audio/video/syra-bgm.mp3");
const SWOOSH = staticFile("audio/video/swoosh-quick.mp3");
const POP = staticFile("audio/video/pop.mp3");
const POP_SOFT = staticFile("audio/video/pop-soft.mp3");
const HIT = staticFile("audio/video/impact-cine.mp3");
const SPARKLE = staticFile("audio/video/sparkle.mp3");
const SPARKLE_TOUCH = staticFile("audio/video/sparkle-touch.mp3");
const RISER = staticFile("audio/video/riser-cine.mp3");
const REVEAL = staticFile("audio/video/reveal-soft.mp3");
const TICK = staticFile("audio/video/tick.mp3");
const KEY = staticFile("audio/video/key-soft.mp3");
const SUCCESS = staticFile("audio/video/success-soft.mp3");

const BED_VOLUME = 0.3;
const SWOOSH_VOLUME = 0.28;
const POP_VOLUME = 0.22;
const POP_SOFT_VOLUME = 0.2;
const HIT_VOLUME = 0.45;
const SPARKLE_VOLUME = 0.28;
const SPARKLE_TOUCH_VOLUME = 0.26;
const RISER_VOLUME = 0.3;
const REVEAL_VOLUME = 0.22;
const TICK_VOLUME = 0.18;
const KEY_VOLUME = 0.16;
const SUCCESS_VOLUME = 0.28;

const FADE_IN_FRAMES = 20;
const FADE_OUT_FRAMES = 45;
const RISER_LEAD_FRAMES = 45;

const HIGHLIGHT_SCENE_IDS = new Set(["token", "cta"]);
const LOGO_SCENE_IDS = new Set(["hook", "cta"]);

type ExplainerAudioProps = {
  scenes: SceneTiming[];
  reveals: Record<string, SceneRevealTiming>;
  durationInFrames: number;
  /** Absolute frame for the hook title hit (logo reveal). */
  hookHitFrame?: number;
};

function dedupeFrames(frames: number[]): number[] {
  return [...new Set(frames)].sort((a, b) => a - b);
}

export function ExplainerAudio({
  scenes,
  reveals,
  durationInFrames,
  hookHitFrame = 12,
}: ExplainerAudioProps) {
  const ctaScene = scenes.find((s) => s.id === "cta");
  const riserFrom = ctaScene
    ? Math.max(0, ctaScene.from - RISER_LEAD_FRAMES)
    : null;

  const titleFrames: number[] = [];
  const elementFrames: number[] = [];
  const countFrames: number[] = [];
  const keyFrames: number[] = [];
  const logoFrames: number[] = [];
  const successFrames: number[] = [];

  for (const scene of scenes) {
    const r = reveals[scene.id];
    if (!r) continue;

    titleFrames.push(scene.from + r.title);

    for (const offset of r.elements) {
      elementFrames.push(scene.from + offset);
    }
    for (const offset of r.counts ?? []) {
      countFrames.push(scene.from + offset);
    }
    for (const offset of r.keys ?? []) {
      keyFrames.push(scene.from + offset);
    }
    if (LOGO_SCENE_IDS.has(scene.id) && r.elements[0] !== undefined) {
      logoFrames.push(scene.from + r.elements[0]);
    }
    if (scene.id === "cta" && r.elements[1] !== undefined) {
      successFrames.push(scene.from + r.elements[1]);
    }
  }

  const titleSet = new Set(dedupeFrames(titleFrames));
  const countSet = new Set(dedupeFrames(countFrames));
  const keySet = new Set(dedupeFrames(keyFrames));
  const logoSet = new Set(dedupeFrames(logoFrames));

  // Element pops: skip frames already covered by title / count / key / logo hits.
  const popFrames = dedupeFrames(elementFrames).filter(
    (f) =>
      !titleSet.has(f) &&
      !countSet.has(f) &&
      !keySet.has(f) &&
      !logoSet.has(f),
  );

  return (
    <>
      <Audio
        src={BED}
        loop
        loopVolumeCurveBehavior="extend"
        volume={(f) => {
          const fadeIn = interpolate(f, [0, FADE_IN_FRAMES], [0, BED_VOLUME], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const fadeOut = interpolate(
            f,
            [durationInFrames - FADE_OUT_FRAMES, durationInFrames],
            [BED_VOLUME, 0],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );
          return Math.min(fadeIn, fadeOut);
        }}
      />

      <Sequence from={hookHitFrame} layout="none">
        <Audio src={HIT} volume={HIT_VOLUME} />
      </Sequence>

      {scenes.map((scene) => (
        <Sequence key={`swoosh-${scene.id}`} from={scene.from} layout="none">
          <Audio src={SWOOSH} volume={SWOOSH_VOLUME} />
        </Sequence>
      ))}

      {dedupeFrames(titleFrames).map((frame) => (
        <Sequence key={`reveal-${frame}`} from={frame} layout="none">
          <Audio src={REVEAL} volume={REVEAL_VOLUME} />
        </Sequence>
      ))}

      {popFrames.map((frame, i) => (
        <Sequence key={`pop-${frame}`} from={frame} layout="none">
          <Audio
            src={i % 2 === 0 ? POP : POP_SOFT}
            volume={i % 2 === 0 ? POP_VOLUME : POP_SOFT_VOLUME}
          />
        </Sequence>
      ))}

      {dedupeFrames(countFrames).map((frame) => (
        <Sequence key={`tick-${frame}`} from={frame} layout="none">
          <Audio src={TICK} volume={TICK_VOLUME} />
        </Sequence>
      ))}

      {dedupeFrames(keyFrames).map((frame) => (
        <Sequence key={`key-${frame}`} from={frame} layout="none">
          <Audio src={KEY} volume={KEY_VOLUME} />
        </Sequence>
      ))}

      {dedupeFrames(logoFrames).map((frame) => (
        <Sequence key={`logo-sparkle-${frame}`} from={frame + 4} layout="none">
          <Audio src={SPARKLE_TOUCH} volume={SPARKLE_TOUCH_VOLUME} />
        </Sequence>
      ))}

      {scenes
        .filter((scene) => HIGHLIGHT_SCENE_IDS.has(scene.id))
        .map((scene) => (
          <Sequence
            key={`sparkle-${scene.id}`}
            from={scene.from + 12}
            layout="none"
          >
            <Audio src={SPARKLE} volume={SPARKLE_VOLUME} />
          </Sequence>
        ))}

      {dedupeFrames(successFrames).map((frame) => (
        <Sequence key={`success-${frame}`} from={frame} layout="none">
          <Audio src={SUCCESS} volume={SUCCESS_VOLUME} />
        </Sequence>
      ))}

      {riserFrom !== null ? (
        <Sequence from={riserFrom} layout="none">
          <Audio src={RISER} volume={RISER_VOLUME} />
        </Sequence>
      ) : null}
    </>
  );
}
