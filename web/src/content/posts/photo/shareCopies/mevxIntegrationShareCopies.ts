import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for MevX trading data photo deck. */
export const MEVX_INTEGRATION_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `SHIP LOG · Syra × MevX is live.

Trading terminal data inside Syra agents.
mevx-trades · mevx-token · mevx-pools

Solana DEX tape without leaving chat.

Try → syraa.fun/chat`,

  thesis: `Agents trade on tape, not vibes.

MevX brings recent DEX trades, token snapshots, and pool markets into Syra agent tools — Solana-first, partner-keyed, wallet-billed.

X → x.com/MEVX_Official`,

  quote: `"Terminal data. Agent delivery."

Three tools. One partner key. Live market structure mid-conversation.

Syra × MevX.

Try → syraa.fun/chat`,

  flow: `MevX on Syra, 4 steps:

1. Ask the agent for trades / token / pools
2. Router picks mevx-trades | mevx-token | mevx-pools
3. Syra calls api.mevx.io
4. Structured market data returns in chat

Test → syraa.fun/chat`,

  timeline: `MevX integration shipped:

→ mevxClient + MEVX_API_KEY
→ agentDirect tools: trades, token, pools
→ Param gates + Spend pillar routes
→ Partner page at /partner/mevx

Key from landing-api.mevx.io`,

  pillars: `3 MevX surfaces for agents:

→ mevx-trades — DEX tape by pool or wallet
→ mevx-token — mint / address market lookup
→ mevx-pools — pool liquidity markets

Partner billed. Agent delivered.

Try → syraa.fun/chat`,

  checklist: `Live today:

→ mevx-trades / mevx-token / mevx-pools registered
→ POST /agent/tools/call ready
→ Spend pillar + MCP catalog
→ Partner card: syraa.fun/partner/mevx
→ Set MEVX_API_KEY in API .env

Try → syraa.fun/chat`,

  metrics: `3 tools. Solana DEX focus. 1 partner key.

Syra agents pull MevX trading data on demand — no terminal tab-switching for operators.

Try → syraa.fun/chat`,

  featured: `MevX tape inside Syra chat.

Recent trades. Token snapshots. Pool markets.
Ask once. Trade-ready context.

syraa.fun/partner/mevx`,

  comparison: `Before: leave chat, open a terminal, paste addresses.

Now: mevx-* tools in the Syra agent.
Same wallet. Same conversation. Live DEX data.

Try → syraa.fun/chat`,

  launch: `SHIP LOG · Syra × MevX is live.

Trading data agent tools for Solana DEX workflows.
X → x.com/MEVX_Official

Try → syraa.fun/chat`,

  deepDive: `MevX technical surface:

→ api.mevx.io via MEVX_API_KEY
→ agentPartnerDirectTools: mevx-*
→ Paths: /mevx/trades · /mevx/token · /mevx/pools
→ Pillar: spend

Docs → landing-api.mevx.io`,

  split: `One agent. Terminal-grade inputs.

→ Research: mevx-token + mevx-pools
→ Tape: mevx-trades
→ Action: pair with swap / analyzer tools

Machine money meets market structure.

Try → syraa.fun/chat`,

  terminal: `MevX from the agent tool API:

$ POST /agent/tools/call
{ "tool": "mevx-token", "params": { "address": "<mint>" } }
→ MevX market snapshot
→ agent reply with structured fields

Try → syraa.fun/chat`,

  cta: `Syra × MevX. Trading data for agents.

→ syraa.fun/chat
→ syraa.fun/partner/mevx
→ mevx.io
→ x.com/MEVX_Official`,
};
