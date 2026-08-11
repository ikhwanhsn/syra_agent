import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Algorand x402 photo deck: 15 distinct topics. */
export const ALGORAND_X402_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `x402 is live on Algorand.

Pay-per-call intelligence APIs now settle USDC (digital dollars) on Algorand Mainnet via GoPlausible. Your treasury stays on Algorand. You pay only when you call.

syraa.fun/playground`,

  thesis: `Algorand builders should not have to bridge to pay.

Syra agents already settle on Solana, PayAI EVM chains, and BSC. Algorand needed the same native x402 path, with USDC ASA and GoPlausible verify plus settle (the payment actually completes).

syraa.fun/playground`,

  quote: `Settle where your treasury lives, including Algorand.

Settle means the payment actually completes. Solana, PayAI EVM, BSC B402, and Algorand Mainnet now sit in one x402 v2 surface, so you pay per call from the same Syra brain.

syraa.fun/playground`,

  flow: `402, then AVM, then intelligence.

1. Call a paid API from playground, an agent, or an external x402 client
2. 402 lists an algorand:* network plus USDC ASA 31566704
3. Sign the ASA transfer. GoPlausible's fee payer covers the ALGO fee
4. Verify genesis hash, settle on-chain, unlock the payload

syraa.fun/playground`,

  timeline: `From config to mainnet proof.

1. AVM resource server on @x402-avm/core plus a GoPlausible facilitator client
2. 402 middleware appends an Algorand accept on every paid response
3. Agent client ships with @x402-avm/fetch and mainnet Algod config
4. E2E validated: 402, pay, verify_ok, then 200 on GET /news

syraa.fun/playground`,

  pillars: `Algorand-native checkout stack.

Network is Mainnet, algorand:wGHE2… with CAIP-2 genesis verified. Asset is USDC ASA 31566704, exact scheme, 6-decimal micropayments. GoPlausible is the facilitator for verify, settle, and fee payer sponsorship. Volume is leaderboard-ready for the Global x402 Challenge.

syraa.fun/playground`,

  checklist: `What ships with this update.

1. algorand:* accept on every paid Syra API
2. USDC ASA 31566704 on Algorand Mainnet
3. GoPlausible fee payer in the payment extra
4. GET /x402/capabilities reports algorand enabled
5. validate-algorand-x402 npm script for E2E proof

syraa.fun/playground`,

  metrics: `Mainnet proof.

402 Payment Required. AVM exact scheme. 200 paid response.

The full loop is validated: capabilities, 402 offers, signed USDC transfer, GoPlausible verify, and resource delivery.

syraa.fun/playground`,

  featured: `E2E confirmed on mainnet.

A paid GET /news returned 200. Genesis hash matched. Fee payer signed. Payment-Response header came back. Challenge-ready.

syraa.fun/playground`,

  comparison: `Bridge to pay vs pay on Algorand.

Before, Algorand agents bridged or skipped paid Syra APIs because there was no native AVM x402 path. Now 402 accepts USDC ASA on mainnet, GoPlausible settles, and the treasury never leaves Algorand.

syraa.fun/playground`,

  launch: `Syra x Algorand is live.

x402 USDC payments run on every paid intelligence API. Built for the Global x402 Challenge. GoPlausible handles Mainnet verify and settle.

syraa.fun/playground
algorand.co/global-x402-challenge`,

  deepDive: `AVM-native x402 v2.

algorandX402Networks.js holds CAIP-2 plus USDC ASA config. x402AvmResourceServer.js is the GoPlausible singleton. x402PaymentV2.js routes Algorand verify and settle. agentAvmX402Client.js has the mainnet Algod client fix. PaidApiCall.network tracks challenge KPIs.

facilitator.goplausible.xyz/docs`,

  split: `Four payment rails, one Syra checkout.

Every paid endpoint advertises Solana, PayAI EVM networks, BSC B402, and Algorand. Clients pick the accept that matches their treasury (the chain that holds the money). Solana is agent wallet auto-pay. EVM is PayAI on 8 mainnets. BSC is B402 USD1 or USDC. Algorand is GoPlausible USDC ASA.

syraa.fun/playground`,

  terminal: `Algorand 402 in the wild.

curl api.syraa.fun/x402/capabilities returns algorand enabled true. curl /news?ticker=general returns HTTP 402 with an algorand:wGHE2… accept. npm run validate-algorand-x402 completes the loop with HTTP 200 and a Payment-Response header.

syraa.fun/playground`,

  cta: `Algorand-native agents still hit the same Syra brain.

Hit a paid endpoint, pay USDC on Mainnet, and unlock intelligence. Playground for a first call. GoPlausible for AVM x402 docs. Global x402 Challenge for the leaderboard.

syraa.fun/playground
algorand.co/global-x402-challenge`,
};
