import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Pact Network photo deck — 15 distinct topics. */
export const PACT_NETWORK_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Your agent pays $0.05 for Nansen. The API 500s. USDC is gone.

Not anymore.

Syra × Pact Network: automatic x402 refunds when paid calls fail. 5xx, timeout, bad payload — principal + premium back on-chain.

Try it → syraa.fun/chat`,

  thesis: `Credit cards have chargebacks. Agent wallets didn't.

Your agent pays Nansen $0.05. The API returns 500. The USDC is gone.

Pact Network adds buyer protection to every Syra outbound x402 call. Pay for intelligence. Get refunded when providers fail.`,

  quote: `"402 settles the bill. Pact settles the refund."

Same Syra agent brain. Same upstream checkout.

Pact watches underneath and returns principal + premium on-chain when a covered call goes sideways.

No dispute form. No ticket queue.`,

  flow: `How Pact refunds work on Syra:

1. Agent pays x402 upstream (Nansen, Birdeye, Zerion…)
2. Pact Market proxy classifies the call
3. 5xx / timeout / bad body = covered breach
4. Refund settles to agent wallet on Solana

Pay. Fail. Refund. On-chain.`,

  timeline: `Same checkout you already use. New recourse layer:

→ Agent chat invokes a paid tool (nansen-profiler, etc.)
→ USDC settles via existing @x402/fetch pipeline
→ Pact wraps fetch and routes covered calls through proxy
→ Failure classified → SettleBatch refunds agent wallet

No new payment flow. Just buyer protection underneath.`,

  pillars: `Four layers. One fetch resolver:

→ agentFetch: Sentinel + Pact composition
→ @q3labs/pact-sdk drop-in wrapper
→ 10+ agent*Client upstream calls covered
→ GET /agent/pact/refunds transparency ledger

Buyer protection without rewriting x402.`,

  checklist: `Pact is live on Syra today:

✓ Always on for agent outbound paid fetch
✓ Nansen, Birdeye, Zerion, Stableenrich covered
✓ Auto pact.setup() SPL approve on first use
✓ Refund events in MongoDB + read API
✓ Premium accounted in balance checks

Pay upstream with confidence → syraa.fun/chat`,

  metrics: `Pact by the numbers on Syra:

→ 10+ upstream x402 clients wrapped
→ 0 dispute forms required
→ ~$0.001 premium estimate per covered call
→ Refunds settle on Solana mainnet

402 for price. Pact for recourse.`,

  featured: `Zero manual claims.

Covered Syra agent call fails after x402 payment → Pact refunds principal + premium on-chain at the next settlement window.

The protocol classifies the breach. Not a support desk.`,

  comparison: `Before Pact:
Agent pays → API fails → money gone.

With Pact on Syra:
Agent pays → API fails → automatic on-chain refund.

Same x402 checkout. Same agent wallet. Buyer protection underneath.`,

  launch: `LIVE — Syra × Pact Network

Failed paid API call? USDC returns on-chain.

Nansen. Birdeye. Zerion. Stable suite. All covered.

→ syraa.fun/chat
→ pactnetwork.io/docs`,

  deepDive: `For builders — Pact on Syra:

→ api/libs/agentFetch.js composes fetch stack
→ pactFetch.js wraps @q3labs/pact-sdk per agent
→ agentX402Client + all agent*Clients migrated
→ models/PactRefund.js + GET /agent/pact/refunds

Default on. Production wired.`,

  split: `Two layers. One fetch stack.

Sentinel (optional): audit + budget caps when enabled.
Pact (always): refund coverage for failed paid calls.

globalThis.fetch → Sentinel → Pact → upstream x402 provider.

Composable. Never breaks the call.`,

  terminal: `Verify Pact refunds from CLI:

$ curl api.syraa.fun/agent/pact/status
{ "enabled": true, "network": "mainnet" }

$ curl api.syraa.fun/agent/pact/refunds?anonymousId=...
{ "refunds": [{ "refundUsd": 0.05, "providerHost": "api.nansen.ai" }] }

On-chain settlement. API transparency.`,

  cta: `Pay upstream APIs. Get refunded on failure.

Syra × Pact Network is live. Run agent chat with x402 tools — covered call fails, principal + premium return on-chain.

→ syraa.fun/chat
→ pactnetwork.io/docs
→ api.syraa.fun/agent/pact/refunds`,
};
