import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for BNB x402 photo deck — 15 distinct topics. */
export const BNB_X402_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `SHIP LOG · x402 is live on BNB Smart Chain.

Pay-per-call intelligence APIs settle natively via Binance B402. Your treasury stays on BSC. No bridge. No subscription.

Solana. Base. BSC. One brain. Three native rails.

Try it → syraa.fun/playground`,

  thesis: `BNB builders should not bridge just to pay for intelligence.

Syra agents already trade on Solana and Base. BNB Smart Chain is one of the largest EVM ecosystems. APIs needed native x402 settlement, not a workaround.

Your treasury stays on BSC. Same checkout. Same agent brain.`,

  quote: `"List once on x402 directories. Settle where your treasury lives."

Solana, Base, and BSC: one intelligence stack, three native payment rails.

402 for price. Sign on your chain. Get the data.`,

  flow: `x402 on BNB in 4 steps:

1. Agent hits a paid Syra API
2. Server returns 402 with B402 on eip155:56
3. Wallet signs EIP-3009 or Permit2 on BSC
4. Intelligence unlocked. Settled natively.

BNB builders stay on BNB.

Test it → syraa.fun/playground`,

  timeline: `What shipped for BNB checkout:

→ Call a paid Syra endpoint from agent or playground
→ Receive HTTP 402 with B402 accept on eip155:56
→ MetaMask signs EIP-3009 or Permit2 on BSC
→ B402 verifies and settles. Payload unlocked.

Your treasury never leaves BSC.`,

  pillars: `4 BSC stablecoins. One x402 checkout:

→ USD1 (EIP-3009)
→ U / United Stables (EIP-3009)
→ USDC on BSC (Permit2)
→ USDT on BSC (Permit2)

List once. Settle where your treasury lives.`,

  checklist: `Live for BNB builders today:

→ BSC network id eip155:56 in 402 accepts
→ B402 verify + settle on paid API calls
→ Micro-unit pricing mapped to 18-decimal BSC stables
→ Full merchant inbound on BSC via Binance B402

Test in playground → syraa.fun/playground`,

  metrics: `3 chains. 4 BSC stables. HTTP-native micropayments.

Syra intelligence APIs settle on Solana, Base, and BNB Smart Chain through Binance B402, not a bridge.

Multi-chain treasuries deserve multi-chain checkout.`,

  featured: `Pay per call. Not per month.

No API keys. No subscriptions. Hit an endpoint, get a price, sign on your chain, unlock intelligence.

The payment primitive agents were built for, now native on BSC.`,

  comparison: `Before: BNB agents bridged or skipped paid Syra APIs. No native settlement.

Now: 402 → sign on BSC → verify/settle via Binance B402. Same brain, BNB-native treasury.

The friction between "I build on BNB" and "I need Syra data" just disappeared.

→ syraa.fun/playground`,

  launch: `SHIP LOG · x402 on BNB Smart Chain is live.

Pay-per-call intelligence APIs settle natively via Binance B402 on eip155:56.

USD1, U, USDC, USDT. Four stables. One checkout. No bridge.

Test now → syraa.fun/playground`,

  deepDive: `BNB x402 under the hood:

→ API Playground with Binance chain tab
→ Agent wallet BSC funding and signing
→ Agent chat tools with x402 injection
→ Shared x402 v2 core across Solana, Base, BSC

Docs → docs.syraa.fun`,

  split: `One stack. Three native treasuries.

SOLANA + BASE
Existing x402 rails for autonomous traders and agents.

BNB SMART CHAIN
B402 on eip155:56. EIP-3009 and Permit2 via MetaMask.

Same intelligence APIs. No bridge workaround.

→ syraa.fun/playground`,

  terminal: `x402 on BSC from the terminal:

$ curl api.syraa.fun/v1/intelligence
< HTTP/402 Payment Required
< x402-accepts: B402 eip155:56 USD1
$ syra-x402 pay --chain bsc --token USD1
> signing EIP-3009 on MetaMask…
< HTTP/200 OK · intelligence payload unlocked

Build on BNB. Pay on BNB. Stay on BNB.`,

  cta: `BNB-native agents: your payment rail is live.

→ Playground: syraa.fun/playground
→ API docs: docs.syraa.fun
→ B402 spec: Binance Onchain Pay

Hit a paid endpoint. Get 402. Sign with MetaMask. Unlock intelligence without leaving BSC.`,
};
