import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for BNB x402 photo deck: 15 distinct topics. */
export const BNB_X402_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `This cover announces x402 support landing on BNB Smart Chain.

Pay-per-call intelligence APIs now settle on BSC through Binance's B402 facilitator, network id eip155:56. Your treasury never has to leave BNB to pay for a Syra endpoint.

syraa.fun/playground`,

  thesis: `This card states the gap x402 on BNB closes.

Syra agents already trade on Solana and Base, and BNB Smart Chain is one of the largest EVM ecosystems around. Intelligence APIs needed native x402 settlement there instead of a bridge workaround, so BNB builders can pay without leaving their chain.

syraa.fun/playground`,

  quote: `This card carries the line behind the multi-chain rollout: list an API once, then let each buyer settle on whichever chain their treasury already lives on.

Solana, Base, and BSC now share one intelligence stack with three native payment rails.

syraa.fun/playground`,

  flow: `This image walks through an x402 payment on BNB, in four steps.

1. An agent or the playground calls a paid Syra endpoint
2. The server returns HTTP 402 with a B402 option on eip155:56
3. The wallet signs an EIP-3009 or Permit2 transfer on BSC through MetaMask
4. B402 verifies and settles the payment, then the payload unlocks

syraa.fun/playground`,

  timeline: `This timeline shows the checkout path for a native BSC payment.

1. Agent chat or the API playground calls a paid Syra intelligence endpoint
2. The B402 accept header lists eip155:56 with stablecoin options
3. MetaMask signs an EIP-3009 or Permit2 transfer using USD1, U, USDC, or USDT
4. B402 verifies and settles the payment natively on BSC and unlocks the payload

syraa.fun/playground`,

  pillars: `This bento layout shows the four BSC stablecoins accepted for x402 checkout.

USD1 from World Liberty Financial and U from United Stables both sign with EIP-3009 transfer authorization. USDC and USDT on BSC sign through Permit2 instead. Which token settles is configurable through the B402_TOKEN setting.

syraa.fun/playground`,

  checklist: `This checklist covers what shipped for BNB builders.

1. BSC network id eip155:56 now appears in 402 accepts
2. B402 handles verify and settle on paid API calls
3. Micro-unit pricing maps correctly to 18-decimal BSC stablecoins
4. Full merchant inbound payments work on BSC through Binance B402

syraa.fun/playground`,

  metrics: `This card lists the numbers behind multi-chain x402 checkout.

Three chains, Solana, Base, and BSC, can now settle a Syra payment. Four BSC stablecoins are supported for checkout. Every payment still runs through the same HTTP 402 flow, so BNB-native agents can pay for Nansen-grade flows, market data, and research without bridging.

syraa.fun/playground`,

  featured: `This featured card highlights how the pay-per-call model works.

Hit an endpoint, get a price back as an HTTP 402, sign on BSC, and the intelligence payload unlocks immediately. There are no API keys and no subscriptions involved.

syraa.fun/playground`,

  comparison: `This before and after card compares bridging with paying natively on BNB.

Before, BNB agents either bridged to another chain or skipped paid Syra APIs entirely, since there was no native B402 settlement path. Now, a 402 response, a signature on BSC, and verification through Binance B402 complete the same checkout with a BNB-native treasury.

syraa.fun/playground`,

  launch: `This launch card marks Binance B402 as live on Syra.

Intelligence APIs now settle natively on BNB Smart Chain, so BNB builders can pay per call without leaving their own chain.

syraa.fun/playground
docs.syraa.fun`,

  deepDive: `This deep-dive card lists the technical surface behind BNB support.

The API Playground has a Binance chain tab, agent wallets can fund and sign on BSC, and agent chat tools inject x402 payments automatically. All three chains share the same x402 v2 core underneath.

syraa.fun/playground`,

  split: `This split card explains how the three chains divide up.

Solana and Base already carry x402 for existing agents and the agent wallet facilitator. BNB Smart Chain now adds B402 with EIP-3009 and Permit2 signing for builders who never want to bridge. The same intelligence APIs sit behind all three.

syraa.fun/playground`,

  terminal: `This terminal card shows an x402 checkout on BSC end to end.

Calling the intelligence endpoint returns HTTP 402 with a B402 accept for eip155:56 in USD1. Paying with the chain flag set to bsc signs an EIP-3009 transfer in MetaMask, and the retry comes back HTTP 200 with the intelligence payload unlocked.

syraa.fun/playground`,

  cta: `This closing card points BNB builders to where to start.

Open the API playground to try a call, read the docs for the full x402 and B402 reference, or check Binance's own Onchain Pay spec for how B402 verification works.

syraa.fun/playground
docs.syraa.fun/docs/api-reference
developers.binance.com/docs/onchainpay-x402/introduction`,
};
