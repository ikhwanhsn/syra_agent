import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Algorand x402 photo deck: 15 distinct topics. */
export const ALGORAND_X402_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `SHIP LOG · Algorand treasuries should stay on Algorand.

x402 intelligence APIs now settle USDC on Algorand Mainnet via GoPlausible. Pay-per-call. No bridge. No subscription.

402 → sign ASA transfer → unlock data.

Try it → syraa.fun/playground`,

  thesis: `Algorand builders should not bridge just to pay for intelligence.

Syra agents already settle on Solana, PayAI EVM chains, and BSC. Algorand needed native x402: USDC ASA, GoPlausible verify/settle, fee payer included.

Now it ships.

Try it → syraa.fun/playground`,

  quote: `"List once on x402. Settle where your treasury lives, including Algorand."

Solana · PayAI EVM · BSC B402 · Algorand Mainnet. One Syra checkout.

Try it → syraa.fun/playground`,

  flow: `x402 on Algorand, 4 steps:

1. Call paid Syra API
2. 402 with algorand:* accept + USDC ASA 31566704
3. Sign ASA transfer (GoPlausible fee payer covers ALGO)
4. Verify → settle → 200 with payload

Test → syraa.fun/playground`,

  timeline: `Algorand x402 rollout:

→ @x402-avm resource server + GoPlausible facilitator
→ Algorand accept appended to every 402 response
→ Agent AVM client with mainnet Algod fix
→ E2E: 402 → pay → verify → settle → 200 on /news

Mainnet validated.

Try it → syraa.fun/playground`,

  pillars: `4 layers. One AVM checkout:

→ Network: Algorand Mainnet CAIP-2
→ Asset: USDC ASA 31566704
→ Facilitator: GoPlausible verify + settle
→ Client: @x402-avm/fetch agent payments

Try it → syraa.fun/playground`,

  checklist: `Live for Algorand builders:

→ algorand:* in every paid 402 accept
→ USDC ASA micropayments (6 decimals)
→ GoPlausible fee payer on payment extra
→ GET /x402/capabilities shows algorand enabled
→ npm run validate-algorand-x402 E2E script

Test → syraa.fun/playground`,

  metrics: `Algorand x402 by the numbers:

→ 402: HTTP-native checkout
→ AVM: exact scheme on mainnet
→ 200: paid /news E2E confirmed

GoPlausible settles. Your agents stay on Algorand.

Try it → syraa.fun/playground`,

  featured: `Mainnet E2E confirmed on Syra.

402 Payment Required → USDC ASA transfer → GoPlausible verify_ok → 200 with news payload.

Genesis hash matched. Fee payer signed. Challenge-ready volume.

Try it → syraa.fun/playground`,

  comparison: `Before: Algorand agents bridged or skipped paid Syra APIs. No native AVM settlement.

Now: 402 → sign USDC on Algorand → GoPlausible settles. Same brain, Algorand-native treasury.

The friction just disappeared.

Try it → syraa.fun/playground`,

  launch: `SHIP LOG · x402 on Algorand Mainnet is live.

Syra × GoPlausible: USDC ASA payments on every paid intelligence API. Fee abstraction included. Global x402 Challenge ready.

Try it → syraa.fun/playground`,

  deepDive: `Algorand x402 integration, technical surface:

→ algorandX402Networks.js: mainnet CAIP-2 + USDC ASA
→ x402AvmResourceServer.js: GoPlausible facilitator
→ x402PaymentV2.js: verify/settle routing for algorand:*
→ agentAvmX402Client.js: @x402-avm/fetch payer
→ validateAlgorandX402.js: capabilities + paid E2E

Docs → facilitator.goplausible.xyz/docs`,

  split: `Multi-rail x402 on Syra:

→ Solana: agent auto-pay + PayAI
→ EVM: Base, Polygon, Arbitrum, Avalanche, Sei, SKALE, X Layer
→ BSC: B402 USD1 / USDC
→ Algorand: GoPlausible USDC ASA

Pick your chain. Pay per call.

Try it → syraa.fun/playground`,

  terminal: `Algorand x402 from the terminal:

$ curl api.syraa.fun/news?ticker=general
< HTTP/402 Payment Required
< accepts: algorand:wGHE2… asset 31566704
$ npm run validate-algorand-x402
< HTTP/200 OK · 37 articles · Payment-Response

Try it → syraa.fun/playground`,

  cta: `Algorand-native agents: your payment rail is live.

Hit a paid Syra endpoint. Pay USDC on mainnet. Unlock intelligence.

→ syraa.fun/playground
→ algorand.co/global-x402-challenge`,
};
