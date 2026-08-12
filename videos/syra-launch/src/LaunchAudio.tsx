/**
 * High-energy audio: tech-house BGM + cinematic SFX punches.
 */
import React from "react";
import { Audio, interpolate, Sequence, staticFile } from "remotion";
import type { SceneTiming } from "./content/script";
import { DURATION } from "./content/theme";

const BED = staticFile("audio/bgm/bgm-tech-house.mp3");
const SWOOSH = staticFile("audio/swoosh-quick.mp3");
const HIT = staticFile("audio/impact-cine.mp3");
const HIT_BIG = staticFile("audio/sfx/impact/impact-cine-big.mp3");
const BASS = staticFile("audio/sfx/impact/bass-hit-futuristic.mp3");
const POP = staticFile("audio/pop.mp3");
const POP_SOFT = staticFile("audio/pop-soft.mp3");
const SPARKLE = staticFile("audio/sparkle.mp3");
const SPARKLE_TOUCH = staticFile("audio/sparkle-touch.mp3");
const RISER = staticFile("audio/riser-cine.mp3");
const REVEAL = staticFile("audio/reveal-soft.mp3");
const TICK = staticFile("audio/tick.mp3");
const KEY = staticFile("audio/key-soft.mp3");
const SUCCESS = staticFile("audio/success-soft.mp3");
const WHOOSH = staticFile("audio/sfx/transition/whoosh-fast.mp3");
const GLITCH = staticFile("audio/sfx/data/glitch-virtual-quick.mp3");
const POWER = staticFile("audio/sfx/data/power-up-electronic.mp3");

const BED_VOL = 0.34;
const FADE_IN = 12;
const FADE_OUT = 36;

export function LaunchAudio({
  scenes,
  bgm = true,
}: {
  scenes: SceneTiming[];
  bgm?: boolean;
}) {
  const cta = scenes.find((s) => s.id === "cta");
  const reveal = scenes.find((s) => s.id === "reveal");
  const riserFrom = cta ? Math.max(0, cta.from - 40) : null;

  return (
    <>
      {bgm ? (
        <Audio
          src={BED}
          loop
          loopVolumeCurveBehavior="extend"
          volume={(f) => {
            const fadeIn = interpolate(f, [0, FADE_IN], [0, BED_VOL], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const fadeOut = interpolate(
              f,
              [DURATION - FADE_OUT, DURATION],
              [BED_VOL, 0],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            );
            return Math.min(fadeIn, fadeOut);
          }}
        />
      ) : null}

      {/* Cold open slam */}
      <Sequence from={6} layout="none">
        <Audio src={HIT_BIG} volume={0.55} />
      </Sequence>
      <Sequence from={28} layout="none">
        <Audio src={BASS} volume={0.4} />
      </Sequence>
      <Sequence from={55} layout="none">
        <Audio src={GLITCH} volume={0.28} />
      </Sequence>

      {/* Brand reveal */}
      {reveal ? (
        <>
          <Sequence from={reveal.from + 4} layout="none">
            <Audio src={WHOOSH} volume={0.32} />
          </Sequence>
          <Sequence from={reveal.from + 16} layout="none">
            <Audio src={HIT} volume={0.5} />
          </Sequence>
          <Sequence from={reveal.from + 22} layout="none">
            <Audio src={SPARKLE} volume={0.32} />
          </Sequence>
        </>
      ) : null}

      {scenes.map((scene) => (
        <Sequence key={`enter-${scene.id}`} from={scene.from} layout="none">
          <Audio src={SWOOSH} volume={0.26} />
        </Sequence>
      ))}

      {/* Problem card pops */}
      {[16, 30, 44].map((off, i) => (
        <Sequence key={`prob-${i}`} from={240 + off} layout="none">
          <Audio src={i % 2 === 0 ? POP : POP_SOFT} volume={0.22} />
        </Sequence>
      ))}

      {/* Solution */}
      <Sequence from={450 + 12} layout="none">
        <Audio src={POWER} volume={0.28} />
      </Sequence>
      <Sequence from={450 + 30} layout="none">
        <Audio src={TICK} volume={0.2} />
      </Sequence>

      {/* x402 steps */}
      {[18, 34, 50, 66].map((off, i) => (
        <Sequence key={`x402-${i}`} from={720 + off} layout="none">
          <Audio src={i === 3 ? SUCCESS : POP} volume={i === 3 ? 0.3 : 0.22} />
        </Sequence>
      ))}

      {/* Power grid */}
      {[10, 20, 30, 40, 50, 60].map((off, i) => (
        <Sequence key={`pow-${i}`} from={1020 + off} layout="none">
          <Audio src={i % 2 === 0 ? POP : POP_SOFT} volume={0.18} />
        </Sequence>
      ))}

      {/* Start typing */}
      {[28, 42, 56].map((off, i) => (
        <Sequence key={`key-${i}`} from={1260 + off} layout="none">
          <Audio src={KEY} volume={0.16} />
        </Sequence>
      ))}

      {/* CTA sentence */}
      {riserFrom !== null ? (
        <Sequence from={riserFrom} layout="none">
          <Audio src={RISER} volume={0.34} />
        </Sequence>
      ) : null}
      {cta ? (
        <>
          <Sequence from={cta.from + 8} layout="none">
            <Audio src={HIT_BIG} volume={0.5} />
          </Sequence>
          <Sequence from={cta.from + 14} layout="none">
            <Audio src={SPARKLE_TOUCH} volume={0.3} />
          </Sequence>
          <Sequence from={cta.from + 28} layout="none">
            <Audio src={SUCCESS} volume={0.3} />
          </Sequence>
        </>
      ) : null}

      {/* Soft reveals on titles */}
      {[90 + 16, 450 + 8, 720 + 8, 1020 + 8, 1260 + 8].map((f) => (
        <Sequence key={`rev-${f}`} from={f} layout="none">
          <Audio src={REVEAL} volume={0.18} />
        </Sequence>
      ))}
    </>
  );
}
