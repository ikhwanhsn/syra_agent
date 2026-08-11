import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Pact Network photo deck: 15 distinct topics. */
export const PACT_NETWORK_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Pact x Syra is live: if a paid API call fails, USDC (digital dollars) comes back on-chain.

Agents pay per call with x402 (you pay only when you call). When a covered call fails, buyer protection returns the money to the agent wallet on Solana.

syraa.fun/chat`,

  thesis: `Agent wallets had no chargebacks.

Syra agents pay Nansen, Birdeye, Zerion, and dozens of x402 providers (pay only when you call) on nearly every chat turn. If the call failed after payment, the USDC was gone. Pact adds automatic on-chain refunds for covered breaches.

syraa.fun/chat`,

  quote: `x402 settles the bill, and Pact settles the refund.

Settle means the payment actually completes. The same agent brain and upstream checkout stay in place. Pact watches underneath and returns principal plus premium when a covered call fails.

syraa.fun/chat`,

  flow: `Pay, fail, refund, all on-chain.

1. The agent pays an upstream provider with x402 (pay only when you call) via @x402/fetch
2. Covered calls route through the Pact Market proxy
3. A 5xx, timeout, or bad body gets classified as a breach
4. Principal plus premium return to the agent wallet

syraa.fun/chat`,

  timeline: `Same checkout. Refund on failure.

1. Agent chat invokes a paid tool such as Nansen, Birdeye, or Zerion
2. The agent wallet pays through the existing x402 facilitator path
3. Pact classifies latency, status, and payload quality
4. SettleBatch returns USDC (digital dollars) to the paying agent wallet

syraa.fun/chat`,

  pillars: `Four layers sit on one fetch stack.

agentFetch composes fetch, Sentinel, then Pact in one resolver. The Pact SDK (@q3labs/pact-sdk) is a drop-in wrapper that never breaks a working call. More than ten upstream clients are covered, including Nansen, Birdeye, Zerion, and the Stable suite. GET /agent/pact/refunds keeps the refund ledger readable.

syraa.fun/chat`,

  checklist: `Pact is live on Syra today.

1. Coverage is always on for agent outbound paid fetch
2. All major agent*Client x402 upstream calls are covered
3. Auto pact.setup() SPL approve runs on the first covered fetch
4. Refund events persist and show up on a read-only API

syraa.fun/chat`,

  metrics: `Buyer protection, by the numbers.

10+ upstream x402 clients. 0 dispute forms. Same 402 payment rail.

Agents burn USDC on flaky APIs. Pact returns funds when covered calls fail. No ticket queue.

syraa.fun/chat`,

  featured: `Refunds settle without a claim.

Settle means the payment (and the refund) actually complete on-chain. A covered breach runs SettleBatch and returns principal plus premium to the agent wallet. The protocol classifies the failure, not a support desk.

syraa.fun/chat`,

  comparison: `Failed paid calls used to eat the USDC.

Before, the agent paid with x402, the call failed, and the money was gone with no recourse. Now the same call runs with a small premium, and Pact refunds principal plus premium on-chain automatically.

syraa.fun/chat`,

  launch: `Syra x Pact Network is live.

A failed paid API call can get USDC back on-chain. That is buyer protection for agent wallets on covered Solana calls.

syraa.fun/chat
www.pactnetwork.io/docs`,

  deepDive: `Pact is wired into the fetch stack.

agentFetch.js routes globalThis.fetch through Sentinel then Pact. pactFetch.js wraps @q3labs/pact-sdk per agent keypair. agentX402Client and all agent*Clients migrated onto that path. PactRefund plus GET /agent/pact/refunds expose the ledger.

syraa.fun/chat`,

  split: `Audit is optional, and refund coverage stays on.

Sentinel wraps fetch for budget and compliance when you enable it. Pact wraps on top with refund coverage on every paid upstream call. Pact never breaks a working call. Unregistered hosts degrade to bare fetch.

syraa.fun/chat`,

  terminal: `You can verify refunds from the API.

curl api.syraa.fun/agent/pact/status returns enabled true on mainnet. curl /agent/pact/refunds?anonymousId=... returns entries such as providerHost api.nansen.ai. Refunds settle on-chain whether or not anyone polls the API.

syraa.fun/chat`,

  cta: `Pay upstream APIs and get refunded on failure.

Run agent chat with x402 tools. If a covered call fails, principal plus premium return on-chain. Pact docs explain coverage. The refunds API is the transparency ledger.

syraa.fun/chat
www.pactnetwork.io/docs
api.syraa.fun/agent/pact/refunds`,
};
