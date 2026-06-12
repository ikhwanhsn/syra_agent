import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for SpaceX IPO Agent photo deck — 15 distinct topics. */
export const SPCX_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `SpaceX is going public as SPCX. Syra just shipped the IPO Agent.

Live Nasdaq vs SPCXx spreads. Scam radar. Mint verifier. Three safe buy paths.

Never overpay. Never buy a fake.

Try it → syraa.fun/spcx`,

  thesis: `The SpaceX IPO window is noisy.

Scammers copy SPCX with fake tokens. Prices diverge between Nasdaq and Solana. Most people cannot tell what is real.

Syra built one hub to compare, verify, and buy safely.`,

  quote: `"Never overpay. Never buy a fake."

Track the real stock price. Compare verified on-chain venues. Verify the mint before you swap.

The IPO window needs legibility, not more hype.`,

  flow: `How to use the SpaceX IPO Agent:

1. Check the spread: Nasdaq SPCX vs live SPCXx quotes
2. Read agent bias: fair, stretched, or watch
3. Verify the mint: scam radar + mint checker
4. Pick your path: wallet, exchange, or brokerage

All on one page → syraa.fun/spcx`,

  timeline: `The safe SpaceX exposure path:

→ Open syraa.fun/spcx and check Nasdaq vs on-chain spread
→ Read Syra agent take on premium/discount
→ Run scam radar and mint verifier
→ Choose wallet swap, xStocks exchange, or brokerage track
→ Buy only after verification passes`,

  pillars: `4 layers of IPO protection on Syra:

→ Price compare: live Nasdaq with $135 reference fallback
→ Scam radar: flags impersonator tokens off-price
→ Venue playbook: wallet, exchange, and brokerage paths
→ Agent API: /experiment/spcx for bots and integrators`,

  checklist: `SpaceX IPO Agent — what's live:

→ Live Nasdaq vs SPCXx spread tracking
→ Scam radar + mint verifier before swap
→ 3 buy paths: wallet, exchange, brokerage
→ Agent bias, venue quotes, and public API
→ In-page USDC/SOL swap after verification`,

  metrics: `Three numbers for the IPO window:

→ 3 verified buy paths (wallet, exchange, brokerage)
→ 24/7 on-chain venue tracking
→ $135 IPO reference when Nasdaq feed is offline

Compare before you buy → syraa.fun/spcx`,

  featured: `One page. Every SpaceX exposure route.

Nasdaq stock. SPCXx on Solana. xStocks on Kraken. Backpack and Ondo brokerage tracks.

Syra compares them all so you never overpay or buy a fake.`,

  comparison: `Before vs now for SpaceX IPO traders:

Before: scattered prices, fake tokens, no way to compare spreads.

Now: live Nasdaq vs on-chain tracker, scam radar, mint verifier, and three safe buy paths in plain English.`,

  launch: `NOW LIVE · SpaceX IPO Agent on Syra.

Track SPCX stock vs SPCXx on Solana. Compare venues. Avoid scams. Buy safely.

The IPO window is here. Syra makes it legible.

→ syraa.fun/spcx`,

  deepDive: `SpaceX IPO Agent — technical surface:

→ GET /experiment/spcx/config — IPO reference + catalog
→ GET /experiment/spcx/latest — intelligence report
→ GET /experiment/spcx/feed — historical ticks
→ POST /experiment/spcx/tick — force refresh
→ GET /experiment/spcx/telegram-preview — share message`,

  split: `Two sides of the SpaceX IPO:

Stock side: SPCX on Nasdaq via live Yahoo Finance feed.

On-chain side: SPCXx on Solana via xStocks, Backpack, and Ondo.

Syra tracks the spread and flags anything that does not match.`,

  terminal: `SpaceX IPO Agent from CLI:

$ curl api.syraa.fun/experiment/spcx/latest
< nasdaqTicker: SPCX · nasdaqPriceUsd: 135.00
< venues: [{ symbol: SPCXx, venue: xstocks, spreadPct: 2.1 }]
< agentBias: observe · agentTake: "..."

$ curl api.syraa.fun/experiment/spcx/telegram-preview
< formatted share message ready to post`,

  cta: `Track the SpaceX IPO on Syra.

Check spreads. Verify mints. Buy safely from wallet, exchange, or brokerage.

Not financial advice. Do your own research.

→ syraa.fun/spcx`,
};
