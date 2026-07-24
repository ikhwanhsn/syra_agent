import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for BTC Intelligence Hub photo deck: 15 distinct topics. */
export const BTC_INTELLIGENCE_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `This cover announces the BTC Intelligence Hub.

One premium Bitcoin page now holds a flow chart, fifteen analysis blocks, shareable cards, and a sticky navigation rail.

syraa.fun/btc`,

  thesis: `This card states the gap the BTC Intelligence Hub closes.

Spot price sat on one exchange, funding data on another, and sentiment in a separate feed. Syra's BTC page unifies an overview, cross-venue comparison, a flow bubblemap, and fifteen analysis sections, with export available on every block.

syraa.fun/btc`,

  quote: `This card carries the line behind the hub: one page, twenty sections, every block shareable.

Scrolling moves through technicals down to supply data, sticky navigation jumps between sections, and any section can post as a branded card to X.

syraa.fun/btc`,

  flow: `This image walks through using the BTC Intelligence Hub, in four steps.

1. Open the BTC page from the dashboard sidebar
2. Overview and dashboard data load from precomputed API snapshots
3. Use the sticky right-hand navigation to jump between sections with a smooth scroll
4. Export any section as a branded PNG card with matching X copy

syraa.fun/btc`,

  timeline: `This timeline traces the page from hero to supply data in one scroll.

1. The overview shows price, dominance, fear and greed, and volume tiles
2. A flow bubblemap renders on TradingView Lightweight Charts
3. Derivatives cover funding, open interest, long and short ratios, and taker flow
4. Conviction sections cover news, sentiment, a trading signal, and supply data

syraa.fun/btc`,

  pillars: `This bento layout shows the four layers behind the hub.

A tiered scheduler precomputes overview and dashboard snapshots into MongoDB. Provider budgets keep CoinGecko and Binance refreshes inside their per-minute rate limits. The bubblemap runs on Lightweight Charts with exchange and interval controls plus share themes. Every section carries its own copy, download, or native share to X.

syraa.fun/btc`,

  checklist: `This checklist covers what's live on the BTC Intelligence Hub.

1. Twenty scrollable sections with a sticky navigation rail
2. Fifteen analysis blocks returned in one dashboard payload
3. A flow bubblemap with branded chart export
4. Database-backed reads instead of hammering providers on every visit

syraa.fun/btc`,

  metrics: `This card lists the numbers behind the BTC Intelligence Hub.

Twenty sections make up the page. Fifteen of them are analysis blocks. Three API endpoints power the whole hub, so researchers scroll one page, creators share any block, and the backend refreshes on its own schedule.

syraa.fun/btc`,

  featured: `This featured card highlights how shareable the hub is.

All twenty sections, from the hero and metrics to the bubblemap, technicals, funding, and sentiment, export as a branded dark-frame card with matching X copy in a single tap.

syraa.fun/btc`,

  comparison: `This before and after card compares scattered research with the unified hub.

Before, price, funding, and sentiment data sat scattered across different tabs, and none of it was packaged for sharing. Now, one BTC page with sticky navigation holds fifteen analysis blocks, and any section exports in one tap.

syraa.fun/btc`,

  launch: `This launch card marks the BTC Intelligence Hub as live and free on the dashboard.

The page works as a premium Bitcoin command center, with a flow chart, a full analysis stack, and shareable cards on every section.

syraa.fun/btc`,

  deepDive: `This deep-dive card lists the API and scheduler wiring behind the hub.

A GET to the overview endpoint returns price, dominance, and fear and greed data. A GET to the dashboard endpoint returns all fifteen analysis sections. A GET to the bubblemap endpoint takes exchange and interval presets. A tiered scheduler keeps MongoDB snapshots warm, and a shareable section component handles branded export on every block.

syraa.fun/btc`,

  split: `This split card explains how research and sharing sit on the same page.

Scrolling through technicals, funding, open interest, correlations, news, and sentiment builds the case, and any section can then post as a branded card without rebuilding the graphic. Sticky navigation and a theme picker on the chart share tie the two together.

syraa.fun/btc`,

  terminal: `This terminal card shows the overview and dashboard endpoints responding.

Calling the overview endpoint returns a price object nested under data. Calling the dashboard endpoint returns a sections object with all fifteen analysis blocks. Either call can return a 503 until the background scheduler finishes warming its snapshots.

syraa.fun/btc`,

  cta: `This closing card points to where to open the hub.

Go to the dashboard and open BTC to scroll the stack, jump between sections, and share any card to X. The dashboard and bubblemap endpoints are open for anyone building on top of the data.

syraa.fun/btc
api.syraa.fun/btc/dashboard
api.syraa.fun/btc/bubblemap`,
};
