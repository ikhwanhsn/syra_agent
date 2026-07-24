import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Blocksize market data photo deck. */
export const BLOCKSIZE_INTEGRATION_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `This cover announces Blocksize live on Syra for institutional market data.

Agents can now pull VWAP and bid/ask quotes from mcp.blocksize.info, settling with x402 or credits instead of opening a Blocksize account.

syraa.fun/chat`,

  thesis: `This card names the pricing problem Blocksize solves for autonomous agents.

Retail mids lie under thin order books. Blocksize aggregates institutional crypto VWAP and bid/ask data so a Syra agent can quote a real reference price before it moves size.

syraa.fun/chat`,

  quote: `The line on this card sums up what Blocksize adds to Syra.

Search is free. VWAP and bid/ask are paid. A pre-trade check can run before an agent sizes a ticket, so the guard happens before the trade, not after.

syraa.fun/chat`,

  flow: `This image walks the Blocksize call path in four steps.

1. Search a pair, for example blocksize-search q=SOLUSD
2. Quote VWAP or bid/ask, the agent pays through a 402
3. Optionally run a pre-trade check
4. Feed the result into Syra's swap or invest logic

syraa.fun/chat`,

  timeline: `This timeline shows how the Blocksize MCP integration was wired end to end.

1. agentBlocksizeClient added with an X-AGENT-ID header
2. x402 settlement from the agent's Solana USDC balance
3. search, vwap, bidask, and pre-trade tools registered
4. Surfaced on the Spend pillar and a dedicated partner page

syraa.fun/chat`,

  pillars: `This bento layout shows the four Blocksize tools available to agents.

Search is free and finds pairs before an agent spends anything. VWAP returns institutional VWAP snapshots. Bid/Ask returns spread-aware quotes. Pre-trade, at roughly $0.10, checks freshness and drift before a trade goes out.

syraa.fun/chat`,

  checklist: `This checklist is what shipped with the Blocksize integration.

1. blocksize-* agent tools registered
2. Free search before paid quotes
3. Agent Solana USDC or credits checkout
4. Partner page at syraa.fun/partner/blocksize
5. Host: mcp.blocksize.info

syraa.fun/partner/blocksize`,

  metrics: `The numbers on this card describe the Blocksize agent stack.

Four tools run on the MCP host mcp.blocksize.info, and checkout uses the same 402 flow as the rest of Syra. There is no Blocksize account form: search stays free, and an agent only pays per quote or pre-trade check.

syraa.fun/chat`,

  featured: `This featured card shows an agent asking for a SOLUSD VWAP.

Blocksize answers the query, the agent wallet pays for it, and the reference price shows up directly in chat instead of a separate terminal.

syraa.fun/partner/blocksize`,

  comparison: `This before-and-after card compares a scraped mid against the Blocksize tape.

Before, an agent had to scrape a mid price and hope the book held under size. Now it can pull VWAP, bid/ask, and a pre-trade check from Blocksize through x402, all inside the same chat.

syraa.fun/chat`,

  launch: `This partnership card marks Syra x Blocksize as live for institutional market data.

VWAP, bid/ask, and pre-trade checks are now available to autonomous treasuries running through Syra agents.

syraa.fun/partner/blocksize`,

  deepDive: `This deep-dive card lists the technical surface behind the Blocksize integration.

GET /v1/search is free discovery. GET /v1/vwap/{pair} and GET /v1/bidask/{pair} are paid. POST /v1/checks/pre-trade runs the guard. Requests carry an X-AGENT-ID header and settle through agent x402.

mcp.blocksize.info`,

  split: `This split card explains how a Blocksize quote turns into an action.

Quote comes from blocksize-vwap or blocksize-bidask. Guard comes from blocksize-pre-trade. Act routes the result into Syra's swap or invest tools, with the agent wallet paying in credits along the way.

syraa.fun/chat`,

  terminal: `This terminal card shows Blocksize called from agent tools.

Calling blocksize-search q=SOLUSD returns pairs and services. Calling blocksize-vwap pair=SOLUSD triggers a 402, the agent wallet settles in USDC, and the VWAP snapshot unlocks.

syraa.fun/chat`,

  cta: `This closing card is the ship summary: ask Syra for a Blocksize VWAP straight from chat.

Search SOLUSD, pull the VWAP, then check bid/ask, all without leaving the conversation.

syraa.fun/chat
syraa.fun/partner/blocksize
mcp.blocksize.info`,
};
