import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Blocksize market data photo deck. */
export const BLOCKSIZE_INTEGRATION_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `SHIP LOG · Syra × Blocksize is live.

Institutional VWAP + bid/ask for AI agents.
mcp.blocksize.info · x402 / credits

blocksize-search · vwap · bidask · pre-trade

Try → syraa.fun/chat`,

  thesis: `Autonomous size needs a reference price.

Retail mids lie under thin books. Blocksize aggregates institutional crypto VWAP and bid/ask so Syra agents can quote before they move.

X → x.com/blocksizecap`,

  quote: `"Oracle-grade tape. Agent checkout."

Search free. Pay for VWAP and bid/ask.
Pre-trade guards before you size the ticket.

Try → syraa.fun/chat`,

  flow: `Blocksize on Syra, 4 steps:

1. blocksize-search q=SOLUSD
2. Pull VWAP or bid/ask (402)
3. Optional pre-trade check
4. Feed the quote into swap / invest logic

Test → syraa.fun/chat`,

  timeline: `Blocksize integration shipped:

→ agentBlocksizeClient → mcp.blocksize.info
→ X-AGENT-ID + x402 settle
→ search · vwap · bidask · pre-trade tools
→ Spend pillar + /partner/blocksize`,

  pillars: `4 Blocksize tools:

→ search — free instrument discovery
→ vwap — institutional VWAP snapshots
→ bidask — bid/ask + spread
→ pre-trade — freshness / spread guards (~$0.10)

Try → syraa.fun/chat`,

  checklist: `Live today:

→ blocksize-* agent tools registered
→ Free search before paid quotes
→ Agent Solana USDC / credits checkout
→ Partner page: syraa.fun/partner/blocksize
→ Host: mcp.blocksize.info

Try → syraa.fun/chat`,

  metrics: `4 tools. MCP host. 402 agent checkout.

Institutional market data without opening a Blocksize account form.

Try → syraa.fun/chat`,

  featured: `Ask Syra for SOLUSD VWAP.

Blocksize answers. Agent wallet pays.
Institutional reference prices in chat.

syraa.fun/partner/blocksize`,

  comparison: `Before: scrape a mid and hope.

Now: Blocksize VWAP + bid/ask + pre-trade checks
inside Syra agents via x402.

Try → syraa.fun/chat`,

  launch: `SHIP LOG · Syra × Blocksize market data is live.

VWAP. Bid/ask. Pre-trade.
X → x.com/blocksizecap

Try → syraa.fun/chat`,

  deepDive: `Blocksize technical surface:

→ Base: mcp.blocksize.info
→ GET /v1/search · /v1/vwap/{pair} · /v1/bidask/{pair}
→ POST /v1/checks/pre-trade
→ Header: X-AGENT-ID · x402 / credits

Docs → mcp.blocksize.info`,

  split: `Reference price → action.

→ Quote: blocksize-vwap / bidask
→ Guard: blocksize-pre-trade
→ Act: Syra swap / invest tools

Treasuries deserve institutional tape.

Try → syraa.fun/chat`,

  terminal: `Blocksize from agents:

$ tool blocksize-search q=SOLUSD
→ pairs + services
$ tool blocksize-vwap pair=SOLUSD
→ 402 → pay → VWAP snapshot

Try → syraa.fun/chat`,

  cta: `Syra × Blocksize. Institutional data for agents.

→ syraa.fun/chat
→ syraa.fun/partner/blocksize
→ mcp.blocksize.info
→ x.com/blocksizecap`,
};
