import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for MevX trading data photo deck. */
export const MEVX_INTEGRATION_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `This cover announces MevX trading data landing inside Syra agents.

Three new tools, mevx-trades, mevx-token, and mevx-pools, bring Solana DEX trade history, token snapshots, and pool markets straight into agent chat.

syraa.fun/chat`,

  thesis: `This card names the shift MevX enables.

Agents can now trade on tape instead of vibes. MevX supplies recent DEX trades, token snapshots, and pool markets through Syra's agent tools, keyed to a single partner API key and delivered right inside the conversation.

syraa.fun/chat`,

  quote: `The line on this card is the pitch in plain words: terminal data, agent delivery.

Three tools sit behind one partner key, putting live market structure into the middle of a chat instead of a separate browser tab.

syraa.fun/chat`,

  flow: `This image walks the tool call in four steps.

1. Ask the agent for trades, token stats, or pool context
2. The router picks mevx-trades, mevx-token, or mevx-pools
3. Syra calls api.mevx.io with the partner key
4. A structured, trade-ready reply comes back in chat

syraa.fun/chat`,

  timeline: `This timeline shows how the MevX integration shipped.

1. A mevxClient was added, authenticated with MEVX_API_KEY
2. Three tools, mevx-trades, mevx-token, and mevx-pools, were registered
3. Parameter gates and the Spend pillar were wired around the calls
4. A partner page went live at /partner/mevx

syraa.fun/chat`,

  pillars: `This bento layout breaks down the three MevX tools plus the key that runs them.

Trades pulls recent DEX history by pool or wallet. Token returns a market snapshot for a mint or address before sizing a trade. Pools shows where liquidity actually sits. Key is a single MEVX_API_KEY that covers all three, billed through the agent's own wallet.

syraa.fun/chat`,

  checklist: `This checklist is what shipped with the MevX integration.

1. mevx-trades, mevx-token, and mevx-pools are all registered tools
2. They work through the existing POST /agent/tools/call endpoint
3. Calls run through the Spend pillar and are listed in the MCP catalog
4. A partner page is live at /partner/mevx
5. MEVX_API_KEY needs to be set, sourced from landing-api.mevx.io

syraa.fun/chat`,

  metrics: `The numbers on this card describe the integration.

Three agent tools are live, focused on Solana DEX data, all authenticated through one shared partner key. Agents can pull this data on demand without switching to a separate terminal.

syraa.fun/chat`,

  featured: `This featured card is about what MevX puts inside Syra chat.

Recent trades, token snapshots, and pool markets, all reachable by asking once.

syraa.fun/partner/mevx`,

  comparison: `This before-and-after card compares checking a terminal to calling a tool.

Before, getting this data meant leaving chat, opening a separate terminal, and pasting addresses by hand. Now, the mevx-* tools answer inside the same conversation, using the same wallet, with live DEX data.

syraa.fun/chat`,

  launch: `This launch card marks MevX trading data going live inside Syra.

Three tools cover trades, tokens, and pools for Solana DEX workflows, paid for through the existing Syra wallet path.

syraa.fun/partner/mevx`,

  deepDive: `This deep-dive card lists the technical surface behind the integration.

mevxClient calls out to api.mevx.io using MEVX_API_KEY, sourced from landing-api.mevx.io. The three tools are registered as agentDirect tools, routed through the Spend pillar at /mevx/* paths, alongside a partner marketing card.

syraa.fun/partner/mevx`,

  split: `This split card explains how MevX pairs with the rest of Syra.

mevx-token and mevx-pools cover research on a token or a pool. mevx-trades covers the tape itself. From there, the same conversation can move into a swap or an analyzer call to act on what was found.

syraa.fun/chat`,

  terminal: `This terminal card shows a real tool call in the request path.

A call to POST /agent/tools/call with the mevx-token tool and a mint address returns a MevX market snapshot, which the agent turns into a structured reply. The mevx-trades tool works the same way for a given pool's recent tape.

syraa.fun/chat`,

  cta: `This closing card is the ship summary: ask Syra for MevX data directly.

Fund the agent wallet, set MEVX_API_KEY, and call mevx-trades or mevx-token from chat.

syraa.fun/chat
syraa.fun/partner/mevx
mevx.io`,
};
