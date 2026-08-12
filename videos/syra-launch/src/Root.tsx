import React from "react";
import { Composition } from "remotion";
import { DURATION, FPS, HEIGHT, WIDTH } from "./content/theme";
import { SyraLaunch } from "./SyraLaunch";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="SyraLaunch"
      component={SyraLaunch}
      durationInFrames={DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ bgm: true }}
    />
  );
};
