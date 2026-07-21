import React from "react";
import { Composition, registerRoot } from "remotion";
import {
  AgentsBeatTraders2030,
  AGENTS_BEAT_TRADERS_DURATION,
  AGENTS_BEAT_TRADERS_FPS,
  AGENTS_BEAT_TRADERS_HEIGHT,
  AGENTS_BEAT_TRADERS_WIDTH,
} from "./compositions/AgentsBeatTraders2030";

function AgentsBeatTradersRoot() {
  return (
    <Composition
      id="AgentsBeatTraders2030"
      component={AgentsBeatTraders2030}
      durationInFrames={AGENTS_BEAT_TRADERS_DURATION}
      fps={AGENTS_BEAT_TRADERS_FPS}
      width={AGENTS_BEAT_TRADERS_WIDTH}
      height={AGENTS_BEAT_TRADERS_HEIGHT}
    />
  );
}

registerRoot(AgentsBeatTradersRoot);
