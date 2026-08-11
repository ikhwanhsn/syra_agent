import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Flint market depth photo deck. Proof-first, no meta card talk. */
export const FLINT_INTEGRATION_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Flint market depth is inside Syra.

Five Spend tools let agents read Solana spot order books, venue stats, candles, and cross-venue tape. Pay per call with x402 (pay only when you call). See the book before you act.

syraa.fun`,

  thesis: `A single mid price is not enough for serious trading research.

Flint is a multi-maker Solana spot venue with a virtual order book. Syra now packages that depth so agents can read bids, asks, venue stats, and aggregator tape in one place.

syraa.fun`,

  quote: `See the book, then decide.

Five Spend tools, paid per call. This is market data only, not live market-making by Syra on Flint.

syraa.fun`,

  flow: `Ask, pay, then read depth.

1. Pick a pair with flint-pairs, or pass a base like PUMP with quote USDC (digital dollars)
2. Call flint-book, flint-stats, flint-candles, or flint-external-tape
3. Pay per call with x402 USDC or the agent wallet
4. Use the bids, asks, candles, or aggregator quotes in the next decision

syraa.fun`,

  timeline: `Flint shipped end to end as market data.

1. A public Flint gRPC-Web client was added for pairs, books, stats, and history
2. Routes went live under /flint/* with x402 pricing
3. Curated MCP tools were registered as syra_spend_flint_*
4. Scope stays data now. Maker and taker execution is parked

syraa.fun`,

  pillars: `What you actually get from Flint on Syra.

Book shows resting bids and asks, not just a mid. Stats summarizes makers, volume, and fill activity. Candles cover OHLC history or recent public fills. External tape gives aggregator fills and venue reference quotes.

syraa.fun`,

  checklist: `What shipped with Flint depth.

1. flint-pairs, flint-book, flint-stats, flint-candles, and flint-external-tape are registered
2. Routes are live at /flint/* with x402 pricing
3. Curated MCP tools are named syra_spend_flint_*
4. Pair lookup is easy, for example PUMP/USDC or WSOL/USDC
5. No live market-making claims

syraa.fun`,

  metrics: `Depth without building Solana DEX infrastructure yourself.

5 agent tools. L2 book depth. Calls from about $0.001.

Flint supplies the venue book. Syra packages it for agents with pay-per-call pricing.

syraa.fun`,

  featured: `Order-book depth now lives inside Syra.

Five tools: pairs, books, stats, candles, and external tape. Ask once, pay per call.

syraa.fun`,

  comparison: `Mid-only feeds made it hard to size risk.

Before, many agent tools returned a single price. Now flint-book returns bids and asks, and flint-external-tape adds aggregator quotes in the same conversation.

syraa.fun`,

  launch: `Syra and Flint are live together for market data.

Five Spend tools cover pairs, books, stats, candles, and external tape for Solana spot research. Paid through the existing Syra x402 path. See the book before you trade.

syraa.fun
docs.flintlabs.dev`,

  deepDive: `Under the hood it is Flint public market data, packaged for agents.

Syra calls Flint over gRPC-Web at mainnet.api.flint.trade. Unary snapshots are cached for request and response. Routes are x402 Tier 1 or Tier 2 under /flint/*. MCP exposes syra_spend_flint_* in the curated profile. Maker quoting and taker swaps stay out of scope until depth and access prove worth it.

syraa.fun`,

  split: `Read Flint depth first, then act in the same agent loop.

Use flint-book and flint-stats for research on depth and venue health. Use flint-candles for history. Use flint-external-tape to compare aggregator quotes. From there, the same agent can move into a Jupiter swap or another Spend tool.

syraa.fun`,

  terminal: `A real request path for Flint on Syra.

GET /flint/book?base=PUMP&quote=USDC returns an L2 snapshot with bids and asks. syra_spend_flint_stats returns makers, volume, and venue health. syra_spend_flint_external_tape returns Jupiter, OKX, and DFlow quotes. The same data is available in MCP for Cursor and Claude.

syraa.fun`,

  cta: `Ask Syra for Flint depth.

Try flint-book on a listed pair like PUMP/USDC or WSOL/USDC. Market data only. We are not advertising live Syra market-making on Flint.

syraa.fun/chat
docs.flintlabs.dev`,
};
