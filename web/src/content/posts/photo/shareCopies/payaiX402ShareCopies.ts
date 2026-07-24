import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for PayAI all-networks photo deck: 15 distinct topics. */
export const PAYAI_X402_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `This cover announces Syra's move to PayAI as its x402 facilitator across every network PayAI supports.

The card lists eight production mainnets: Solana, Base, Polygon, Arbitrum, Avalanche, Sei, SKALE, and X Layer. Verify and settle now runs through facilitator.payai.network, and any wallet with USDC on one of those chains can pay Syra directly.

syraa.fun/playground`,

  thesis: `This card states the reason for the PayAI migration in one line: Syra now uses every PayAI network.

Playground, Syra agents, and external x402 clients all settle through the same facilitator, facilitator.payai.network, each paying on the chain where their USDC already sits. That closes the single-chain gap Syra had before this update.

syraa.fun/playground`,

  quote: `The line on this card sums up the PayAI update: every chain PayAI supports becomes one Syra checkout.

Sixteen networks are wired for development, eight of them live in production. All of them run the same x402 v2 middleware and settle through the same facilitator, so a treasury can pay wherever it already holds USDC.

syraa.fun/playground`,

  flow: `This image walks through how a payment moves from request to unlocked data on PayAI.

1. Call any paid Syra API from the playground, an agent, or an external x402 client
2. Receive a 402 response listing every enabled PayAI network
3. Sign a USDC payment on Solana or a supported EVM chain
4. PayAI verifies and settles on-chain, and the payload unlocks

syraa.fun/playground`,

  timeline: `This timeline covers the migration from the old facilitator to full PayAI coverage.

1. Facilitator switch: default verify and settle now runs through facilitator.payai.network
2. Network table: all 16 PayAI CAIP-2 network IDs added to Syra's config
3. USDC alignment: asset addresses matched to what PayAI expects at settlement
4. Agents unchanged: agent-to-agent x402 on Solana kept working through the switch

syraa.fun/playground`,

  pillars: `This bento layout shows the eight production mainnets Syra now settles on through PayAI.

Solana runs the SVM exact scheme with mainnet USDC for agent auto-pay and the playground. Base and Polygon cover core EVM checkout on eip155:8453 and eip155:137. Arbitrum and Avalanche extend that to eip155:42161 and eip155:43114, and Sei, SKALE, and X Layer round out the extended EVM set.

syraa.fun/playground`,

  checklist: `This checklist is what shipped with the PayAI migration.

1. PayAI facilitator is now the default for verify and settle on every paid Syra API
2. All 16 PayAI networks appear in 402 accepts, with 8 live in production
3. Multi-network checkout covers both Solana and EVM USDC
4. Agent-to-agent and external x402 clients both settle the same way
5. The BSC B402 lane keeps running alongside PayAI

syraa.fun/playground`,

  metrics: `The numbers on this card describe how far PayAI coverage now reaches.

Syra advertises 16 PayAI networks, with 8 already live in production: Solana, Base, Polygon, Arbitrum, Avalanche, Sei, SKALE, and X Layer. Checkout stays HTTP-native through the 402 status code on every one of them.

syraa.fun/playground`,

  featured: `This featured card highlights that Syra no longer depends on a single chain or a single facilitator.

Every network PayAI documents is enabled on Syra's intelligence APIs, so a caller pays on whatever chain already holds their USDC instead of bridging to match Syra's old setup.

syraa.fun/playground`,

  comparison: `This before-and-after card compares Syra's old facilitator setup with the new PayAI stack.

Before, Syra ran on Corbits with a partial network list and a facilitator that was heading toward shutdown. Now PayAI is the default, all 16 documented networks are wired in, and production auth and settlement are handled through facilitator.payai.network.

syraa.fun/playground`,

  launch: `This partnership card marks the Syra and PayAI integration as live.

Every PayAI-supported x402 network is enabled on Syra's intelligence APIs, from Solana to X Layer, and all of it verifies and settles through facilitator.payai.network.

syraa.fun/playground
docs.payai.network`,

  deepDive: `This deep-dive card lists the technical surface behind the PayAI migration.

payaiX402Networks mirrors PayAI's own supported-networks documentation, and the resource server builds 402 offers per profile. PayAI JWT auth covers settlement volume beyond the free tier, Jupiter's Ultra and trending endpoints are called directly instead of through a proxy, and the BSC B402 lane still serves BNB-native treasuries alongside PayAI.

docs.payai.network`,

  split: `This split card explains where PayAI shows up across Syra's payment surface.

Solana handles agent wallet auto-pay, the playground, and external agent callers. The EVM side spans Base, Polygon, Arbitrum, Avalanche, Sei, SKALE, and X Layer. BSC keeps its own B402 lane on eip155:56 for BNB-native treasuries that pay outside PayAI.

syraa.fun/playground`,

  terminal: `This terminal card shows a multi-network 402 response in a real request.

A health check returns a 402 with Payment Required and lists Solana, Base, Polygon, and Arbitrum among the accepted networks. Paying on Solana signs USDC, and the retry comes back 200 OK with PayAI confirming settlement.

syraa.fun/playground`,

  cta: `This closing card is the ship summary: every PayAI network, one Syra checkout.

Hit a paid endpoint, pay on whichever chain you already use, and the intelligence unlocks.

syraa.fun/playground
docs.payai.network
docs.syraa.fun`,
};
