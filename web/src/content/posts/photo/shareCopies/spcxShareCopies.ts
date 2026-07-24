import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for SpaceX IPO Agent photo deck: 15 distinct topics. */
export const SPCX_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `This cover announces buy and sell support on the SpaceX IPO Agent.

The hub tracks Nasdaq SPCX against on-chain SPCXx in realtime and now lets you trade both directions from your own wallet, with safety checks running before every swap.

syraa.fun/spcx`,

  thesis: `This card states the problem the SpaceX IPO Agent solves.

SPCX trades on Nasdaq while SPCXx trades on Solana, and spreads between the two can move fast. Fake tokens still copy the ticker. Syra built realtime tracking alongside two-way wallet trading on one page so traders are not guessing.

syraa.fun/spcx`,

  quote: `This card carries the line behind the update: track live, trade both ways, stay protected.

Realtime Nasdaq versus SPCXx spreads sit next to buy and sell controls, with safety checks running before every swap on a market that is genuinely live.

syraa.fun/spcx`,

  flow: `This image walks through trading SpaceX exposure, in four steps.

1. Watch live prices, with Nasdaq SPCX compared against SPCXx on a roughly ten second refresh
2. Read the agent bias, which calls the spread fair, stretched, or worth watching
3. Open the Trade tab and toggle between Buy and Sell with a live chart and preset amounts
4. Confirm the swap, sending USDC or SOL in, or SPCXx out, through Jupiter

syraa.fun/spcx`,

  timeline: `This timeline traces a trade from spread check to confirmation.

1. Open the SPCX hub to see realtime Nasdaq quotes against on-chain venues
2. Read the agent's premium or discount summary and venue status
3. Pick Buy or Sell in the Trade tab, using balance presets and the live chart
4. Confirm the swap through Jupiter routing, with safety checks running before execution

syraa.fun/spcx`,

  pillars: `This bento layout shows the four layers between you and a bad SpaceX trade.

Realtime tracking polls Nasdaq roughly every ten seconds against on-chain quotes. Buy and sell both work from the wallet with USDC, SOL, and a Max preset. The Trade tab adds a live chart with quick amount chips and a compact safety strip. Jupiter Ultra handles routing with a V1 fallback and authenticated signing.

syraa.fun/spcx`,

  checklist: `This checklist covers what's live on the SpaceX IPO Agent.

1. Realtime Nasdaq versus SPCXx spread tracking
2. Buy and sell SPCXx from the Trade tab
3. A live price chart with compact safety checks
4. Agent bias, venue quotes, and a public API

syraa.fun/spcx`,

  metrics: `This card lists the numbers behind live SpaceX trading.

Trading works two ways from the wallet. Prices refresh roughly every ten seconds. On-chain tracking runs around the clock, so spreads stay visible and both sides of a trade stay protected from fake tokens.

syraa.fun/spcx`,

  featured: `This featured card highlights the single page that covers tracking and trading.

Nasdaq SPCX prices update live, SPCXx trades on Solana, and buying or selling both happen from the same wallet. Venues like xStocks, Backpack, and Ondo get compared in plain English.

syraa.fun/spcx`,

  comparison: `This before and after card compares the old and new SpaceX trading experience.

Before, the page only supported buying, refreshed slower, still framed things as pre-IPO, and had a cluttered safety UI on the trade flow. Now, tracking is realtime, both buy and sell work, a live price chart sits in a premium Trade tab, and Jupiter routing is more reliable.

syraa.fun/spcx`,

  launch: `This launch card marks buy and sell trading as live on the SpaceX IPO Agent.

The hub tracks Nasdaq and on-chain venues in realtime, then lets you buy or sell SPCXx from a single Trade tab.

syraa.fun/spcx`,

  deepDive: `This deep-dive card lists the backend and swap reliability work behind the update.

The latest endpoint runs a lazy tick on poll with roughly a ten second cooldown, while the frontend polls the latest data every ten seconds and the feed every fifteen. Swaps route through Jupiter Ultra with a V1 fallback, guest wallets are blocked from signing, and swap tools are enabled on agent wallet allowlists.

syraa.fun/spcx`,

  split: `This split card explains the two markets behind one spread.

SPCX trades on Nasdaq through a live Yahoo Finance feed. SPCXx trades on Solana through xStocks, Backpack, and Ondo. Syra tracks the gap between them in realtime and supports buying or selling from the same Trade tab.

syraa.fun/spcx`,

  terminal: `This terminal card shows the SpaceX intelligence API and trade flow.

Calling the latest endpoint returns the Nasdaq ticker and price alongside on-chain venue quotes like SPCXx on xStocks, plus an agent bias such as observe and a refresh time around ten seconds old. From there, opening the SPCX hub and switching to the Trade tab lets you buy or sell directly.

syraa.fun/spcx`,

  cta: `This closing card points to where to trade SpaceX exposure.

Open the SPCX hub to watch live spreads and trade both directions, or pull the latest report and Telegram preview from the API if you want the raw data. This is not financial advice.

syraa.fun/spcx
api.syraa.fun/experiment/spcx/latest
api.syraa.fun/experiment/spcx/telegram-preview`,
};
