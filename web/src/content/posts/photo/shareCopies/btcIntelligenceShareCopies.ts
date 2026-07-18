import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for BTC Intelligence Hub photo deck: 15 distinct topics. */
export const BTC_INTELLIGENCE_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `SHIP LOG · Bitcoin research was scattered across ten tabs.

Not anymore.

Syra BTC Intelligence Hub: one premium /btc page. Flow bubblemap, 15 analysis sections, shareable cards, sticky nav.

Free on the dashboard → syraa.fun/btc`,

  thesis: `Price on one site. Funding on another. Sentiment somewhere else.

Traders needed one Bitcoin command center, not another tab maze.

Syra /btc pulls overview, exchange compare, flow chart, and 15 analysis blocks into a single scrollable hub.

Try it → syraa.fun/btc`,

  quote: `"One page. Twenty sections. Every block shareable."

Overview, bubblemap, technicals, funding, OI, correlations, fear & greed, news, sentiment, signal, supply. Scroll the stack or jump with sticky nav.

Export any section as a branded card for X.

Try it → syraa.fun/btc`,

  flow: `How the BTC Intelligence Hub works:

1. Open syraa.fun/btc from the dashboard
2. Snapshots load from GET /btc/overview + /btc/dashboard
3. Scroll 20 sections or use sticky right nav
4. Share any block: copy, PNG, or native X post

No per-visit provider hammering.

Try it → syraa.fun/btc`,

  timeline: `From open to conviction:

→ Hero: price, dominance, fear & greed, volume
→ Exchange compare across major venues
→ Flow bubblemap with interval + exchange toggles
→ 15 analysis cards: technicals through supply
→ Share button on every section

One scroll. Full stack.

Try it → syraa.fun/btc`,

  pillars: `Four layers. One BTC page:

→ Snapshot store: MongoDB precomputes overview + dashboard
→ Rate-limit scheduler: respectful CoinGecko/Binance refresh
→ TradingView LWC bubblemap with share themes
→ Branded export on every section card

Fast reads. Premium UI.

Try it → syraa.fun/btc`,

  checklist: `BTC Intelligence Hub is live today:

→ 20 page sections with smooth scroll nav
→ 15 analysis blocks in one dashboard payload
→ Flow bubblemap on Lightweight Charts
→ Shareable cards: hero, metrics, chart, analysis
→ DB snapshots. 503 until warm, then instant reads

Open → syraa.fun/btc`,

  metrics: `BTC Hub by the numbers:

→ 20 scrollable sections
→ 15 analysis blocks (technicals → supply)
→ 3 API routes: overview, dashboard, bubblemap
→ Tiered background refresh, not per-user fetches

Bitcoin conviction, packaged.

Try it → syraa.fun/btc`,

  featured: `Every section is a shareable card.

Technicals, funding, fear & greed, news, signal. Tap Share, get branded dark export + X copy.

Built for researchers who read the stack and creators who post the proof.

Try it → syraa.fun/btc`,

  comparison: `Before:
Price here. Funding there. Sentiment in a fourth tab. Nothing shareable.

Now:
One /btc page. Sticky nav. 15 analysis blocks. Export any section to X in one tap.

Try it → syraa.fun/btc`,

  launch: `SHIP LOG · BTC Intelligence Hub is live on Syra.

Premium Bitcoin dashboard:

→ Flow bubblemap
→ Cross-exchange compare
→ 15 analysis sections
→ Shareable cards on every block

Dashboard → BTC → syraa.fun/btc`,

  deepDive: `Technical surface:

→ GET /btc/overview: price, dominance, fear & greed
→ GET /btc/dashboard: 15 analysis sections
→ GET /btc/bubblemap?exchange=&interval=
→ btcIntelligenceScheduler: tiered MongoDB snapshots
→ BtcShareableSection + chart share modals on web

Try it → syraa.fun/btc`,

  split: `Read the stack. Post the proof.

→ Left: scroll technicals, funding, OI, correlations, news, sentiment
→ Right: share any section as branded PNG + copy for X

Same data. Two modes: research and distribution.

Try it → syraa.fun/btc`,

  terminal: `Read BTC snapshots from the API:

$ curl api.syraa.fun/btc/overview
{ "success": true, "data": { "price": { ... } } }

$ curl api.syraa.fun/btc/dashboard
{ "success": true, "data": { "sections": { ... } } }

# 503 until background scheduler warms snapshots

Try it → syraa.fun/btc`,

  cta: `Open the BTC Intelligence Hub.

Scroll twenty sections. Jump with sticky nav. Share any analysis card to X.

→ syraa.fun/btc
→ api.syraa.fun/btc/dashboard`,
};
