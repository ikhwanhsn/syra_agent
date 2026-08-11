import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Assets Hub photo deck: 15 distinct topics. */
export const ASSETS_HUB_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Assets Hub is live.

The full Tokens.xyz board sits on one page, with a dossier plus sentiment, signal, news, and events for each asset.

syraa.fun/assets`,

  thesis: `Research should not need six tabs.

Traders needed the full Tokens.xyz universe, not eight hardcoded rows. They needed dossier data plus news, sentiment, events, and signal on the same asset page.

syraa.fun/assets/solana`,

  quote: `Find the asset and read the conviction in one scroll.

Board to detail to dossier to sentiment, signal, news, and events. Discovery and research on one page.

syraa.fun/assets`,

  flow: `Board to conviction in four steps.

1. Open /assets and browse with search, filters, and pagination
2. Tap any row to open /assets/{assetId}
3. Read the dossier: price, chart, risk, and markets from Tokens.xyz
4. Scan sentiment, signal, news, and events below the chart

syraa.fun/assets`,

  timeline: `How Assets Hub shipped end to end.

1. Full board: GET /agent/tokens/board with list=all and pagination
2. Clean URLs like /assets/{assetId}, with redirects from old query links
3. Intelligence API: GET /agent/tokens/intelligence aggregates four blocks
4. Asset keywords: 35+ RSS feeds plus Google News per asset name

syraa.fun/assets`,

  pillars: `Four intel blocks on every asset.

Sentiment is bullish, bearish, or neutral from news matched to that asset. Signal is a CoinGecko recommendation with a confidence meter. News requires a primary keyword, so unrelated crypto headlines do not fill the page. Events mix calendar rows with items pulled from headlines.

syraa.fun/assets/bitcoin`,

  checklist: `Assets Hub is live now.

1. Full Tokens.xyz universe with 10-row pagination
2. Simplified board table
3. Intelligence always visible, with empty states when a block has nothing
4. Dossier and intelligence load in parallel with skeletons

syraa.fun/assets`,

  metrics: `One page for any asset.

4 intel blocks. 35+ RSS sources. 1 URL per asset.

Crypto and tokenized equities share the same research surface.

syraa.fun/agent/tokens/intelligence?assetId=solana`,

  featured: `Dossier plus intel on one URL.

Price chart, risk, sentiment, signal, news, and events load without leaving /assets/{assetId}. Four intelligence panels sit under the chart.

syraa.fun/assets/solana`,

  comparison: `Eight hardcoded rows vs the full board.

Before, eight assets used query-string URLs and showed dossier only, with no news or signal on the page. Now the full board uses URLs like /assets/solana, and free server-side intelligence sits below the chart.

syraa.fun/assets/rblxx`,

  launch: `Syra × Tokens.xyz is live.

Full asset board, dossier detail, and per-asset intelligence on one research page.

syraa.fun/assets`,

  deepDive: `Intelligence pipeline for builders.

GET /agent/tokens/intelligence?assetId= aggregates four blocks. A resolver maps name to keyword query. 35+ RSS feeds plus on-demand Google News RSS supply headlines. CoinGecko signal falls back after a 15 second timeout.

syraa.fun/agent/tokens/board?list=all`,

  split: `The board finds the asset. The detail page builds conviction.

The board paginates the full catalog with search and crypto/equity filters. The detail page loads dossier market data and four intelligence panels in parallel. Empty states sit on each intel block. Ask Syra can include that intel context.

syraa.fun/assets`,

  terminal: `Pull intel from the API.

GET intelligence for solana returns sentiment (bullish 42%, bearish 18%), signal HOLD at MEDIUM from CoinGecko, 8 news items, 2 events, and primary keywords solana and sol. Free aggregate, 200 ok.

syraa.fun/agent/tokens/intelligence?assetId=solana`,

  cta: `Research any asset in one place.

Browse the board, open a detail page, and scroll into sentiment, signal, news, and events.

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
