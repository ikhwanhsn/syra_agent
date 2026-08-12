import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { FLASH_CUTS, SCENES } from "./content/script";
import { BG, DURATION } from "./content/theme";
import { LaunchAudio } from "./LaunchAudio";
import { Background, CaptionBar, FlashCut, Scene } from "./lib/ui";
import { ShotCold } from "./shots/ShotCold";
import { ShotCta } from "./shots/ShotCta";
import { ShotPower } from "./shots/ShotPower";
import { ShotProblem } from "./shots/ShotProblem";
import { ShotReveal } from "./shots/ShotReveal";
import { ShotSolution } from "./shots/ShotSolution";
import { ShotStart } from "./shots/ShotStart";
import { ShotX402 } from "./shots/ShotX402";

export type SyraLaunchProps = {
  bgm?: boolean;
};

export const SyraLaunch: React.FC<SyraLaunchProps> = ({ bgm = true }) => {
  const s = SCENES;

  return (
    <AbsoluteFill style={{ backgroundColor: BG, overflow: "hidden" }}>
      <Background energy={1.15} />
      <LaunchAudio scenes={s} bgm={bgm} />

      <Scene from={s[0].from} to={s[0].to}>
        <ShotCold />
      </Scene>
      <Sequence from={s[0].from + 12} durationInFrames={s[0].to - s[0].from - 20} layout="none">
        <CaptionBar text={s[0].caption} duration={s[0].to - s[0].from - 20} />
      </Sequence>

      <Scene from={s[1].from} to={s[1].to}>
        <ShotReveal start={s[1].from} />
      </Scene>
      <Sequence from={s[1].from + 30} durationInFrames={s[1].to - s[1].from - 40} layout="none">
        <CaptionBar text={s[1].caption} duration={s[1].to - s[1].from - 40} />
      </Sequence>

      <Scene from={s[2].from} to={s[2].to}>
        <ShotProblem start={s[2].from} />
      </Scene>
      <Sequence from={s[2].from + 12} durationInFrames={s[2].to - s[2].from - 22} layout="none">
        <CaptionBar text={s[2].caption} duration={s[2].to - s[2].from - 22} />
      </Sequence>

      <Scene from={s[3].from} to={s[3].to}>
        <ShotSolution start={s[3].from} />
      </Scene>
      <Sequence from={s[3].from + 12} durationInFrames={s[3].to - s[3].from - 22} layout="none">
        <CaptionBar text={s[3].caption} duration={s[3].to - s[3].from - 22} />
      </Sequence>

      <Scene from={s[4].from} to={s[4].to}>
        <ShotX402 start={s[4].from} />
      </Scene>
      <Sequence from={s[4].from + 12} durationInFrames={s[4].to - s[4].from - 22} layout="none">
        <CaptionBar text={s[4].caption} duration={s[4].to - s[4].from - 22} />
      </Sequence>

      <Scene from={s[5].from} to={s[5].to}>
        <ShotPower start={s[5].from} />
      </Scene>
      <Sequence from={s[5].from + 12} durationInFrames={s[5].to - s[5].from - 22} layout="none">
        <CaptionBar text={s[5].caption} duration={s[5].to - s[5].from - 22} />
      </Sequence>

      <Scene from={s[6].from} to={s[6].to}>
        <ShotStart start={s[6].from} />
      </Scene>
      <Sequence from={s[6].from + 12} durationInFrames={s[6].to - s[6].from - 22} layout="none">
        <CaptionBar text={s[6].caption} duration={s[6].to - s[6].from - 22} />
      </Sequence>

      <Scene from={s[7].from} to={s[7].to}>
        <ShotCta start={s[7].from} />
      </Scene>
      <Sequence from={s[7].from + 16} durationInFrames={s[7].to - s[7].from - 24} layout="none">
        <CaptionBar text={s[7].caption} duration={s[7].to - s[7].from - 24} />
      </Sequence>

      {FLASH_CUTS.map((from) => (
        <Sequence key={`flash-${from}`} from={from} durationInFrames={10} layout="none">
          <FlashCut duration={10} />
        </Sequence>
      ))}

      <Sequence from={DURATION - 1} durationInFrames={1} layout="none">
        <AbsoluteFill />
      </Sequence>
    </AbsoluteFill>
  );
};
