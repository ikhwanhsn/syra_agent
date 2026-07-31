import { Composition } from "remotion";
import { OKX_GENESIS_FINANCE_POST } from "@/content/posts/okxGenesisFinanceUpdate";
import {
  AgentsBeatTraders2030,
  AGENTS_BEAT_TRADERS_DURATION,
  AGENTS_BEAT_TRADERS_FPS,
  AGENTS_BEAT_TRADERS_HEIGHT,
  AGENTS_BEAT_TRADERS_WIDTH,
} from "@/video/compositions/AgentsBeatTraders2030";
import { PostDeckVideo } from "@/video/compositions/PostDeckVideo";
import {
  WhatIsSyra,
  WHAT_IS_SYRA_DURATION,
  WHAT_IS_SYRA_FPS,
  WHAT_IS_SYRA_HEIGHT,
  WHAT_IS_SYRA_WIDTH,
} from "@/video/compositions/WhatIsSyra";
import {
  WhatIsSyraVertical,
  WHAT_IS_SYRA_V_DURATION,
  WHAT_IS_SYRA_V_FPS,
  WHAT_IS_SYRA_V_HEIGHT,
  WHAT_IS_SYRA_V_WIDTH,
} from "@/video/compositions/WhatIsSyraVertical";
import {
  POST_VIDEO_LAYOUT_HEIGHT,
  POST_VIDEO_LAYOUT_WIDTH,
} from "@/video/constants";
import { getDeckDurationInFrames, POST_VIDEO_FPS } from "@/video/engine/timing";

/**
 * CLI-safe wrapper: slides (incl. Lucide icons) stay in the bundle.
 * Passing icons via Composition defaultProps JSON-serializes them to `{}`
 * and React throws #130 mid-render.
 */
function PostDeckGenesis() {
  return <PostDeckVideo slides={OKX_GENESIS_FINANCE_POST.slides} />;
}

const genesisSlides = OKX_GENESIS_FINANCE_POST.slides;

/** Remotion Studio root, Syra cinematic compositions. */
export function RemotionRoot() {
  return (
    <>
      <Composition
        id="PostDeck"
        component={PostDeckGenesis}
        durationInFrames={getDeckDurationInFrames(genesisSlides)}
        fps={POST_VIDEO_FPS}
        width={POST_VIDEO_LAYOUT_WIDTH}
        height={POST_VIDEO_LAYOUT_HEIGHT}
      />
      <Composition
        id="AgentsBeatTraders2030"
        component={AgentsBeatTraders2030}
        durationInFrames={AGENTS_BEAT_TRADERS_DURATION}
        fps={AGENTS_BEAT_TRADERS_FPS}
        width={AGENTS_BEAT_TRADERS_WIDTH}
        height={AGENTS_BEAT_TRADERS_HEIGHT}
      />
      <Composition
        id="WhatIsSyra"
        component={WhatIsSyra}
        durationInFrames={WHAT_IS_SYRA_DURATION}
        fps={WHAT_IS_SYRA_FPS}
        width={WHAT_IS_SYRA_WIDTH}
        height={WHAT_IS_SYRA_HEIGHT}
      />
      <Composition
        id="WhatIsSyraVertical"
        component={WhatIsSyraVertical}
        durationInFrames={WHAT_IS_SYRA_V_DURATION}
        fps={WHAT_IS_SYRA_V_FPS}
        width={WHAT_IS_SYRA_V_WIDTH}
        height={WHAT_IS_SYRA_V_HEIGHT}
      />
    </>
  );
}
