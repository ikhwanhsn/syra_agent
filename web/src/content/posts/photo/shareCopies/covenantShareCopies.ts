import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Covenant photo deck - 15 distinct topics. */
export const COVENANT_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `SHIP LOG · Syra × Covenant is live.

Open infrastructure for agent-native computing. Signed grants, audit receipts, and x402 machine money in one stack.

→ opencovenant.org`,

  thesis: `Every agent framework reinvents identity, permissions, and settlement.

Covenant provides eight host-level OS primitives via covenantd. Syra is the machine-money rail: pay-per-call intelligence over x402.

Together: governed agents with verifiable receipts.`,

  quote: `"402 for price. Covenant for authority."

Covenant owns the agent-native OS layer. Syra owns machine money. Agents dispatch under signed grants, pay USDC per call, and leave audit trails on both sides.

→ api.syraa.fun/skill.md`,

  flow: `How Syra × Covenant works:

1. covenantd issues signed capability grant
2. Agent calls Syra MCP or x402 API
3. USDC settles per call via agent wallet
4. Covenant audit + Syra receipt logged

Grant. Pay. Receipt.`,

  timeline: `What shipped in one integration pass:

→ Syra MCP exposed for Covenant-run agents
→ skill.md + x402 checkout under capability scope
→ Settlement receipts align with Covenant ledger
→ Full stack: Covenant OS + Syra x402 + SAID identity

Install covenantd. Point agents at Syra. Pay per call.`,

  pillars: `Four layers. One agent-native stack:

→ covenantd: Rust daemon, eight OS primitives
→ Syra MCP: 100+ x402 intelligence tools
→ Settlement: USDC per call on Solana
→ Audit: append-only receipts on both sides`,

  checklist: `Covenant × Syra is live today:

→ Syra MCP server for covenantd agents
→ skill.md at api.syraa.fun/skill.md
→ x402 checkout under capability grants
→ Audit receipts + settlement traces
→ SAID identity + Pact refunds unchanged

→ opencovenant.org`,

  metrics: `Covenant × Syra by the numbers:

→ 8 OS primitives (intent, runtime, memory, identity…)
→ 100+ x402 tools on Syra MCP
→ 402 pay-per-call unchanged
→ Dual audit trail per action

Stop reinventing the OS.`,

  featured: `Eight primitives. One money rail.

Covenant: identity, permissions, memory, runtime, settlement as host services. Syra: x402 USDC per call. No framework rebuilds payment from scratch.

→ docs.opencovenant.org`,

  comparison: `Before Covenant + Syra:
Each agent app rebuilt identity, permissions, and payment.

With Covenant + Syra:
Shared OS layer + shared machine-money rail.

Same agent brain. Governed execution. Pay per call.`,

  launch: `SHIP LOG · Syra × Covenant.

Open infrastructure for agent-native computing.

Signed grants · sandboxed runtime · x402 machine money · audit receipts.

→ opencovenant.org
→ docs.opencovenant.org`,

  deepDive: `Covenant integration under the hood:

→ covenantd daemon (Rust, 8 OS primitives)
→ Syra MCP server for agent tool dispatch
→ skill.md + x402 routes under capability scope
→ Settlement receipts align with Covenant audit
→ Compatible with SAID, Pact, AgentScore stack`,

  split: `Full agent-native stack on Syra:

→ Covenant: OS layer (identity, permissions, runtime)
→ Syra: x402 machine money + intelligence APIs
→ SAID: verified on-chain agent identity
→ Pact: automatic x402 refund coverage

OS + commerce + trust + recourse.`,

  terminal: `Connect a Covenant agent to Syra:

$ covenant intent dispatch syra-sentiment \\
  --grant trading-research \\
  --params '{"symbol":"SOL"}'

→ x402 checkout via agent wallet
→ Sentiment + signal returned
→ Audit receipt in Covenant ledger`,

  cta: `Agent-native OS meets machine money.

Install covenantd. Connect Syra MCP. Pay per call under signed grants.

→ opencovenant.org
→ docs.opencovenant.org
→ api.syraa.fun/skill.md`,
};
