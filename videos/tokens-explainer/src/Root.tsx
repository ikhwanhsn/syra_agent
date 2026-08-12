import React from "react";
import { Composition } from "remotion";
import { DURATION, FPS, HEIGHT, WIDTH } from "./content/theme";
import { TokensExplainer } from "./TokensExplainer";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TokensExplainer"
        component={TokensExplainer}
        durationInFrames={DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ bgm: true }}
      />
    </>
  );
};
