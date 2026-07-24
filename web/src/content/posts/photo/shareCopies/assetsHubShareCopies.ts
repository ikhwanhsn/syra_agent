import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Assets Hub photo deck: 15 distinct topics. */
export const ASSETS_HUB_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `This cover announces the full Assets Hub replacing eight hardcoded rows.

Syra now lists the entire Tokens.xyz board with search, filters, and pagination, and every asset page carries a dossier plus sentiment, signal, news, and events.

syraa.fun/assets`,

  thesis: `This card states the gap Assets Hub closes.

Traders needed the full Tokens.xyz universe, not eight hardcoded rows, and they needed dossier data sitting next to news, sentiment, events, and signal on the same asset page.

syraa.fun/assets/solana`,

  quote: `This card carries the line behind the redesign: find the asset, read the conviction, in one scroll.

Board leads to detail, detail leads to dossier, and dossier sits next to sentiment, signal, news, and events, all on the same page.

syraa.fun/assets`,

  flow: `This image walks through researching an asset, in four steps.

1. Open the Assets board and browse with search, filters, and pagination
2. Tap any row to navigate to its own asset page
3. Read the dossier for price, chart, risk, and markets from Tokens.xyz
4. Scan the sentiment, signal, news, and events sections below the chart

syraa.fun/assets`,

  timeline: `This timeline traces how Assets Hub shipped end to end.

1. A full board endpoint returns the entire catalog with list set to all and pagination
2. Clean URLs like /assets/solana replaced query strings, with redirects for old links
3. An intelligence endpoint aggregates sentiment, signal, news, and events in one call
4. More than 35 RSS feeds plus Google News get matched against each asset's keywords

syraa.fun/assets`,

  pillars: `This bento layout shows the four intelligence blocks on every asset page.

Sentiment reads bullish, bearish, or neutral tone from news matched to that asset. Signal comes from a CoinGecko OHLC recommendation with a confidence meter. News stays scoped to a required primary keyword instead of falling back to unrelated crypto headlines. Events combines calendar rows with items derived from headlines.

syraa.fun/assets/bitcoin`,

  checklist: `This checklist covers what's live in Assets Hub.

1. The full Tokens.xyz universe is listed with ten-row pagination
2. The board table UI is simplified
3. Intelligence panels stay visible with proper empty states
4. Dossier and intelligence data load in parallel on each asset page

syraa.fun/assets`,

  metrics: `This card lists the numbers behind Assets Hub.

Four intelligence blocks, sentiment, signal, news, and events, sit on every asset page. More than 35 RSS sources feed the news matching. One URL per asset now covers both crypto and tokenized equities on the same research surface.

syraa.fun/agent/tokens/intelligence?assetId=solana`,

  featured: `This featured card highlights how much sits on one asset URL.

Price chart, risk, sentiment, signal, news, and events all load without leaving a single asset page.

syraa.fun/assets/solana`,

  comparison: `This before and after card compares the old and new assets page.

Before, eight hardcoded assets used query-string URLs and showed dossier data only, with no news or signal on the page. Now, the full board uses clean URLs like /assets/rblxx, and free server-side intelligence loads below the chart.

syraa.fun/assets/rblxx`,

  launch: `This launch card marks the full Tokens.xyz board as live on Syra.

Every asset now has its own dossier detail page plus per-asset intelligence, sitting on the same research page.

syraa.fun/assets`,

  deepDive: `This deep-dive card lists the intelligence pipeline for builders.

A GET request to the tokens intelligence endpoint with an assetId aggregates all four blocks. A resolver maps an asset's name to its keyword query, more than 35 RSS feeds plus on-demand Google News RSS supply headlines, and a CoinGecko signal call falls back gracefully after a 15 second timeout.

syraa.fun/agent/tokens/board?list=all`,

  split: `This split card explains how the board and detail page divide the work.

The board paginates the full catalog with search and filters for crypto or equities. The detail page loads dossier market data and all four intelligence panels in parallel, and Ask Syra can pull that same intelligence context into its answers.

syraa.fun/assets`,

  terminal: `This terminal card shows the intelligence API for a single asset.

Calling the tokens intelligence endpoint for solana returns sentiment at 42 percent bullish and 18 percent bearish, a signal of hold at medium confidence from CoinGecko, eight news items, two events, and the primary keywords solana and sol used for matching.

syraa.fun/agent/tokens/intelligence?assetId=solana`,

  cta: `This closing card points to where to start researching an asset.

Browse the full board, or jump straight to an asset page like Solana or RBLXX to see the dossier and intelligence panels together.

syraa.fun/assets
syraa.fun/assets/solana
syraa.fun/assets/rblxx`,
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
