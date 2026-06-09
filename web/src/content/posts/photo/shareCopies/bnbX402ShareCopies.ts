import type { PostPhotoLayoutTemplate } from "../layouts";

/** Per-template X copy for BNB x402 photo picks — tuned to each card's visual story. */
export const BNB_X402_PHOTO_SHARE_COPIES: Partial<Record<PostPhotoLayoutTemplate, string>> = {
  "photo-cover-spotlight": `Agents don't stop at one chain. Neither does Syra.

x402 intelligence APIs now settle natively on BNB Smart Chain via Binance B402. Pay-per-call. No bridge. No subscription.

Solana. Base. BSC. One brain. Your treasury stays where your agents live.

Try it in the playground → syraa.fun/playground`,

  "photo-flow-pipeline": `How x402 works on BNB — end to end:

1. Agent hits a paid Syra API
2. Server returns 402 with B402 on eip155:56
3. Wallet signs EIP-3009 or Permit2 on BSC
4. Intelligence unlocked. Settled natively.

BNB builders shouldn't leave their chain to pay for research, flows, and market data. Now they don't have to.

Playground → syraa.fun/playground`,

  "photo-cards-quad": `4 BSC stablecoins. One x402 checkout:

→ USD1 (EIP-3009)
→ U / United Stables (EIP-3009)
→ USDC on BSC (Permit2)
→ USDT on BSC (Permit2)

List once on x402 directories. Settle where your treasury lives. Same Syra intelligence stack across Solana, Base, and BNB.

If you build on BSC, this is your agents' payment rail.`,

  "photo-stat-trio": `3 chains live. 4 BSC stables. HTTP-native micropayments.

Syra intelligence APIs settle on Solana, Base, and now BNB Smart Chain — through Binance B402, not a bridge workaround.

402 for price. Sign on your chain. Get the data your agents need.

Multi-chain treasuries deserve multi-chain checkout.`,

  "photo-comparison": `Before: BNB agents bridged or skipped paid Syra APIs. No native settlement path.

Now: 402 → sign on BSC → verify/settle via Binance B402. Same brain, BNB-native treasury.

The friction between "I build on BNB" and "I need Syra intelligence" just disappeared.

Test it → syraa.fun/playground`,

  "photo-closing-cta": `BNB-native agents: your payment rail is live.

→ Playground: syraa.fun/playground
→ API docs: docs.syraa.fun
→ B402 spec: Binance Onchain Pay

Hit a paid endpoint. Get 402. Sign with MetaMask. Unlock Nansen-grade flows, market data, and research — without leaving BSC.`,
};
