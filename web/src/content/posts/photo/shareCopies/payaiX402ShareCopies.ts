import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for PayAI all-networks photo deck: 15 distinct topics. */
export const PAYAI_X402_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `PayAI x Syra is live on every PayAI-supported x402 network.

Pay on Solana, Base, Polygon, Arbitrum, Avalanche, Sei, SKALE, or X Layer. x402 means you pay only when you call. Settle (the payment actually completes) through facilitator.payai.network.

syraa.fun/playground`,

  thesis: `Syra now uses all PayAI networks.

We migrated our x402 facilitator to PayAI and enabled every network in their supported stack. Agents, playground, and external callers settle through facilitator.payai.network on the chain (the network that holds the money) that matches their USDC (digital dollars).

syraa.fun/playground`,

  quote: `Every chain PayAI supports becomes one Syra checkout.

16 networks in dev. Eight mainnets in production. Same x402 v2 middleware. Pay where your treasury already lives.

syraa.fun/playground`,

  flow: `402, then PayAI, then intelligence.

1. Call a paid API from playground, an agent, or an external x402 client
2. Payment Required lists every enabled PayAI network
3. Sign USDC on Solana or any supported EVM chain
4. PayAI verifies and settles on-chain. Payload unlocked.

syraa.fun/playground`,

  timeline: `Corbits is out. PayAI is in, with full network coverage.

1. Default verify and settle via facilitator.payai.network
2. All 16 PayAI CAIP-2 IDs in Syra config
3. USDC assets matched to PayAI settlement expectations
4. Agent-to-agent x402 still works on Solana rails

syraa.fun/playground`,

  pillars: `Production mainnets on PayAI.

Solana is SVM exact with mainnet USDC for agent auto-pay and playground. Base and Polygon are core EVM (eip155:8453 and eip155:137 native USDC). Arbitrum and Avalanche are eip155:42161 and eip155:43114. Sei, SKALE, and X Layer extend EVM (eip155:1329, 1187947933, and 196).

syraa.fun/playground`,

  checklist: `What ships with this update.

1. PayAI facilitator is the default on all paid Syra APIs
2. 16 PayAI networks in 402 accepts (8 mainnets in prod)
3. Multi-network Solana plus EVM USDC checkout
4. Agent-to-agent and external x402 clients supported
5. BSC B402 lane still live alongside PayAI

syraa.fun/playground`,

  metrics: `Full PayAI coverage.

16 PayAI networks. 8 mainnets live. HTTP 402 checkout.

From Solana to X Layer, Syra advertises every network PayAI documents and settles through their facilitator.

syraa.fun/playground`,

  featured: `All PayAI networks sit behind one Syra brain.

16 networks enabled. No single-chain lock-in and no facilitator sunset. Pay on the network where your USDC already sits.

syraa.fun/playground`,

  comparison: `Partial coverage vs the full PayAI stack.

Before, Corbits was the facilitator, the network list was limited, and shutdown was approaching. Now PayAI is the default, all documented networks are wired, and production auth plus settlement run through facilitator.payai.network.

syraa.fun/playground`,

  launch: `Syra x PayAI is live.

Intelligence APIs settle on every PayAI network, pay per call, and verify through facilitator.payai.network.

syraa.fun/playground
docs.payai.network`,

  deepDive: `PayAI-native x402 v2.

payaiX402Networks mirrors PayAI supported-networks docs. The resource server and 402 offer builders are profile-aware. PayAI JWT auth covers settlement beyond the free tier. Jupiter Ultra and trending run on direct APIs. B402 BSC remains for BNB-native treasuries.

docs.payai.network`,

  split: `PayAI everywhere Syra charges.

Playground, agent chat tools, brain API, and external agent callers hit the same PayAI-backed payment middleware. Solana is agent wallet auto-pay. EVM covers Base, Polygon, Arbitrum, Avalanche, Sei, SKALE, and X Layer. BSC B402 sits alongside PayAI. External agents can pick any offered network.

syraa.fun/playground`,

  terminal: `Multi-network 402 in the wild.

curl api.syraa.fun/health returns HTTP 402 Payment Required with accepts covering solana, base, polygon, arbitrum, avalanche, and more. syra-x402 pay --network base signs USDC on Base. The retry is HTTP 200 with PayAI settled.

syraa.fun/playground`,

  cta: `Every PayAI network, one Syra brain.

Hit a paid endpoint, pay on your chain, and unlock intelligence. Playground for a first call. PayAI for supported networks. Docs for the x402 API reference.

syraa.fun/playground
docs.payai.network
docs.syraa.fun`,
};
