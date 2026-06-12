import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for SpaceX IPO Agent photo deck — 15 distinct topics. */
export const SPCX_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `SpaceX is live as SPCX. Syra just shipped buy and sell on the IPO Agent.

Realtime Nasdaq vs SPCXx spreads. Live price chart. Wallet swap both ways.

Track live. Trade safely.

Try it → syraa.fun/spcx`,

  thesis: `The SpaceX IPO is live.

Spreads move between Nasdaq and Solana. Scammers still copy SPCX with fake tokens. Most people need one place to see live prices and trade without guessing.

Syra built realtime tracking plus buy and sell on one page.`,

  quote: `"Track live. Trade both ways. Stay protected."

Realtime Nasdaq vs SPCXx spreads. Buy or sell from your wallet. Safety checks before every swap.

The IPO is live. Syra makes trading it legible.`,

  flow: `How to use the SpaceX IPO Agent:

1. Watch live prices: Nasdaq SPCX vs SPCXx quotes (~10s refresh)
2. Read agent bias: fair, stretched, or watch
3. Open Trade tab: toggle Buy or Sell with live chart
4. Confirm swap: USDC/SOL in, or SPCXx out

All on one page → syraa.fun/spcx`,

  timeline: `The live SpaceX trading path:

→ Open syraa.fun/spcx and watch realtime Nasdaq vs on-chain spread
→ Read Syra agent take on premium/discount
→ Open Trade tab, pick Buy or Sell, choose amount
→ Review live chart and safety strip
→ Confirm wallet swap via Jupiter`,

  pillars: `4 layers of live-market trading on Syra:

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

Trade the spread → syraa.fun/spcx`,

  featured: `One page. Track and trade SpaceX exposure.

Nasdaq SPCX live. SPCXx on Solana. Buy or sell from your wallet. xStocks, Backpack, and Ondo compared in plain English.

Syra keeps spreads legible and trading safe.`,

  comparison: `Before vs now for SpaceX traders:

Before: buy-only swap, slower refresh, pre-IPO framing, cluttered safety UI.

Now: realtime tracking, buy and sell, live price chart, premium Trade tab, reliable Jupiter routing.`,

  launch: `NOW LIVE · Buy and sell SpaceX on Syra.

SPCX is trading on Nasdaq. Track realtime spreads vs SPCXx on Solana. Buy or sell from the Trade tab.

The IPO is live. Syra makes it tradeable.

→ syraa.fun/spcx`,

  deepDive: `SpaceX IPO Agent — system update:

→ GET /experiment/spcx/latest — lazy tick on poll (~10s cooldown)
→ GET /experiment/spcx/feed — historical ticks every 15s on web
→ Jupiter Ultra → V1 fallback for reliable USDC/SOL ↔ SPCXx swaps
→ Auth-required signing: guest wallets blocked from tx_sign
→ Swap tools enabled on agent wallet allowlists`,

  split: `Two sides of the live SpaceX market:

Stock side: SPCX on Nasdaq via live Yahoo Finance feed.

On-chain side: SPCXx on Solana via xStocks, Backpack, and Ondo.

Syra tracks the spread in realtime and lets you trade both ways.`,

  terminal: `SpaceX IPO Agent from CLI:

$ curl api.syraa.fun/experiment/spcx/latest
< nasdaqTicker: SPCX · nasdaqPriceUsd: live
< venues: [{ symbol: SPCXx, venue: xstocks, spreadPct: live }]
< agentBias: observe · refreshedAt: ~10s ago

$ open syraa.fun/spcx → Trade tab → Buy or Sell`,

  cta: `Trade SpaceX exposure on Syra.

Watch live spreads. Buy or sell SPCXx from your wallet. Compare venues. Stay protected.

Not financial advice. Do your own research.

→ syraa.fun/spcx`,
};
