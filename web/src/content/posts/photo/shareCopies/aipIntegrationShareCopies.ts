import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for AIP integration photo deck — 15 distinct topics. */
export const AIP_INTEGRATION_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `The agentic web needs a handshake.

Syra × Agent Internet Protocol: Agent Card discovery, A2A JSON-RPC tasks, and did:aip identity on Solana. x402 commerce unchanged.

Agent Card → api.syraa.fun/.well-known/agent.json`,

  thesis: `Syra already runs x402, 8004, SAID, and Ampersend.

AIP adds the missing layer — standardized agent discovery, task lifecycle, and did:aip identity. Four open standards. One Syra gateway.`,

  quote: `"Discover with Agent Card. Task via A2A. Pay with x402. Verify with did:aip."

Syra implements three AIP standards natively. Commerce rail was already live.`,

  flow: `How Syra × AIP works:

1. GET /.well-known/agent.json — capabilities + pricing
2. POST /a2a — task/create + task/status (JSON-RPC 2.0)
3. GET /aip/verify/:did — on-chain counterparty check
4. npm run register-aip — AgentRecord on Solana registry

Discover → task → pay → settle.`,

  timeline: `Shipped in one integration pass:

→ AIP-01 Agent Card from x402 catalog
→ AIP-02 POST /a2a JSON-RPC server
→ AIP-04 did:aip resolver + /aip routes
→ aip-discover · aip-resolve · aip-delegate tools
→ Brain delegation to AIP specialists`,

  pillars: `Four AIP standards. Syra implements three:

→ AIP-01 Agent Card: /.well-known/agent.json
→ AIP-02 A2A: POST /a2a task lifecycle
→ AIP-03 x402: already live (multi-chain)
→ AIP-04 did:aip: on-chain identity + verify`,

  checklist: `AIP is live on Syra today:

✓ GET /.well-known/agent.json (7 A2A capabilities)
✓ POST /a2a — task/create + task/status
✓ GET /aip/status · /aip/resolve · /aip/verify
✓ aip-discover · aip-resolve · aip-delegate tools
✓ npm run register-aip for on-chain registry`,

  metrics: `AIP by the numbers:

→ 7 A2A capabilities (signal, brain, news, …)
→ 4 AIP standards (3 newly wired)
→ 26+ x402 resources in Agent Card
→ 402 commerce unchanged

Interoperable agents. Same Syra stack.`,

  featured: `Agent Card. A2A server. did:aip identity.

Syra generates its AIP Agent Card from the existing x402 catalog — one source of truth for discovery, pricing, and capabilities.`,

  comparison: `Before AIP:
Custom tool calls only. No standard agent handshake.

With AIP on Syra:
Agent Card + A2A JSON-RPC + did:aip verify + x402 payment.

Same intelligence. Standard agent protocol.`,

  launch: `LIVE — Syra × Agent Internet Protocol

Agent Card · A2A tasks · did:aip identity.

Discover → task → pay → settle on Solana.

Agent Card → api.syraa.fun/.well-known/agent.json`,

  deepDive: `AIP integration — technical surface:

→ api/libs/aipAgentCard.js — Agent Card builder
→ api/routes/a2a/index.js — JSON-RPC 2.0 server
→ api/libs/aipDidClient.js — @aipagents/did-resolver
→ api/libs/aipClient.js — discover, resolve, delegate
→ scripts/register-aip-agent.js — on-chain registry`,

  split: `Agent stack on Syra:

→ x402: pay-per-call commerce (AIP-03 ✓)
→ 8004 + SAID: agent identity registries
→ AIP: Agent Card + A2A + did:aip handshake
→ Brain: auto-delegate to AIP specialists

Commerce + identity + interoperability.`,

  terminal: `Try Syra's AIP surface:

$ curl api.syraa.fun/.well-known/agent.json
{ "did": "did:aip:…:syra", "capabilities": […] }

$ curl -X POST api.syraa.fun/a2a \\
  -d '{"jsonrpc":"2.0","method":"task/status",…}'`,

  cta: `Syra speaks AIP.

Fetch the Agent Card. Resolve a did:aip. Submit an A2A task.

→ api.syraa.fun/.well-known/agent.json
→ aipagents.xyz
→ docs.syraa.fun`,
};
