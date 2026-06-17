import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for SpaceX IPO Agent photo deck — 15 distinct topics. */
export const SPCX_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `SPCX is live on Nasdaq. Syra shipped buy and sell on the IPO Agent.

Realtime Nasdaq vs SPCXx spreads. Live price chart. Wallet swap both ways.

See the spread. Trade with checks. Skip fake tokens.

Try it → syraa.fun/spcx`,

  thesis: `The SpaceX IPO is live. Trading it shouldn't mean guessing spreads or chasing fake tokens.

SPCX trades on Nasdaq. SPCXx trades on Solana. Premiums move fast. Scammers still copy the ticker.

Syra built realtime tracking plus buy and sell on one page — with safety checks before every swap.`,

  quote: `"Track live. Trade both ways. Stay protected."

Realtime Nasdaq vs SPCXx spreads. Buy or sell from your wallet. Safety checks before every swap.

The IPO is live. Syra makes the spread legible.`,

  flow: `How to trade SpaceX on Syra:

1. Watch live prices: Nasdaq SPCX vs SPCXx quotes (~10s refresh)
2. Read agent bias: fair, stretched, or watch
3. Open Trade tab: toggle Buy or Sell with live chart
4. Confirm swap: USDC/SOL in, or SPCXx out via Jupiter

One page. Full loop → syraa.fun/spcx`,

  timeline: `From spread check to confirmed trade:

→ Open syraa.fun/spcx — realtime Nasdaq vs on-chain quotes
→ Read Syra agent take on premium/discount
→ Open Trade tab, pick Buy or Sell, choose amount
→ Review live chart and safety strip
→ Confirm wallet swap via Jupiter with auth signing`,

  pillars: `4 layers between you and a bad SpaceX trade:

→ Realtime tracking: live Nasdaq with ~10s polling
→ Buy + sell: wallet swap both ways with balance presets
→ Live chart: premium trade UI with quick amount chips
→ Reliable routing: Jupiter Ultra with V1 fallback`,

  checklist: `SpaceX IPO Agent — what's live:

→ Realtime Nasdaq vs SPCXx spread tracking
→ Buy and sell SPCXx from the Trade tab
→ Live price chart and compact safety checks
→ Agent bias, venue quotes, and public API
→ Jupiter swap with authenticated wallet signing`,

  metrics: `Three numbers for live SpaceX trading:

→ Buy + Sell: two-way wallet trading on Solana
→ ~10s: realtime price refresh on web and API
→ 24/7: on-chain venue tracking

Watch the spread move. Trade when it makes sense → syraa.fun/spcx`,

  featured: `One page. Track and trade SpaceX exposure.

Nasdaq SPCX live. SPCXx on Solana. Buy or sell from your wallet. xStocks, Backpack, and Ondo compared in plain English.

Spreads legible. Trading protected.`,

  comparison: `Before vs now for SpaceX traders:

Before: buy-only swap, slower refresh, pre-IPO framing, cluttered safety UI.

Now: realtime tracking, buy and sell, live price chart, premium Trade tab, reliable Jupiter routing.

The IPO is live. The desk caught up.`,

  launch: `NOW LIVE · Buy and sell SpaceX on Syra.

SPCX is trading on Nasdaq. Track realtime spreads vs SPCXx on Solana. Buy or sell from the Trade tab.

Realtime intel. Wallet execution. Safety checks built in.

→ syraa.fun/spcx`,

  deepDive: `SpaceX IPO Agent — system update:

→ GET /experiment/spcx/latest — lazy tick on poll (~10s cooldown)
→ GET /experiment/spcx/feed — historical ticks every 15s on web
→ Jupiter Ultra → V1 fallback for reliable USDC/SOL ↔ SPCXx swaps
→ Auth-required signing: guest wallets blocked from tx_sign
→ Swap tools enabled on agent wallet allowlists

Built for live markets, not pre-IPO demos.`,

  split: `Two markets. One spread. Trade both ways.

Stock side: SPCX on Nasdaq via live Yahoo Finance feed.

On-chain side: SPCXx on Solana via xStocks, Backpack, and Ondo.

Syra tracks the gap in realtime and lets you buy or sell from one Trade tab.`,

  terminal: `SpaceX IPO Agent from CLI:

$ curl api.syraa.fun/experiment/spcx/latest
< nasdaqTicker: SPCX · nasdaqPriceUsd: live
< venues: [{ symbol: SPCXx, venue: xstocks, spreadPct: live }]
< agentBias: observe · refreshedAt: ~10s ago

$ open syraa.fun/spcx → Trade tab → Buy or Sell`,

  cta: `Trade SpaceX exposure on Syra.

Watch live spreads. Buy or sell SPCXx from your wallet. Compare venues. Safety checks before every swap.

Not financial advice. Do your own research.

→ syraa.fun/spcx`,
};
