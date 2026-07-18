import type { PostPhotoCardRole } from "../photoCardSlots";

/**
 * Per-card X copy for Assets Hub photo deck: 15 distinct voices.
 * Mix short/long, questions/stats/CLI, and different CTAs so a 15-post thread
 * does not read like the same caption pasted 15 times.
 */
export const ASSETS_HUB_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `SHIP LOG · Eight hardcoded assets was never a research product.

Syra now lists the full Tokens.xyz board with search, filter, and pagination. Dossier plus intelligence on every /assets/{id} page.

Start here → syraa.fun/assets`,

  thesis: `How many tabs do you open to check sentiment, news, and signal on one token?

We folded all four into a single asset page. Dossier above. Intelligence below.

No tab hopping.`,

  quote: `"Find the asset. Read the conviction. One scroll."

Board to detail to dossier to sentiment, signal, news, events.

That is the whole research loop.`,

  flow: `Try it in 30 seconds:

1. Open syraa.fun/assets
2. Search "SOL"
3. Tap the row
4. Scroll past the chart

Sentiment, signal, news, events. All on that page.`,

  timeline: `What shipped in Assets Hub:

→ Full Tokens.xyz catalog on /assets
→ Canonical routes like /assets/solana
→ GET /agent/tokens/intelligence endpoint
→ 35+ RSS feeds matched per asset name
→ Parallel loading skeletons on detail pages`,

  pillars: `Four intel blocks. One asset page:

→ Sentiment: headline tone from matched news
→ Signal: CoinGecko OHLC recommendation
→ News: keyword-scoped, no random crypto filler
→ Events: calendar + headline-derived rows

Scroll once. Read everything.`,

  checklist: `Assets Hub checklist. Live now:

→ Full Tokens.xyz universe (not a preset list)
→ 10-row pagination + search/filters
→ Intelligence panels with empty states
→ Dossier + intel load in parallel
→ Ask Syra pulls intel context

Open the board → syraa.fun/assets`,

  metrics: `4 intel blocks.
35+ RSS sources.
1 URL per asset.

Crypto and tokenized equities share the same research surface now.`,

  featured: `Dossier plus intel. One URL.

Price chart, risk, sentiment, signal, news, and events without leaving /assets/{assetId}.

Open SOL and count the panels below the chart.`,

  comparison: `Old Syra assets page:
8 hardcoded rows. Query strings. Dossier only.

Today's Assets Hub:
Full board. /assets/rblxx URLs. Sentiment + signal + news + events baked in.

Same product. Actual research workflow.`,

  launch: `SHIP LOG · Browse every Tokens.xyz asset on Syra.

Detail pages ship intelligence free. No x402 from the dashboard.

→ syraa.fun/assets
→ syraa.fun/assets/solana`,

  deepDive: `For builders. Assets Hub APIs:

→ GET /agent/tokens/board?list=all
→ GET /agent/tokens/dossier?assetId=
→ GET /agent/tokens/intelligence?assetId=

Resolver is name-first. "Roblox" maps to roblox keywords. Google News RSS on demand.`,

  split: `BOARD: discovery at scale.
Search crypto vs equity. Paginate ten at a time.

DETAIL: conviction without leaving.
Dossier loads next to four intel panels in parallel.

Two surfaces. One research product.`,

  terminal: `$ curl -s syraa.fun/agent/tokens/intelligence?assetId=solana

> sentiment: ok · bullish 42% · bearish 18%
> signal: HOLD · MEDIUM · coingecko
> news: 8 items · events: 2 items
> query.primaryKeywords: ["solana","sol"]
< 200 ok · free aggregate`,

  cta: `Research any asset in one place.

Pick SOL, BTC, or RBLXX. Dossier and intelligence on the same page.

→ syraa.fun/assets
→ syraa.fun/assets/solana`,
};

/** Unique footer links for cards whose copy has no embedded URL. */
export const ASSETS_HUB_PHOTO_SHARE_FOOTERS: Partial<Record<PostPhotoCardRole, string>> = {
  thesis: "https://www.syraa.fun/assets/solana",
  quote: "https://www.syraa.fun/assets",
  pillars: "https://www.syraa.fun/assets/bitcoin",
  checklist: "https://www.syraa.fun/assets",
  metrics: "https://www.syraa.fun/agent/tokens/intelligence?assetId=solana",
  featured: "https://www.syraa.fun/assets/solana",
  comparison: "https://www.syraa.fun/assets/rblxx",
  split: "https://www.syraa.fun/assets",
  deepDive: "https://www.syraa.fun/agent/tokens/board?list=all",
};
