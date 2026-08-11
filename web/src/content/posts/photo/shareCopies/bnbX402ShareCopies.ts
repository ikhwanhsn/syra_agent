import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for BNB x402 photo deck: 15 distinct topics. */
export const BNB_X402_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `x402 is live on BNB.

Pay-per-call intelligence APIs now settle (the payment actually completes) on BNB Smart Chain via Binance B402. Your treasury stays on BNB. You pay only when you call.

syraa.fun/playground`,

  thesis: `BNB builders should not have to bridge to pay.

Syra agents already trade on Solana and Base. BNB Smart Chain is one of the largest EVM ecosystems. Intelligence APIs needed native x402 settlement there, not a hop to another chain (the network that holds the money).

syraa.fun/playground`,

  quote: `List an API once, then settle where your treasury lives.

Settle means the payment actually completes. Solana, Base, and BSC now share one intelligence stack with three native payment rails.

syraa.fun/playground`,

  flow: `Call the API, sign on BSC, unlock the data.

1. An agent or the playground hits a paid Syra endpoint
2. The server returns HTTP 402 Payment Required with B402 on eip155:56
3. The wallet signs EIP-3009 or Permit2 via MetaMask on BSC
4. B402 verifies and settles. Intelligence comes back.

syraa.fun/playground`,

  timeline: `Native BSC treasury. Zero bridges.

1. Agent chat or playground calls a Syra intelligence API
2. HTTP 402 lists B402 on eip155:56 with stablecoin options
3. MetaMask signs EIP-3009 or Permit2 using USD1, U, USDC, or USDT
4. B402 verify plus settle unlocks the payload on BSC

syraa.fun/playground`,

  pillars: `Pay with the stable your treasury already holds.

USD1 (World Liberty Financial) and U (United Stables) both sign with EIP-3009 transfer authorization. USDC (digital dollars) and USDT on BSC sign through Permit2. Which token settles is configurable via B402_TOKEN.

syraa.fun/playground`,

  checklist: `Live for BNB builders today.

1. BSC network id eip155:56 appears in 402 accepts
2. B402 verify plus settle runs on paid API calls
3. Micro-unit pricing maps to 18-decimal BSC stables
4. Full merchant inbound works on BSC via Binance B402

syraa.fun/playground`,

  metrics: `Your treasury's chain. Native checkout.

3 payment chains live. 4 BSC stable options. HTTP 402 micropayments.

BNB-native agents can pay for Nansen-grade flows, market data, and research without bridging or leaving BSC.

syraa.fun/playground`,

  featured: `Pay per call, not per month.

Hit an endpoint, get a price, sign on BSC, unlock intelligence. x402 means you pay only when you call. No API keys. No subscriptions.

syraa.fun/playground`,

  comparison: `Bridge to pay vs pay on BNB.

Before, BNB agents bridged or skipped paid Syra APIs because there was no native B402 path. Now you get 402, sign on BSC, and Binance B402 verifies and settles. Same Syra brain. BNB-native treasury.

syraa.fun/playground`,

  launch: `Syra x Binance B402 is live.

Intelligence APIs settle natively on BNB Smart Chain, so BNB builders can pay per call without leaving their chain.

syraa.fun/playground
docs.syraa.fun`,

  deepDive: `Shared x402 v2 core. Three chains.

The API Playground has a Binance chain tab. Agent wallets can fund and sign on BSC. Agent chat tools inject x402 payments. Solana, Base, and BSC share the same x402 v2 core.

syraa.fun/playground`,

  split: `One intelligence stack, three native treasuries.

Solana and Base already carry x402 for existing agents. B402 on eip155:56 is for BNB builders who do not want a bridge. Solana covers autonomous traders. Base covers the agent wallet plus facilitator. BSC uses B402 with EIP-3009 and Permit2. Same intelligence APIs on all three.

syraa.fun/playground`,

  terminal: `x402 checkout from the terminal.

curl api.syraa.fun/v1/intelligence returns HTTP 402 with x402-accepts B402 eip155:56 USD1. syra-x402 pay --chain bsc --token USD1 signs EIP-3009 on MetaMask. The retry is HTTP 200 with the intelligence payload unlocked.

syraa.fun/playground`,

  cta: `Build on BNB and keep paying on BNB.

Hit a paid endpoint, get 402, sign with MetaMask, and unlock intelligence. Playground for a first call. Docs for the x402 and B402 reference. Binance Onchain Pay for the B402 spec.

syraa.fun/playground
docs.syraa.fun/docs/api-reference
developers.binance.com/docs/onchainpay-x402/introduction`,
};
