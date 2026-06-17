import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for PayAI all-networks photo deck — 15 distinct topics. */
export const PAYAI_X402_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Syra now settles x402 on every PayAI-supported network.

Solana. Base. Polygon. Arbitrum. Avalanche. Sei. SKALE. X Layer. Plus testnets.

PayAI verify + settle. One intelligence stack. Pay on the chain you already use.

→ syraa.fun/playground`,

  thesis: `Agents should not be stuck on one chain or one facilitator.

Syra migrated to PayAI and enabled all 16 networks from their docs. Your treasury pays where it already holds USDC.

Playground, Syra agents, and external x402 clients share the same rails.`,

  quote: `"List every chain PayAI supports. Let treasuries pay natively."

16 networks in dev. 8 mainnets in production. Same x402 v2 surface. Same Syra brain.

402 for price. PayAI for settlement. Intelligence on delivery.`,

  flow: `PayAI x402 on Syra — 4 steps:

1. Call any paid Syra API
2. Receive 402 with every enabled PayAI network
3. Sign USDC on your chain
4. PayAI verifies and settles — payload unlocked

Agents and external callers. Same checkout.`,

  timeline: `PayAI migration — what changed:

→ Default facilitator: facilitator.payai.network
→ All PayAI CAIP-2 networks in 402 accepts
→ USDC assets aligned with PayAI settlement
→ Agent-to-agent x402 unchanged on Solana

BSC B402 still live for BNB treasuries.`,

  pillars: `8 mainnets live in production:

→ Solana
→ Base
→ Polygon
→ Arbitrum One
→ Avalanche
→ Sei
→ SKALE Base
→ X Layer

Plus 8 PayAI testnets in non-production environments.`,

  checklist: `Live today on Syra:

→ PayAI facilitator on all paid API verify/settle
→ 16 PayAI networks advertised in 402 responses
→ Multi-network EVM + Solana USDC checkout
→ Agent wallet and playground on the same stack
→ External x402 agents can pay on any offered chain

Test → syraa.fun/playground`,

  metrics: `16 PayAI networks. 8 mainnets. One facilitator.

Syra intelligence APIs settle through PayAI on Solana, Base, Polygon, Arbitrum, Avalanche, Sei, SKALE, and X Layer.

Multi-chain treasuries deserve multi-chain checkout.`,

  featured: `402 — pay per call across every PayAI network.

No single-chain lock-in. No facilitator sunset risk. Hit an endpoint, pick your network, unlock intelligence.

Syra now uses all of PayAI.`,

  comparison: `Before: Corbits facilitator, partial network list, shutdown risk.

Now: PayAI default, all 16 documented networks, production-ready auth and settlement.

Same agent brain. Fuller chain coverage. Future-proof facilitator.`,

  launch: `SHIP LOG · Syra × PayAI is live.

Every PayAI-supported x402 network is enabled on Syra intelligence APIs.

Solana to X Layer. Verify and settle through facilitator.payai.network.

Try now → syraa.fun/playground`,

  deepDive: `PayAI integration — technical surface:

→ payaiX402Networks config mirrors PayAI docs
→ Multi-network 402 accepts on every paid route
→ PayAI JWT auth for production settlement volume
→ Jupiter direct APIs (no Corbits proxy dependency)
→ B402 BSC lane unchanged alongside PayAI`,

  split: `One stack. Every PayAI network.

SOLANA
Agent auto-pay, playground, external agents.

EVM MAINNETS
Base, Polygon, Arbitrum, Avalanche, Sei, SKALE, X Layer.

BNB
B402 on eip155:56 for BSC-native treasuries.

→ syraa.fun/playground`,

  terminal: `PayAI x402 from the terminal:

$ curl api.syraa.fun/health
< HTTP/402 Payment Required
< Payment-Required: solana, base, polygon, arbitrum…
$ syra-x402 pay --network solana
> signing USDC on Solana…
< HTTP/200 OK · PayAI settled · healthy`,

  cta: `Every PayAI network. One Syra checkout.

→ Playground: syraa.fun/playground
→ PayAI networks: docs.payai.network
→ API docs: docs.syraa.fun

Hit a paid endpoint. Pay on your chain. Unlock intelligence.`,
};
