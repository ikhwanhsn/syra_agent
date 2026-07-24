import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Covenant photo deck - 15 distinct topics. */
export const COVENANT_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `This cover announces that Syra now plugs into Covenant's agent-native operating system.

The badge marks three pieces: the OS layer, x402, and audit trails. Covenant supplies signed grants and a sandboxed runtime, and Syra supplies the machine money and intelligence APIs that agents call under those grants.

opencovenant.org`,

  thesis: `This card states the problem Covenant solves: agents need an operating system, not just a pile of APIs.

Every framework has been rebuilding identity, permissions, memory, and settlement from scratch. Covenant provides eight host-level primitives through its covenantd daemon. Syra sells intelligence on top of that through x402, so an agent pays per call and both sides keep a verifiable receipt.

opencovenant.org`,

  quote: `The line on this card splits the responsibilities cleanly: x402 sets the price, Covenant sets the authority.

Covenant owns the agent-native OS layer. Syra owns the machine money. An agent dispatches under a signed grant, settles USDC per call, and both systems log an audit trail for the same action.

api.syraa.fun/skill.md`,

  flow: `This image walks the Covenant to Syra flow in four steps.

1. covenantd issues a signed capability grant with a budget scope
2. The agent calls Syra through MCP or a direct x402 API, and its wallet settles USDC per call
3. Sentiment, market data, or another signal comes back to the agent process
4. Covenant logs the audit entry, and Syra logs the x402 settlement trace

api.syraa.fun/skill.md`,

  timeline: `This timeline covers how Syra became a commerce layer that Covenant agents can call.

1. Syra MCP exposed more than 100 x402 tools for covenantd-run agents
2. skill.md published at api.syraa.fun/skill.md for agent discovery
3. Covenant's capability grants now gate which Syra routes an agent is allowed to call
4. Both sides keep an audit trail: Covenant's append-only log and Syra's x402 receipts

opencovenant.org`,

  pillars: `This bento layout shows the four layers of the combined stack.

covenantd is the host daemon running the eight OS primitives. Syra MCP is the agent-facing tool layer, covering x402 intelligence, market data, and swaps. Settlement happens in USDC per call over x402 on Solana. Audit sits on both sides, with a Covenant log and Syra's own settlement receipts.

docs.opencovenant.org`,

  checklist: `This checklist is what shipped with the Covenant integration.

1. Syra MCP server is reachable by covenantd-run agents
2. skill.md is published at api.syraa.fun/skill.md
3. x402 checkout now works under Covenant capability grants
4. Audit receipts line up with entries in the Covenant ledger
5. SAID identity and Pact refund coverage keep working unchanged

api.syraa.fun/skill.md`,

  metrics: `The numbers on this card describe the size of what Covenant and Syra each bring.

Covenant supplies eight OS primitives at the host level. Syra brings more than 100 x402 tools on top of that, and payment stays HTTP-native through the 402 status code on every call.

opencovenant.org`,

  featured: `This featured card narrows in on Covenant's eight primitives and where Syra fits.

Intent, runtime, memory, identity, permissions, comms, compositor, and settlement all live at the host level under Covenant. Syra sits above that as the x402 commerce layer agents call for intelligence.

docs.opencovenant.org`,

  comparison: `This before-and-after card compares building alone with building on Covenant and Syra together.

Before, every agent app rebuilt its own identity, permissions, and payment logic. Now, Covenant provides the OS layer and Syra provides the machine money rail, so a builder integrates once and pays per call from there.

opencovenant.org`,

  launch: `This partnership card marks Syra and Covenant as live together.

Covenant is open infrastructure for agent-native computing: signed grants, a sandboxed runtime, and x402 machine money running through the same stack as Syra's intelligence APIs.

opencovenant.org
docs.opencovenant.org`,

  deepDive: `This deep-dive card lists where Covenant and Syra connect in code.

covenantd is the Rust daemon running the eight OS primitives. Syra MCP handles agent tool dispatch over x402. skill.md at api.syraa.fun gives agents a discovery document. Covenant's capability grants scope which Syra routes an agent can call, and settlement receipts line up with Covenant's own audit log.

docs.opencovenant.org`,

  split: `This split card lays out four layers working together: OS, commerce, trust, and recourse.

Covenant handles governed execution: identity, permissions, and runtime. Syra handles x402 intelligence and agent wallets. SAID adds verified on-chain identity. Pact adds automatic refund coverage on top of x402 payments.

api.syraa.fun/skill.md`,

  terminal: `This terminal card shows a Covenant agent dispatching a call to Syra.

The agent runs an intent dispatch against syra-sentiment under a trading-research grant, passing a symbol as a parameter. That triggers an x402 checkout from the agent wallet, sentiment and signal data come back, and the exchange is logged as a receipt in the Covenant ledger.

opencovenant.org`,

  cta: `This closing card is the summary: an agent-native OS meets machine money.

Install covenantd, connect it to Syra MCP, and agents can pay per call under signed capability grants.

opencovenant.org
docs.opencovenant.org
api.syraa.fun/skill.md`,
};
