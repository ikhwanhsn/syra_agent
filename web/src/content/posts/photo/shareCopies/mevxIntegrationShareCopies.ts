import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for MevX trading data photo deck. Proof-first, no meta card talk. */
export const MEVX_INTEGRATION_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `MevX trading data now sits inside Syra agents.

Three tools, mevx-trades, mevx-token, and mevx-pools, bring Solana DEX trade history, token snapshots, and pool markets into agent chat. Terminal data, delivered in conversation.

syraa.fun/chat`,

  thesis: `Agents can trade on tape instead of vibes.

MevX supplies recent DEX trades (the public record of swaps), token snapshots, and pool markets through Syra agent tools. Solana-first, keyed to a single partner API key, delivered in chat.

syraa.fun/chat`,

  quote: `Terminal data, delivered by the agent.

Three tools sit behind one partner key. Live market structure shows up mid-conversation instead of in a separate browser tab.

syraa.fun/chat`,

  flow: `Chat to MevX to a trade-ready answer.

1. Ask the agent for trades, token stats, or pool context
2. The router picks mevx-trades, mevx-token, or mevx-pools
3. Syra calls api.mevx.io with the partner key
4. A structured reply comes back in chat

syraa.fun/chat`,

  timeline: `MevX shipped end to end.

1. A mevxClient was added, authenticated with MEVX_API_KEY
2. Three tools, mevx-trades, mevx-token, and mevx-pools, were registered
3. Parameter gates and the Spend pillar were wired around the calls
4. A partner page went live at /partner/mevx

syraa.fun/chat`,

  pillars: `Three MevX tools, plus the key that runs them.

Trades pulls recent DEX history by pool or wallet. Token returns a market snapshot for a mint or address before you size a trade. Pools shows where liquidity actually sits. One MEVX_API_KEY covers all three, billed through the agent's own wallet.

syraa.fun/chat`,

  checklist: `What shipped with the MevX integration.

1. mevx-trades, mevx-token, and mevx-pools are registered tools
2. They work through the existing POST /agent/tools/call endpoint
3. Calls run through the Spend pillar and are listed in the MCP catalog
4. A partner page is live at /partner/mevx
5. MEVX_API_KEY needs to be set, sourced from landing-api.mevx.io

syraa.fun/chat`,

  metrics: `Terminal data without leaving chat.

3 agent tools. Solana DEX focus. 1 partner key.

Agents pull this data on demand. No separate terminal tab.

syraa.fun/chat`,

  featured: `MevX tape now lives inside Syra chat.

Recent trades, token snapshots, and pool markets. Three live tools. Ask once.

syraa.fun/partner/mevx`,

  comparison: `Checking a terminal used to mean leaving the conversation.

Before, you left chat, opened a separate terminal, and pasted addresses by hand. Now the mevx-* tools answer in the same conversation, with the same wallet, and live DEX data.

syraa.fun/chat`,

  launch: `Syra and MevX are live together.

Three tools cover trades, tokens, and pools for Solana DEX workflows. Paid through the existing Syra wallet path.

syraa.fun/partner/mevx`,

  deepDive: `The partner rail is a thin client plus three agent tools.

mevxClient calls api.mevx.io using MEVX_API_KEY from landing-api.mevx.io. The tools are registered as agentDirect: mevx-trades, mevx-token, and mevx-pools. Spend pillar routes sit at /mevx/*. There is a partner marketing page, and MevX on X is MEVX_Official.

syraa.fun/partner/mevx`,

  split: `Tape in, then trade out in the same loop.

mevx-token and mevx-pools cover research on a token or a pool. mevx-trades covers the tape itself. From there, the same conversation can move into a swap or an analyzer call. Ops stay one partner key.

syraa.fun/chat`,

  terminal: `A real tool call against MevX.

POST /agent/tools/call with tool mevx-token and a mint address returns a MevX market snapshot, which the agent turns into a structured reply. mevx-trades works the same way for a given pool's recent tape.

syraa.fun/chat`,

  cta: `Ask Syra for MevX data directly.

Fund the agent wallet, set MEVX_API_KEY, and call mevx-trades or mevx-token from chat.

syraa.fun/chat
syraa.fun/partner/mevx
mevx.io`,
};
