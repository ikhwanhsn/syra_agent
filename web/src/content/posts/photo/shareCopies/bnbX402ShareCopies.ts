import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for BNB x402 photo deck — 15 distinct topics. */
export const BNB_X402_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Agents don't stop at one chain. Neither does Syra.

x402 intelligence APIs now settle natively on BNB Smart Chain via Binance B402. Pay-per-call. No bridge. No subscription.

Solana. Base. BSC. One brain. Your treasury stays where your agents live.

Try it → syraa.fun/playground`,

  thesis: `BNB Smart Chain is one of the largest EVM ecosystems. Syra agents already trade on Solana and Base — they shouldn't bridge just to pay for intelligence.

Native B402 settlement means your treasury stays on BSC. Same x402 checkout. Same Syra agent brain.

Agents don't stop at one chain. Neither does Syra.`,

  quote: `"List once on x402 directories, settle where your treasury lives."

Solana, Base, and BSC — one intelligence stack, three native payment rails.

402 for price. Sign on your chain. Get the data your agents need.`,

  flow: `How x402 works on BNB — end to end:

1. Agent hits a paid Syra API
2. Server returns 402 with B402 on eip155:56
3. Wallet signs EIP-3009 or Permit2 on BSC
4. Intelligence unlocked. Settled natively.

BNB builders shouldn't leave their chain to pay for research and market data. Now they don't have to.`,

  timeline: `BNB x402 checkout — step by step:

→ Call a paid Syra endpoint from agent or playground
→ Receive HTTP 402 with B402 accept on eip155:56
→ MetaMask signs EIP-3009 or Permit2 on BSC
→ B402 verifies and settles — payload unlocked

No bridge. No subscription. Native BSC treasury.`,

  pillars: `4 BSC stablecoins. One x402 checkout:

→ USD1 (EIP-3009)
→ U / United Stables (EIP-3009)
→ USDC on BSC (Permit2)
→ USDT on BSC (Permit2)

List once on x402 directories. Settle where your treasury lives.`,

  checklist: `What's live for BNB builders:

→ BSC network id eip155:56 in 402 accepts
→ B402 verify + settle on paid API calls
→ Micro-unit pricing mapped to 18-decimal BSC stables
→ Full merchant inbound on BSC via Binance B402`,

  metrics: `3 chains live. 4 BSC stables. HTTP-native micropayments.

Syra intelligence APIs settle on Solana, Base, and now BNB Smart Chain — through Binance B402, not a bridge workaround.

Multi-chain treasuries deserve multi-chain checkout.`,

  featured: `402 — HTTP-native micropayments across 3 chains.

No API keys. No monthly bills. Hit an endpoint, get a price, sign on your chain, unlock intelligence.

The payment primitive agents were built for — now on BSC.`,

  comparison: `Before: BNB agents bridged or skipped paid Syra APIs. No native settlement path.

Now: 402 → sign on BSC → verify/settle via Binance B402. Same brain, BNB-native treasury.

The friction between "I build on BNB" and "I need Syra intelligence" just disappeared.`,

  launch: `SHIP LOG · x402 on BNB Smart Chain is live.

Pay-per-call intelligence APIs now settle natively via Binance B402 on eip155:56.

USD1, U, USDC, USDT — four stable options. One checkout flow.

Test in the playground → syraa.fun/playground`,

  deepDive: `BNB x402 integration — technical surface:

→ API Playground with Binance chain tab
→ Agent wallet BSC funding and signing
→ Agent chat tools with x402 injection
→ Shared x402 v2 core across Solana, Base, BSC`,

  split: `Multi-chain intelligence. Chain-native settlement.

SOLANA + BASE
Existing x402 rails for autonomous traders and agents.

BNB SMART CHAIN
B402 on eip155:56. EIP-3009 and Permit2 signing via MetaMask.

One Syra stack. Three treasuries. No bridge workaround.`,

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

Hit a paid endpoint. Get 402. Sign with MetaMask. Unlock intelligence — without leaving BSC.`,
};
