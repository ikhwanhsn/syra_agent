import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import {
  FLASH_CUTS,
  REVEALS,
  SCENES,
} from "./content/script";
import { BG, DURATION } from "./content/theme";
import { ExplainerAudio } from "./ExplainerAudio";
import { Background, CaptionBar, FlashCut, Scene } from "./lib/ui";
import { ShotAgent } from "./shots/ShotAgent";
import { ShotBoard } from "./shots/ShotBoard";
import { ShotCta } from "./shots/ShotCta";
import { ShotDepth } from "./shots/ShotDepth";
import { ShotDossier } from "./shots/ShotDossier";
import { ShotFoundation } from "./shots/ShotFoundation";
import { ShotHook } from "./shots/ShotHook";
import { ShotIntel } from "./shots/ShotIntel";
import { ShotProblem } from "./shots/ShotProblem";

export type TokensExplainerProps = {
  bgm?: boolean;
};

export const TokensExplainer: React.FC<TokensExplainerProps> = ({
  bgm = true,
}) => {
  const scenes = SCENES;

  return (
    <AbsoluteFill style={{ backgroundColor: BG, overflow: "hidden" }}>
      <Background />
      <ExplainerAudio scenes={scenes} reveals={REVEALS} bgm={bgm} />

      <Scene from={scenes[0].from} to={scenes[0].to}>
        <ShotHook />
      </Scene>
      <Sequence from={scenes[0].from + 20} durationInFrames={scenes[0].to - scenes[0].from - 25} layout="none">
        <CaptionBar text={scenes[0].caption} duration={scenes[0].to - scenes[0].from - 25} />
      </Sequence>

      <Scene from={scenes[1].from} to={scenes[1].to}>
        <ShotProblem start={scenes[1].from} />
      </Scene>
      <Sequence from={scenes[1].from + 15} durationInFrames={scenes[1].to - scenes[1].from - 25} layout="none">
        <CaptionBar text={scenes[1].caption} duration={scenes[1].to - scenes[1].from - 25} />
      </Sequence>

      <Scene from={scenes[2].from} to={scenes[2].to}>
        <ShotFoundation start={scenes[2].from} />
      </Scene>
      <Sequence from={scenes[2].from + 15} durationInFrames={scenes[2].to - scenes[2].from - 25} layout="none">
        <CaptionBar text={scenes[2].caption} duration={scenes[2].to - scenes[2].from - 25} />
      </Sequence>

      <Scene from={scenes[3].from} to={scenes[3].to}>
        <ShotBoard start={scenes[3].from} />
      </Scene>
      <Sequence from={scenes[3].from + 15} durationInFrames={scenes[3].to - scenes[3].from - 25} layout="none">
        <CaptionBar text={scenes[3].caption} duration={scenes[3].to - scenes[3].from - 25} />
      </Sequence>

      <Scene from={scenes[4].from} to={scenes[4].to}>
        <ShotDossier start={scenes[4].from} />
      </Scene>
      <Sequence from={scenes[4].from + 15} durationInFrames={scenes[4].to - scenes[4].from - 25} layout="none">
        <CaptionBar text={scenes[4].caption} duration={scenes[4].to - scenes[4].from - 25} />
      </Sequence>

      <Scene from={scenes[5].from} to={scenes[5].to}>
        <ShotIntel start={scenes[5].from} />
      </Scene>
      <Sequence from={scenes[5].from + 15} durationInFrames={scenes[5].to - scenes[5].from - 25} layout="none">
        <CaptionBar text={scenes[5].caption} duration={scenes[5].to - scenes[5].from - 25} />
      </Sequence>

      <Scene from={scenes[6].from} to={scenes[6].to}>
        <ShotAgent start={scenes[6].from} />
      </Scene>
      <Sequence from={scenes[6].from + 15} durationInFrames={scenes[6].to - scenes[6].from - 25} layout="none">
        <CaptionBar text={scenes[6].caption} duration={scenes[6].to - scenes[6].from - 25} />
      </Sequence>

      <Scene from={scenes[7].from} to={scenes[7].to}>
        <ShotDepth start={scenes[7].from} />
      </Scene>
      <Sequence from={scenes[7].from + 15} durationInFrames={scenes[7].to - scenes[7].from - 25} layout="none">
        <CaptionBar text={scenes[7].caption} duration={scenes[7].to - scenes[7].from - 25} />
      </Sequence>

      <Scene from={scenes[8].from} to={scenes[8].to}>
        <ShotCta start={scenes[8].from} />
      </Scene>
      <Sequence from={scenes[8].from + 12} durationInFrames={scenes[8].to - scenes[8].from - 20} layout="none">
        <CaptionBar text={scenes[8].caption} duration={scenes[8].to - scenes[8].from - 20} />
      </Sequence>

      {FLASH_CUTS.map((from) => (
        <Sequence key={`flash-${from}`} from={from} durationInFrames={10} layout="none">
          <FlashCut duration={10} />
        </Sequence>
      ))}

      {/* Keep DURATION referenced for clarity */}
      <Sequence from={DURATION - 1} durationInFrames={1} layout="none">
        <AbsoluteFill />
      </Sequence>
    </AbsoluteFill>
  );
};
