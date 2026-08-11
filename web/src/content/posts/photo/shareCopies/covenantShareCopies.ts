import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Covenant photo deck. Proof-first, no meta card talk. */
export const COVENANT_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Syra now plugs into Covenant's agent-native operating system.

Covenant supplies signed grants (permission slips with a budget) and a sandboxed runtime. Syra supplies machine money and intelligence APIs that agents call under those grants. Audit receipts sit on both sides.

opencovenant.org`,

  thesis: `Agents need an operating system, not just a pile of APIs.

Every framework has been rebuilding identity, permissions, memory, and settlement from scratch. Covenant provides eight host-level primitives through its covenantd daemon. Syra sells intelligence on top through x402 (pay only when you call), so an agent pays per call and both sides keep a verifiable receipt.

opencovenant.org`,

  quote: `x402 sets the price, Covenant sets the authority.

Covenant owns the agent-native OS layer. Syra owns machine money. An agent dispatches under a signed grant, settles USDC (digital dollars) per call, and both systems log an audit trail for the same action.

api.syraa.fun/skill.md`,

  flow: `Grant, pay, then receipt.

1. covenantd issues a signed capability grant with a budget scope
2. The agent calls Syra through MCP or a direct x402 API, and its wallet settles USDC per call
3. Sentiment, market data, or another signal comes back to the agent process
4. Covenant logs the audit entry, and Syra logs the x402 settlement trace

api.syraa.fun/skill.md`,

  timeline: `Syra became a commerce layer that Covenant agents can call.

1. Syra MCP exposed more than 100 x402 tools for covenantd-run agents
2. skill.md published at api.syraa.fun/skill.md for agent discovery
3. Covenant capability grants now gate which Syra routes an agent is allowed to call
4. Both sides keep an audit trail: Covenant's append-only log and Syra's x402 receipts

opencovenant.org`,

  pillars: `Four layers make one agent-native stack.

covenantd is the host daemon running the eight OS primitives. Syra MCP is the agent-facing tool layer, covering x402 intelligence, market data, and swaps. Settlement is USDC per call over x402 on Solana. Audit sits on both sides, with a Covenant log and Syra settlement receipts.

docs.opencovenant.org`,

  checklist: `Covenant and Syra are live today.

1. Syra MCP server is reachable by covenantd-run agents
2. skill.md is published at api.syraa.fun/skill.md
3. x402 checkout works under Covenant capability grants
4. Audit receipts line up with entries in the Covenant ledger
5. SAID identity and Pact refund coverage keep working unchanged

api.syraa.fun/skill.md`,

  metrics: `Covenant and Syra each bring a concrete surface.

8 OS primitives. 100+ Syra x402 tools. HTTP 402 for pay per call.

Covenant gives agents a governed operating layer. Syra gives them machine money. Build on Covenant, pay for intelligence on Syra.

opencovenant.org`,

  featured: `Eight primitives, one commerce rail.

Intent, runtime, memory, identity, permissions, comms, compositor, and settlement all live at the host level under Covenant. Syra sits above that as the x402 commerce layer agents call for intelligence.

docs.opencovenant.org`,

  comparison: `Building an agent used to mean rebuilding the OS yourself.

Before, every agent app rebuilt identity, permissions, and payment from scratch. Now Covenant provides the OS layer and Syra provides the machine money rail. Integrate once, then pay per call.

opencovenant.org`,

  launch: `Syra and Covenant are live together.

Covenant is open infrastructure for agent-native computing: signed grants, a sandboxed runtime, and x402 machine money running through the same stack as Syra's intelligence APIs.

opencovenant.org
docs.opencovenant.org`,

  deepDive: `Where Syra plugs into Covenant.

covenantd is the Rust daemon running the eight OS primitives. Syra MCP handles agent tool dispatch over x402. skill.md at api.syraa.fun gives agents a discovery document. Covenant capability grants scope which Syra routes an agent can call. Settlement receipts line up with Covenant's own audit log.

docs.opencovenant.org`,

  split: `OS, commerce, trust, and recourse sit in the same stack.

Covenant handles governed execution: identity, permissions, and runtime. Syra handles x402 intelligence and agent wallets. SAID adds verified on-chain identity. Pact adds automatic refund coverage on x402 payments. AgentScore adds compliance gates.

api.syraa.fun/skill.md`,

  terminal: `A Covenant agent can dispatch a call to Syra.

The agent runs an intent dispatch against syra-sentiment under a trading-research grant, passing a symbol as a parameter. That triggers an x402 checkout from the agent wallet. Sentiment and signal data come back. The exchange is logged as a receipt in the Covenant ledger.

opencovenant.org`,

  cta: `An agent-native OS meets machine money.

Install covenantd, connect it to Syra MCP, and agents can pay per call under signed capability grants.

opencovenant.org
docs.opencovenant.org
api.syraa.fun/skill.md`,
};
