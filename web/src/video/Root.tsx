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
  LlmExchangePromo,
  LLM_EXCHANGE_PROMO_DURATION,
  LLM_EXCHANGE_PROMO_HEIGHT,
  LLM_EXCHANGE_PROMO_WIDTH,
} from "@/video/compositions/LlmExchangePromo";
import { LLM_EXCHANGE_PROMO_FPS } from "@/video/content/llmExchangePromo";
import {
  BridgePromo,
  BRIDGE_PROMO_DURATION,
  BRIDGE_PROMO_HEIGHT,
  BRIDGE_PROMO_WIDTH,
} from "@/video/compositions/BridgePromo";
import { BRIDGE_PROMO_FPS } from "@/video/content/bridgePromo";
import {
  RefundPromo,
  REFUND_PROMO_DURATION,
  REFUND_PROMO_HEIGHT,
  REFUND_PROMO_WIDTH,
} from "@/video/compositions/RefundPromo";
import { REFUND_PROMO_FPS } from "@/video/content/refundPromo";
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
      <Composition
        id="LlmExchangePromo"
        component={LlmExchangePromo}
        durationInFrames={LLM_EXCHANGE_PROMO_DURATION}
        fps={LLM_EXCHANGE_PROMO_FPS}
        width={LLM_EXCHANGE_PROMO_WIDTH}
        height={LLM_EXCHANGE_PROMO_HEIGHT}
        defaultProps={{ bgm: true }}
      />
      <Composition
        id="BridgePromo"
        component={BridgePromo}
        durationInFrames={BRIDGE_PROMO_DURATION}
        fps={BRIDGE_PROMO_FPS}
        width={BRIDGE_PROMO_WIDTH}
        height={BRIDGE_PROMO_HEIGHT}
        defaultProps={{ bgm: true }}
      />
      <Composition
        id="RefundPromo"
        component={RefundPromo}
        durationInFrames={REFUND_PROMO_DURATION}
        fps={REFUND_PROMO_FPS}
        width={REFUND_PROMO_WIDTH}
        height={REFUND_PROMO_HEIGHT}
        defaultProps={{ bgm: true }}
      />
    </>
  );
}
