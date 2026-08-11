import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for SpaceX IPO Agent photo deck: 15 distinct topics. */
export const SPCX_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Buy and sell are live on the SpaceX IPO Agent.

The hub tracks Nasdaq SPCX against on-chain SPCXx in realtime and lets you trade both directions from your own wallet. Safety checks run before every swap.

syraa.fun/spcx`,

  thesis: `Nasdaq SPCX and Solana SPCXx can drift apart fast, and guessing that gap is a bad way to trade.

SPCX trades on Nasdaq. SPCXx trades on Solana. Spreads move quickly, and fake tokens still copy the ticker. Syra put realtime tracking and two-way wallet trading on one page.

syraa.fun/spcx`,

  quote: `Track live, trade both ways, and stay protected.

Realtime Nasdaq versus SPCXx spreads sit next to buy and sell from your wallet. Safety checks run before every swap on a market that is actually live.

syraa.fun/spcx`,

  flow: `Trading SpaceX exposure is four steps.

1. Watch live prices, with Nasdaq SPCX compared against SPCXx on a roughly ten second refresh
2. Read the agent bias, which calls the spread fair, stretched, or worth watching
3. Open the Trade tab and toggle Buy or Sell with a live chart and preset amounts
4. Confirm the swap, sending USDC or SOL in, or SPCXx out, through Jupiter

syraa.fun/spcx`,

  timeline: `A trade goes from spread check to confirmation in four steps.

1. Open the SPCX hub to see realtime Nasdaq quotes against on-chain venues
2. Read the agent's premium or discount summary and venue status
3. Pick Buy or Sell in the Trade tab, using balance presets and the live chart
4. Confirm the swap through Jupiter routing, with safety checks before execution

syraa.fun/spcx`,

  pillars: `Four layers sit between you and a bad SpaceX trade.

Realtime tracking polls Nasdaq roughly every ten seconds against on-chain quotes. Buy and sell both work from the wallet with USDC, SOL, and a Max preset. The Trade tab adds a live chart, quick amount chips, and a compact safety strip. Jupiter Ultra handles routing with a V1 fallback and authenticated signing.

syraa.fun/spcx`,

  checklist: `What is live on the SpaceX IPO Agent.

1. Realtime Nasdaq versus SPCXx spread tracking
2. Buy and sell SPCXx from the Trade tab
3. A live price chart with compact safety checks
4. Agent bias, venue quotes, and a public API

syraa.fun/spcx`,

  metrics: `Two-way wallet trading. Prices refresh about every ten seconds. On-chain tracking runs around the clock.

Watch spreads move in realtime, trade both directions from your wallet, and stay protected from fake tokens that copy the ticker.

syraa.fun/spcx`,

  featured: `One page to track and trade SpaceX exposure.

Nasdaq SPCX prices update live. SPCXx trades on Solana. Buying or selling both happen from the same wallet. Venues like xStocks, Backpack, and Ondo get compared in plain English.

syraa.fun/spcx`,

  comparison: `The old SpaceX flow was buy-only and slower. The new one tracks live and trades both ways.

Before, the page only supported buying, refreshed slower, still framed things as pre-IPO, and cluttered the safety UI. Now tracking is realtime, buy and sell both work, a live price chart sits in the Trade tab, and Jupiter routing is more reliable.

syraa.fun/spcx`,

  launch: `Buy and sell SpaceX is live on Syra.

The IPO hub tracks Nasdaq and on-chain venues in realtime, then lets you buy or sell SPCXx from one Trade tab. Realtime spreads, wallet trading, live chart.

syraa.fun/spcx`,

  deepDive: `The backend and swap path got more reliable.

The latest endpoint runs a lazy tick on poll with roughly a ten second cooldown. The frontend polls latest data every ten seconds and the feed every fifteen. Swaps route through Jupiter Ultra with a V1 fallback. Guest wallets cannot sign, and swap tools are enabled on agent wallet allowlists.

syraa.fun/spcx`,

  split: `Two markets, one spread, and you can trade both ways.

SPCX trades on Nasdaq through a live Yahoo Finance feed. SPCXx trades on Solana through xStocks, Backpack, and Ondo. Syra tracks the gap in realtime and supports buying or selling from the same Trade tab.

syraa.fun/spcx`,

  terminal: `The SpaceX intelligence API returns a live Nasdaq quote next to on-chain venue prices.

A call to the latest endpoint shows ticker SPCX, venue quotes such as SPCXx on xStocks, an agent bias such as observe, and a refresh around ten seconds old. From there, open the hub and use the Trade tab to buy or sell.

syraa.fun/spcx`,

  cta: `Trade SpaceX exposure on Syra.

Watch live spreads, buy or sell SPCXx, and run safety checks before every swap. This is not financial advice.

syraa.fun/spcx
api.syraa.fun/experiment/spcx/latest
api.syraa.fun/experiment/spcx/telegram-preview`,
};
