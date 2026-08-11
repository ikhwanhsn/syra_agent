import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for BTC Intelligence Hub photo deck: 15 distinct topics. */
export const BTC_INTELLIGENCE_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `BTC Intelligence Hub is live on Syra.

One Bitcoin page now holds a flow chart, fifteen analysis blocks, shareable sections, and sticky navigation so you can jump without hunting tabs.

syraa.fun/btc`,

  thesis: `Bitcoin research used to live in ten tabs.

Spot price sat on one exchange. Funding sat on another. Sentiment lived in a feed. Syra /btc unifies overview, cross-venue compare, a flow bubblemap, and fifteen analysis sections, with export on every block.

syraa.fun/btc`,

  quote: `One page can hold twenty sections, and every block is shareable.

Scroll technicals through supply, jump with sticky nav, or post any section to X with branded export.

syraa.fun/btc`,

  flow: `Using the BTC hub is four steps.

1. Open /btc from the dashboard sidebar
2. Overview and dashboard load from precomputed API snapshots
3. Sticky right nav jumps you to each block with a smooth scroll
4. Export any section as a branded PNG with matching X copy

syraa.fun/btc`,

  timeline: `The page stacks from hero to supply in one scroll.

1. Overview: price, dominance, fear and greed, volume tiles
2. Flow chart: bubblemap on TradingView Lightweight Charts
3. Derivatives: funding, open interest, long/short, taker flow
4. Conviction: news, sentiment, trading signal, supply

syraa.fun/btc`,

  pillars: `Four layers make the hub a command center.

A MongoDB scheduler precomputes overview and dashboard snapshots. CoinGecko and Binance refreshes stay inside per-minute rate limits. The bubblemap runs on Lightweight Charts with exchange, interval, and share themes. Every section can copy, download a PNG, or share to X.

syraa.fun/btc`,

  checklist: `What is live on the BTC Intelligence Hub.

1. Twenty scrollable sections with sticky nav
2. Fifteen analysis blocks in one dashboard payload
3. Flow bubblemap with branded chart export
4. Database-backed reads, so visits do not hammer provider APIs

syraa.fun/btc`,

  metrics: `Bitcoin intelligence, by the numbers.

20 page sections. 15 analysis blocks. 3 API endpoints.

Researchers scroll one hub. Creators share any block. The backend refreshes on a schedule.

syraa.fun/btc`,

  featured: `Every section is share-ready.

Twenty sections export in one tap: hero, metrics, bubblemap, technicals, funding, sentiment. Each comes with a branded dark frame and X copy.

syraa.fun/btc`,

  comparison: `Scattered tabs vs one Bitcoin page.

Before, price, funding, and sentiment lived across sites, and nothing was packaged for X. Now one /btc page has sticky nav, fifteen analysis blocks, and one-tap export on any section.

syraa.fun/btc`,

  launch: `BTC Intelligence Hub is live and free on the dashboard.

It is a Bitcoin command center: flow chart, analysis stack, shareable sections. Open /btc and scroll.

syraa.fun/btc`,

  deepDive: `How the hub is wired.

GET /btc/overview returns price, dominance, and fear and greed. GET /btc/dashboard returns fifteen analysis sections. GET /btc/bubblemap takes exchange and interval presets. A tiered scheduler keeps MongoDB snapshots warm, and branded export sits on every block.

syraa.fun/btc`,

  split: `Read the stack, then post the proof.

Scroll fifteen analysis blocks for conviction, then share any section without rebuilding it. Sticky nav jumps you around. Chart share includes a theme picker. X copy is generated per section.

syraa.fun/btc`,

  terminal: `Read snapshots from the API.

curl api.syraa.fun/btc/overview returns price under data. curl api.syraa.fun/btc/dashboard returns the sections object. Either call can return 503 until the background scheduler warms snapshots.

syraa.fun/btc`,

  cta: `Open the BTC Intelligence Hub.

Go to the dashboard, open BTC, scroll the stack, jump sections, and share any block to X.

syraa.fun/btc
api.syraa.fun/btc/dashboard
api.syraa.fun/btc/bubblemap`,
};
