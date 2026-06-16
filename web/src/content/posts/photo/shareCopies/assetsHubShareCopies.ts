import type { PostPhotoCardRole } from "../photoCardSlots";

/**
 * Per-card X copy for Assets Hub photo deck — 15 distinct voices.
 * Mix short/long, questions/stats/CLI, and different CTAs so a 15-post thread
 * does not read like the same caption pasted 15 times.
 */
export const ASSETS_HUB_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `We stopped hardcoding eight assets.

Syra now lists the entire Tokens.xyz board — search, filter, paginate — then opens clean /assets/{id} pages with live intelligence underneath.

Start here → syraa.fun/assets`,

  thesis: `Honest question for researchers:

How many tabs do you open to check sentiment, news, and signal on one token?

We folded all four into a single asset page. No tab hopping.`,

  quote: `"Discovery and conviction belong on one page."

Board → detail → dossier → intelligence. That's the whole idea.`,

  flow: `Try it in 30 seconds:

1. Open syraa.fun/assets
2. Search "SOL"
3. Tap the row
4. Scroll past the chart

Sentiment, signal, news, events — all on that page.`,

  timeline: `June ship log — what actually landed:

• Full Tokens.xyz catalog on /assets
• Canonical routes like /assets/solana
• New /agent/tokens/intelligence endpoint
• 35+ RSS feeds matched per asset name
• Parallel loading skeletons on detail pages`,

  pillars: `Sentiment — headline tone from matched news
Signal — CoinGecko OHLC recommendation
News — keyword-scoped, no random crypto filler
Events — calendar + headline-derived rows

Four blocks. One scroll on /assets/{id}.`,

  checklist: `What's done:
— Full universe (not a preset list)
— 10-row pagination
— Simpler table UI
— Intelligence panels with empty states
— Dossier + intel load together`,

  metrics: `4 intel blocks
35+ RSS sources
1 URL per asset

Crypto and tokenized equities share the same research surface now.`,

  featured: `One detail page. Every research block.

Price chart, risk, sentiment, signal, news, and events — without leaving /assets/{assetId}.

Open SOL and count the panels below the chart.`,

  comparison: `Old Syra assets page:
8 hardcoded rows. Query strings. Dossier only.

Today's:
Full board. /assets/rblxx URLs. Sentiment + signal + news + events baked in.`,

  launch: `LIVE NOW — browse every Tokens.xyz asset on Syra.

Detail pages ship intelligence free. No x402 from the dashboard.

syraa.fun/assets/solana`,

  deepDive: `For builders:

GET /agent/tokens/board?list=all
GET /agent/tokens/dossier?assetId=
GET /agent/tokens/intelligence?assetId=

Resolver is name-first. "Roblox" → roblox keywords. Google News RSS on demand.`,

  split: `BOARD side: discovery at scale. Search crypto vs equity. Paginate ten at a time.

DETAIL side: conviction without leaving. Dossier loads next to four intel panels in parallel.

Same product. Two jobs.`,

  terminal: `$ curl -s syraa.fun/agent/tokens/intelligence?assetId=solana

> sentiment: ok · bullish 42% · bearish 18%
> signal: HOLD · MEDIUM · coingecko
> news: 8 items · events: 2 items
> query.primaryKeywords: ["solana","sol"]
< 200 ok · free aggregate`,

  cta: `Pick any ticker — SOL, BTC, RBLXX — and open its dossier.

If you're building research workflows, this is the page to bookmark.

syraa.fun/assets`,
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
