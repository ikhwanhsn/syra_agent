import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Blocksize market data photo deck. */
export const BLOCKSIZE_INTEGRATION_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Blocksize x Syra is live for institutional VWAP and bid/ask.

AI agents pull quotes from mcp.blocksize.info and settle with x402 (pay only when you call) or credits. No Blocksize account form.

syraa.fun/chat`,

  thesis: `Autonomous size needs a reference price.

Retail mids lie under thin books. Blocksize aggregates institutional crypto VWAP and bid/ask so Syra agents can quote before they move.

syraa.fun/chat`,

  quote: `Oracle-grade tape with agent checkout.

Search is free. Pay for VWAP and bid/ask. A pre-trade check can run before you size the ticket.

syraa.fun/chat`,

  flow: `Search, quote, guard, then act.

1. Search a pair, for example blocksize-search q=SOLUSD
2. Quote VWAP or bid/ask. The agent pays 402.
3. Optional pre-trade check
4. Feed the result into swap or invest logic

syraa.fun/chat`,

  timeline: `Blocksize MCP wired end to end.

1. agentBlocksizeClient plus X-AGENT-ID
2. Settle from agent Solana USDC (digital dollars)
3. Tools: search, vwap, bidask, pre-trade
4. Spend pillar plus partner page

syraa.fun/chat`,

  pillars: `Four Blocksize tools.

Search is free and finds pairs before you spend. VWAP returns institutional snapshots. Bid/ask returns spread-aware quotes. Pre-trade, about $0.10, checks freshness and drift.

syraa.fun/chat`,

  checklist: `What ships with this update.

1. blocksize-* agent tools registered
2. Free search before paid quotes
3. Agent Solana USDC or credits checkout
4. Partner page at syraa.fun/partner/blocksize
5. Host: mcp.blocksize.info

syraa.fun/partner/blocksize`,

  metrics: `Institutional data on agent rails.

4 agent tools. MCP host mcp.blocksize.info. 402 agent checkout.

No Blocksize account form. Search free, then pay per quote or pre-trade check.

syraa.fun/chat`,

  featured: `Ask Syra for SOLUSD VWAP.

VWAP is the institutional reference. Blocksize answers. The agent wallet pays. Reference prices land in chat.

syraa.fun/partner/blocksize`,

  comparison: `Scraped mid vs Blocksize tape.

Before, scrape a mid and hope the book holds under size. Now VWAP, bid/ask, and pre-trade checks run inside Syra agents via x402.

syraa.fun/chat`,

  launch: `Syra x Blocksize is live.

Institutional VWAP, bid/ask, and pre-trade checks for autonomous treasuries.

syraa.fun/partner/blocksize`,

  deepDive: `mcp.blocksize.info plumbing.

GET /v1/search is free discovery. GET /v1/vwap/{pair} is paid VWAP. GET /v1/bidask/{pair} is the paid book. POST /v1/checks/pre-trade is the guard. Requests carry X-AGENT-ID and settle through agent x402.

mcp.blocksize.info`,

  split: `Reference price, then execute.

Pull Blocksize VWAP, guard with pre-trade, then route into Syra swap or invest tools. Quote from vwap or bidask. Guard from pre-trade. Ops on agent wallet credits.

syraa.fun/chat`,

  terminal: `Blocksize from agent tools.

tool blocksize-search q=SOLUSD returns pairs and services. tool blocksize-vwap pair=SOLUSD returns 402 Payment Required. The agent wallet settles USDC and the VWAP snapshot unlocks.

syraa.fun/chat`,

  cta: `Ask Syra for a Blocksize VWAP.

Search SOLUSD, pull VWAP, then bid/ask, all from agent chat.

syraa.fun/chat
syraa.fun/partner/blocksize
mcp.blocksize.info`,
};
