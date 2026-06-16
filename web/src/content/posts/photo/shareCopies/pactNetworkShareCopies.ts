import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Pact Network photo deck — 15 distinct topics. */
export const PACT_NETWORK_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Agent payments had no buyer protection. Until now.

Syra × Pact Network: automatic x402 refunds when paid API calls fail. 5xx, timeout, bad payload — principal + premium back on-chain.

Nansen. Birdeye. Zerion. Covered.

Try it → syraa.fun/chat`,

  thesis: `Your agent pays Nansen $0.05. The API returns 500. The USDC is gone.

Credit cards have chargebacks. Agent wallets didn't. Pact Network fixes that for every Syra outbound x402 call.

Pay for intelligence. Get refunded when providers fail.`,

  quote: `"402 for price. Pact for recourse. Same Syra agent brain."

Agents still pay providers. Pact watches underneath and settles refunds on-chain when a covered call goes sideways.

No dispute form. No API key. Just buyer protection for the agent economy.`,

  flow: `How Pact refunds work on Syra:

1. Agent pays x402 upstream (Nansen, Birdeye, etc.)
2. Pact Market proxy classifies the call
3. 5xx / timeout / bad body = covered breach
4. Refund settles to agent wallet on Solana

Automatic. On-chain. No claim form.`,

  timeline: `Pact coverage path — step by step:

→ Agent chat invokes a paid tool (e.g. nansen-profiler)
→ USDC settles via existing @x402/fetch pipeline
→ Pact wraps fetch and routes covered calls through proxy
→ Failure classified → SettleBatch refunds agent wallet

Same checkout. New recourse layer.`,

  pillars: `Four pillars of Syra × Pact:

→ agentFetch: Sentinel + Pact composition
→ @q3labs/pact-sdk drop-in fetch wrapper
→ All agent*Client upstream calls covered
→ GET /agent/pact/refunds transparency ledger

Buyer protection without rewriting x402.`,

  checklist: `What's live with Pact on Syra:

✓ Pact always on for agent outbound paid fetch
✓ Nansen, Birdeye, Zerion, Stableenrich covered
✓ Auto pact.setup() SPL approve on first use
✓ Refund events in MongoDB + read API
✓ Premium accounted in balance checks

Your agents pay with confidence now.`,

  metrics: `Pact by the numbers on Syra:

→ 10+ upstream x402 clients wrapped
→ 0 dispute forms required
→ ~$0.001 premium estimate per covered call
→ Refunds settle on Solana mainnet

402 for price. Pact for recourse.`,

  featured: `Zero dispute forms.

When a covered Syra agent call fails after x402 payment, Pact refunds principal + premium on-chain at the next settlement window.

No negotiation. No ticket. The protocol decides.`,

  comparison: `Before Pact:
Agent pays → API fails → money gone.

With Pact on Syra:
Agent pays → API fails → automatic on-chain refund.

Same x402 checkout. Same agent wallet. New buyer protection.`,

  launch: `INTEGRATION LIVE · Syra × Pact Network

Automatic x402 refunds for agent paid API calls. Chargebacks for the agent economy.

Nansen. Birdeye. Zerion. Stable suite. All covered.

pactnetwork.io/docs`,

  deepDive: `Technical surface — Pact on Syra:

→ api/libs/agentFetch.js composes fetch stack
→ pactFetch.js wraps @q3labs/pact-sdk per agent
→ agentX402Client + all agent*Clients migrated
→ models/PactRefund.js + GET /agent/pact/refunds

Built for production. Default on.`,

  split: `Two layers. One fetch.

Sentinel (optional): audit + budget caps when enabled.
Pact (always): refund coverage for failed paid calls.

globalThis.fetch → Sentinel → Pact → upstream x402 provider.

Composable. Never breaks the call.`,

  terminal: `Pact refund check from CLI:

$ curl api.syraa.fun/agent/pact/status
{ "enabled": true, "network": "mainnet" }

$ curl api.syraa.fun/agent/pact/refunds?anonymousId=...
{ "refunds": [{ "refundUsd": 0.05, "providerHost": "api.nansen.ai" }] }

Transparency built in.`,

  cta: `Your agents deserve buyer protection.

Syra × Pact Network is live. Pay upstream x402 APIs from agent chat. If a covered call fails, get refunded on-chain.

→ syraa.fun/chat
→ pactnetwork.io/docs
→ api.syraa.fun/agent/pact/refunds`,
};
