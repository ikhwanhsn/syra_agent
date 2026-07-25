import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Flint market depth photo deck. */
export const FLINT_INTEGRATION_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `This cover announces Flint market depth landing inside Syra.

Five new Spend tools let agents read Solana spot order books, venue stats, candles, and external aggregator tape. Pay per call with x402 or MCP.

syraa.fun`,

  thesis: `This card names the problem Flint helps solve.

A single mid price is not enough for serious agent trading research. Flint is a multi-maker Solana spot venue with a virtual order book. Syra now wraps that depth so agents can see bids, asks, venue activity, and aggregator tape before they act.

syraa.fun`,

  quote: `The line on this card is the product in plain words: see the book, then decide.

Agents get structured depth and tape through Syra. This is market data only, not Syra market-making on Flint.

syraa.fun`,

  flow: `This image walks the call in four steps.

1. Pick a pair with flint-pairs, or pass a base like PUMP with quote USDC
2. Call flint-book, flint-stats, flint-candles, or flint-external-tape
3. Pay per call with x402 USDC or the agent wallet
4. Use the bids, asks, candles, or aggregator quotes in your next decision

syraa.fun`,

  timeline: `This timeline shows what shipped with the Flint integration.

1. A public Flint gRPC-Web client was added for pairs, books, stats, and history
2. Five x402 routes went live under /flint/*
3. Agent tools and MCP syra_spend_flint_* tools were registered
4. Docs and launch notes explain market data only, with maker and taker work parked

syraa.fun`,

  pillars: `This bento layout breaks down what users actually get.

Book shows resting bids and asks. Stats summarizes makers and 24h volume. Candles cover OHLC history or public fills. External tape gives a short snapshot of aggregator fills and venue reference quotes from places like Jupiter and OKX.

syraa.fun`,

  checklist: `This checklist is what shipped with Flint depth.

1. flint-pairs, flint-book, flint-stats, flint-candles, and flint-external-tape are registered
2. Routes are live at /flint/* with x402 pricing
3. Curated MCP tools are named syra_spend_flint_*
4. Docs explain kill criteria for maker and taker work
5. No live market-making claims in the product story

syraa.fun`,

  metrics: `The numbers on this card describe the release.

Five agent tools are live. L2 book depth is the default view. Calls start at about $0.001 on the Tier 1 routes. Agents get depth without building Solana DEX infrastructure themselves.

syraa.fun`,

  featured: `This featured card is about what Flint puts inside Syra for agents.

Order-book depth and cross-venue tape, reachable by asking once and paying per call.

syraa.fun`,

  comparison: `This before-and-after card compares mid-only feeds to real depth.

Before, many agent tools only returned a single price. Now flint-book returns bids and asks, while flint-external-tape adds aggregator reference quotes so agents can compare venues in the same conversation.

syraa.fun`,

  launch: `This launch card marks Flint market data going live inside Syra.

Five Spend tools cover pairs, books, stats, candles, and external tape for Solana spot research. Paid through the existing Syra x402 path.

syraa.fun
docs.flintlabs.dev`,

  deepDive: `This deep-dive card lists the technical surface behind the integration.

Syra calls Flint public market data over gRPC-Web. Responses are cached briefly, priced as Tier 1 or Tier 2 x402 routes, and exposed as MCP tools. Maker quoting and taker swaps stay out of scope until depth and access prove worth it.

syraa.fun`,

  split: `This split card explains how Flint pairs with the rest of Syra.

Use flint-book and flint-stats for research on depth and venue health. Use flint-candles for history. Use flint-external-tape to compare aggregator quotes. From there, the same agent can move into a Jupiter swap or another Spend tool to act.

syraa.fun`,

  terminal: `This terminal card shows a real request path.

GET /flint/book?base=PUMP&quote=USDC returns an L2 snapshot with bids and asks. The same data is available as syra_spend_flint_book in MCP for Cursor and Claude.

syraa.fun`,

  cta: `This closing card is the ship summary: ask Syra for Flint depth.

Try flint-book on a listed pair like PUMP/USDC or WSOL/USDC. Market data only. We are not advertising live Syra market-making on Flint.

syraa.fun/chat
docs.flintlabs.dev`,
};
