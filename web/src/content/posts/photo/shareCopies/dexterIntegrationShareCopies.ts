import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Dexter onchain x402 photo deck. */
export const DEXTER_INTEGRATION_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Dexter x Syra now sells onchain context, not only Labs settlement.

Beyond the Labs facilitator, agents call Dexter activity and entity APIs over Solana x402 (pay only when you call). Catalog is free. Paid tools return trade summaries and wallet or token intelligence.

syraa.fun/chat`,

  thesis: `Settlement without context is half a stack.

Syra already settles Labs via Dexter. Agents now buy onchain activity and entity summaries from x402.dexter.cash with Solana USDC (digital dollars).

syraa.fun/chat`,

  quote: `Pay for the settle, and pay for the signal.

Settle means the payment actually completes. Same Dexter partner, two Syra surfaces: Labs facilitator, and agent spend tools when you need onchain context.

syraa.fun/chat`,

  flow: `402 on Dexter. Pay from Syra.

1. Pick a tool: free catalog, or paid activity and entity
2. Probe x402.dexter.cash and get Payment Required
3. Agent pays Solana USDC from the Syra wallet
4. Onchain payload returns volumes, counterparties, and deltas

syraa.fun/chat`,

  timeline: `Facilitator first, then spend tools.

1. Labs settle path already live
2. agentDexterClient plus an x402 helper added
3. Free well-known catalog for discovery
4. Paid activity and entity tools at about $0.05

syraa.fun/chat`,

  pillars: `Two layers on one Dexter partner.

Facilitator keeps existing Labs settle rails unchanged. Activity sells trade summaries and counterparties. Entity sells token, wallet, and trade insight. Catalog is free /.well-known/x402 discovery before anyone pays.

syraa.fun/chat`,

  checklist: `What ships with this update.

1. dexter-x402-catalog free discovery
2. Paid activity and entity agent tools
3. Agent wallet Solana USDC checkout
4. Labs facilitator path unchanged
5. Partner page at syraa.fun/partner/dexter

syraa.fun/partner/dexter`,

  metrics: `Infrastructure plus intelligence.

3 agent tools. $0.05 for activity or entity. Solana 402 checkout.

Dexter settles Labs and sells onchain context to Syra agents per call.

syraa.fun/chat`,

  featured: `x402.dexter.cash inside Syra agents.

2 paid onchain tools. Browse the catalog free. Pay for activity and entity when you need the tape.

syraa.fun/partner/dexter`,

  comparison: `Facilitator-only vs the full Dexter stack.

Before, Dexter on Syra meant Labs facilitator settle, with no agent spend tools. Now the facilitator stays, and agents also buy activity and entity over x402. Solana context per call, not scraped by hand.

syraa.fun/chat`,

  launch: `Syra x Dexter is live for onchain x402.

Facilitator settle plus paid onchain activity and entity intelligence for agents, both on Solana USDC.

syraa.fun/partner/dexter`,

  deepDive: `Dexter x402 plumbing.

Base URL is x402.dexter.cash. Free catalog is /.well-known/x402. Paid routes are /onchain/activity and /onchain/entity. callExternalX402WithAgent handles the settle path. Dexter on X is dexteraisol.

dexter.cash`,

  split: `Dexter does two jobs on Syra.

Labs keeps the facilitator. Agents buy onchain intel. Machine money on both rails: facilitator settle, activity plus entity tools, free catalog discovery, Solana USDC checkout.

syraa.fun/chat`,

  terminal: `Dexter from agent tools.

tool dexter-x402-catalog returns resources including activity and entity. tool dexter-onchain-activity with scope=token and a mint triggers 402, the agent pays Solana USDC, and the trade summary unlocks.

syraa.fun/chat`,

  cta: `Call Dexter from a Syra agent.

Start with the free catalog, then pay for activity or entity on a mint or wallet.

syraa.fun/chat
syraa.fun/partner/dexter
dexter.cash`,
};
