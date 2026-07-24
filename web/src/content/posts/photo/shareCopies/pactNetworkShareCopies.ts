import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Pact Network photo deck: 15 distinct topics. */
export const PACT_NETWORK_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `This cover announces Pact Network's refund coverage landing on Syra.

When a paid API call fails after payment, the USDC now returns on-chain automatically, giving agent wallets a form of buyer protection they did not have before.

syraa.fun/chat`,

  thesis: `This card states the gap Pact closes.

Syra agents pay Nansen, Birdeye, Zerion, and dozens of other x402 providers on nearly every chat turn. If a call failed after payment, the USDC was simply gone. Pact adds automatic on-chain refunds for covered breaches.

syraa.fun/chat`,

  quote: `This card carries the line behind the integration: 402 settles the bill, Pact settles the refund.

The agent brain and the upstream checkout stay the same. Pact watches underneath and returns principal plus premium whenever a covered call fails.

syraa.fun/chat`,

  flow: `This image walks through a Pact-covered payment, in four steps.

1. The agent pays an upstream provider through x402 using the x402 fetch client
2. Pact's Market proxy watches the covered call
3. The call fails, whether from a 5xx status, a timeout, or a malformed body, and gets classified as a breach
4. The refund settles, returning principal plus premium to the agent wallet

syraa.fun/chat`,

  timeline: `This timeline traces a covered call from payment to refund.

1. Agent chat invokes a paid tool such as Nansen, Birdeye, or Zerion
2. The agent wallet pays through the existing x402 facilitator path
3. Pact's proxy classifies the response by latency, status, and payload quality
4. A settle batch returns USDC automatically to the paying agent wallet on a breach

syraa.fun/chat`,

  pillars: `This bento layout shows the four layers in the covered fetch stack.

agentFetch composes the base fetch call with Sentinel and Pact in one resolver. The Pact SDK wraps that call as a drop-in layer that never breaks a working request. More than ten upstream clients, including Nansen, Birdeye, Zerion, and the Stable suite, are covered. A refunds endpoint keeps the whole ledger transparent.

syraa.fun/chat`,

  checklist: `This checklist covers what's live with Pact on Syra.

1. Coverage is always on for agent outbound paid fetch calls
2. All major agent client x402 upstream calls are covered
3. A Pact setup approval runs automatically on the first covered fetch
4. Refund events are persisted and exposed through a read-only API

syraa.fun/chat`,

  metrics: `This card lists the numbers behind buyer protection on Syra.

More than ten upstream x402 clients are covered. Zero dispute forms are required to get a refund. The refund still settles on the same 402 payment rail agents already use, so there is no separate claims process to learn.

syraa.fun/chat`,

  featured: `This featured card highlights how little a refund requires from the agent.

A covered breach triggers a settle batch that returns principal plus premium to the agent wallet automatically. The protocol classifies the failure itself, instead of routing it through a support desk.

syraa.fun/chat`,

  comparison: `This before and after card compares payments with and without Pact.

Before, an agent paid through x402, the call failed, and the USDC was simply gone with no recourse. Now, the same call runs with a small premium, and Pact refunds principal plus premium on-chain automatically.

syraa.fun/chat`,

  launch: `This launch card marks Pact Network as live on Syra.

A failed paid API call now gets its USDC back on-chain, giving agent wallets buyer protection on every covered upstream call.

syraa.fun/chat
www.pactnetwork.io/docs`,

  deepDive: `This deep-dive card lists where Pact plugs into the fetch stack.

agentFetch.js composes the global fetch call with Sentinel then Pact. pactFetch.js wraps the pact-sdk package per agent keypair. agentX402Client and every other agent client have been migrated onto this path, and a PactRefund model backs the read-only refunds endpoint.

syraa.fun/chat`,

  split: `This split card explains how Sentinel and Pact layer together.

Sentinel wraps fetch for budget and compliance checks when it's enabled, and Pact wraps on top of that with refund coverage that stays on for every paid upstream call. The golden rule is that Pact never breaks a call, so unregistered hosts just degrade to a bare fetch.

syraa.fun/chat`,

  terminal: `This terminal card shows Pact's status and refund history from the API.

Checking Pact's status confirms it is enabled on mainnet. Pulling refunds for an anonymous id returns entries like a refund tied to the provider host api.nansen.ai, since refunds settle on-chain regardless of whether anyone polls the API.

syraa.fun/chat`,

  cta: `This closing card points to where to see Pact in action.

Run agent chat with x402 tools and let Pact cover the upstream calls, read the Pact Network docs for how coverage works, or check the refunds API directly for the transparency ledger.

syraa.fun/chat
www.pactnetwork.io/docs
api.syraa.fun/agent/pact/refunds`,
};
