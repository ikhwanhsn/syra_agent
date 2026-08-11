import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for AIP integration photo deck. Proof-first, no meta card talk. */
export const AIP_INTEGRATION_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Syra now speaks the Agent Internet Protocol.

Agent Card discovery and A2A tasks sit alongside did:aip identity (an on-chain name for the agent). x402 commerce (pay only when you call) keeps running exactly as it did before.

api.syraa.fun/.well-known/agent.json`,

  thesis: `Agents need a standard handshake, not a one-off integration each time.

Syra already runs x402, 8004, SAID, and Ampersend. AIP adds an open protocol layer on top: discovery, task lifecycle, and did:aip identity for autonomous agents on Solana.

api.syraa.fun/.well-known/agent.json`,

  quote: `Discover the agent, create a task, pay, then verify.

Agent Card handles discovery. A2A's JSON-RPC handles tasks. x402 handles settlement. did:aip handles identity. Four standards, routed through the same Syra gateway.

api.syraa.fun/aip/status`,

  flow: `Discover, task, pay, then settle.

1. Fetch the Agent Card at GET /.well-known/agent.json for capabilities and pricing
2. Create a task with POST /a2a, paying through x402 as part of the request
3. Verify a counterparty on-chain with GET /aip/verify/:did
4. Register the agent itself as an AgentRecord on Solana with npm run register-aip

api.syraa.fun/.well-known/agent.json`,

  timeline: `The full AIP stack shipped in one pass.

1. Agent Card generated as AIP-01 JSON straight from the existing x402 catalog
2. A2A server built as a JSON-RPC 2.0 endpoint at POST /a2a
3. did:aip adapter added, using the aipagents did-resolver package plus new /aip routes
4. Buy-side tools added for discovery, resolving identities, and delegating tasks through Brain

api.syraa.fun/aip/status`,

  pillars: `Four AIP standards, three newly wired, one already live.

AIP-01, the Agent Card, is served at /.well-known/agent.json. AIP-02, A2A, runs as a JSON-RPC task lifecycle at POST /a2a. AIP-03 is x402 payment, already live as Syra's multi-chain rail. AIP-04 is did:aip, giving Syra on-chain identity with a W3C DID Document.

api.syraa.fun/.well-known/agent.json`,

  checklist: `AIP is live on Syra today.

1. GET /.well-known/agent.json exposes 7 A2A capabilities
2. POST /a2a handles task/create and task/status
3. GET /aip/status, /aip/resolve, and /aip/verify are all live
4. aip-discover, aip-resolve, and aip-delegate tools are available to agents
5. npm run register-aip writes the on-chain registry entry

api.syraa.fun/aip/status`,

  metrics: `How much of AIP is actually wired in.

7 A2A capabilities. 4 AIP standards. x402 commerce underneath stays unchanged.

The Agent Card is generated from more than 26 x402 resources. The A2A server reuses Syra's existing tool executor. did:aip verification happens before payment.

api.syraa.fun/aip/status`,

  featured: `Discovery is not duplicated work.

Syra's Agent Card and its x402 discovery both read from the same catalog of more than 26 resources. Capabilities and pricing only have to be defined once.

api.syraa.fun/.well-known/agent.json`,

  comparison: `Custom tool calls were the only handshake.

Before, agents could only reach Syra through POST /agent/tools/call, with no standard agent-to-agent protocol. Now Syra offers an Agent Card, an A2A JSON-RPC interface, and did:aip verification, all backed by the same brain.

api.syraa.fun/.well-known/agent.json`,

  launch: `Syra and the Agent Internet Protocol are live together.

Agent Card discovery, A2A tasks, and did:aip identity are open standards for the agentic web. Syra now implements all three.

api.syraa.fun/.well-known/agent.json
aipagents.xyz`,

  deepDive: `Where AIP lives in Syra's codebase.

api/libs/aipAgentCard.js builds the Agent Card from the x402 catalog. api/routes/a2a/index.js runs the JSON-RPC 2.0 server. api/libs/aipDidClient.js wraps the did:aip resolver. api/libs/aipClient.js handles discover, resolve, and delegate calls. scripts/register-aip-agent.js writes the on-chain registry entry.

api.syraa.fun/.well-known/agent.json`,

  split: `AIP sits on top of Syra's broader agent stack.

x402 handles multi-chain USDC commerce. 8004 and SAID cover agent identity registries. AIP adds discovery, tasks, and did:aip identity. Brain, Syra's orchestrator, can delegate work out to AIP specialists.

docs.syraa.fun`,

  terminal: `Two real calls against Syra's AIP surface.

Fetching /.well-known/agent.json returns a did:aip identifier, the A2A endpoint, and a list of capabilities. Checking /aip/status confirms the agent is registered with its did:aip identifier attached.

api.syraa.fun/aip/status`,

  cta: `Syra speaks AIP.

Fetch the Agent Card, resolve a did:aip identifier, or submit an A2A task from the playground.

api.syraa.fun/.well-known/agent.json
aipagents.xyz
api.syraa.fun/aip/status`,
};
