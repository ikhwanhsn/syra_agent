/**
 * BGM + SFX layer for TokensExplainer.
 * Syra bed + video-shotcraft cinematic SFX, pinned to reveals.
 */
import React from "react";
import { Audio, interpolate, Sequence, staticFile } from "remotion";
import type { RevealTiming, SceneTiming } from "./content/script";
import { DURATION } from "./content/theme";

const BED = staticFile("audio/syra-bgm.mp3");
const SWOOSH = staticFile("audio/swoosh-quick.mp3");
const POP = staticFile("audio/pop.mp3");
const POP_SOFT = staticFile("audio/pop-soft.mp3");
const HIT = staticFile("audio/impact-cine.mp3");
const SPARKLE = staticFile("audio/sparkle.mp3");
const SPARKLE_TOUCH = staticFile("audio/sparkle-touch.mp3");
const RISER = staticFile("audio/riser-cine.mp3");
const REVEAL = staticFile("audio/reveal-soft.mp3");
const TICK = staticFile("audio/tick.mp3");
const KEY = staticFile("audio/key-soft.mp3");
const SUCCESS = staticFile("audio/success-soft.mp3");
const TRANSITION = staticFile("audio/sfx/transition/transition-tech.mp3");
const DATA_SCAN = staticFile("audio/sfx/data/data-scan.mp3");
const AIR_WHOOSH = staticFile("audio/sfx/transition/air-woosh-quick.mp3");

const BED_VOLUME = 0.28;
const FADE_IN = 20;
const FADE_OUT = 45;
const RISER_LEAD = 45;

function dedupe(frames: number[]): number[] {
  return [...new Set(frames)].sort((a, b) => a - b);
}

export function ExplainerAudio({
  scenes,
  reveals,
  bgm = true,
}: {
  scenes: SceneTiming[];
  reveals: Record<string, RevealTiming>;
  bgm?: boolean;
}) {
  const cta = scenes.find((s) => s.id === "cta");
  const riserFrom = cta ? Math.max(0, cta.from - RISER_LEAD) : null;

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
    for (const o of r.elements) elementFrames.push(scene.from + o);
    for (const o of r.counts ?? []) countFrames.push(scene.from + o);
    for (const o of r.keys ?? []) keyFrames.push(scene.from + o);
    if (scene.id === "hook" || scene.id === "cta") {
      logoFrames.push(scene.from + (r.elements[0] ?? 0));
    }
    if (scene.id === "cta" && r.elements[1] !== undefined) {
      successFrames.push(scene.from + r.elements[1]);
    }
  }

  const titleSet = new Set(dedupe(titleFrames));
  const countSet = new Set(dedupe(countFrames));
  const keySet = new Set(dedupe(keyFrames));
  const logoSet = new Set(dedupe(logoFrames));
  const popFrames = dedupe(elementFrames).filter(
    (f) =>
      !titleSet.has(f) &&
      !countSet.has(f) &&
      !keySet.has(f) &&
      !logoSet.has(f),
  );

  const specialEnter: Record<string, string> = {
    problem: TRANSITION,
    board: AIR_WHOOSH,
    foundation: DATA_SCAN,
    depth: DATA_SCAN,
    agent: TRANSITION,
  };

  return (
    <>
      {bgm ? (
        <Audio
          src={BED}
          loop
          loopVolumeCurveBehavior="extend"
          volume={(f) => {
            const fadeIn = interpolate(f, [0, FADE_IN], [0, BED_VOLUME], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const fadeOut = interpolate(
              f,
              [DURATION - FADE_OUT, DURATION],
              [BED_VOLUME, 0],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            );
            return Math.min(fadeIn, fadeOut);
          }}
        />
      ) : null}

      <Sequence from={12} layout="none">
        <Audio src={HIT} volume={0.45} />
      </Sequence>

      {scenes.map((scene) => {
        const src = specialEnter[scene.id] ?? SWOOSH;
        return (
          <Sequence key={`enter-${scene.id}`} from={scene.from} layout="none">
            <Audio src={src} volume={0.26} />
          </Sequence>
        );
      })}

      {dedupe(titleFrames).map((frame) => (
        <Sequence key={`reveal-${frame}`} from={frame} layout="none">
          <Audio src={REVEAL} volume={0.22} />
        </Sequence>
      ))}

      {popFrames.map((frame, i) => (
        <Sequence key={`pop-${frame}`} from={frame} layout="none">
          <Audio
            src={i % 2 === 0 ? POP : POP_SOFT}
            volume={i % 2 === 0 ? 0.22 : 0.18}
          />
        </Sequence>
      ))}

      {dedupe(countFrames).map((frame) => (
        <Sequence key={`tick-${frame}`} from={frame} layout="none">
          <Audio src={TICK} volume={0.18} />
        </Sequence>
      ))}

      {dedupe(keyFrames).map((frame) => (
        <Sequence key={`key-${frame}`} from={frame} layout="none">
          <Audio src={KEY} volume={0.16} />
        </Sequence>
      ))}

      {dedupe(logoFrames).map((frame) => (
        <Sequence key={`logo-${frame}`} from={frame + 4} layout="none">
          <Audio src={SPARKLE_TOUCH} volume={0.26} />
        </Sequence>
      ))}

      {scenes
        .filter((s) => s.id === "cta" || s.id === "foundation")
        .map((scene) => (
          <Sequence
            key={`sparkle-${scene.id}`}
            from={scene.from + 12}
            layout="none"
          >
            <Audio src={SPARKLE} volume={0.26} />
          </Sequence>
        ))}

      {dedupe(successFrames).map((frame) => (
        <Sequence key={`ok-${frame}`} from={frame} layout="none">
          <Audio src={SUCCESS} volume={0.28} />
        </Sequence>
      ))}

      {riserFrom !== null ? (
        <Sequence from={riserFrom} layout="none">
          <Audio src={RISER} volume={0.3} />
        </Sequence>
      ) : null}
    </>
  );
}
