import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Yield.xyz discovery photo deck. */
export const YIELD_XYZ_INTEGRATION_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Syra × Yield.xyz is live for yield discovery.

Agents can search 3,000+ onchain opportunities across 80+ networks: lending, vaults, staking, RWAs, and liquid staking. Eight Invest tools. Pay per call.

syraa.fun`,

  thesis: `Yield is fragmented by design.

Every protocol has its own app and risk profile. Yield.xyz aggregates thousands of opportunities. Syra wraps that catalog so agents can search, compare, and diligence in one paid path instead of stitching dashboards.

syraa.fun`,

  quote: `Find the yield. Check the risk. Then decide.

Agents get structured discovery and diligence through Syra. This release is read-only: no deposit or withdraw tools yet.

syraa.fun`,

  flow: `The call path is four steps.

1. Search with yield-find by token, network, or type
2. Diligence with yield-get, yield-risk, and history tools
3. Pay per call with x402 USDC or the agent wallet
4. Track a wallet with yield-balances on a chosen network

syraa.fun`,

  timeline: `What shipped with the Yield.xyz integration.

1. A Yield AgentKit MCP bridge was added for discovery and diligence
2. Eight agent tools were registered under the Invest pillar
3. Curated MCP tools are named syra_invest_yield_*
4. Enter, exit, and rebalance stay out of scope for this release

syraa.fun`,

  pillars: `What users actually get from this release.

Find filters thousands of yields by token and network. Risk returns a letter grade and score. History covers reward rate and TVL trends. Balances show positions and claimable rewards for a wallet.

syraa.fun`,

  checklist: `What ships with Yield.xyz discovery.

1. yield-find, yield-get, yield-networks, and yield-providers are registered
2. yield-risk, yield-reward-history, and yield-tvl-history cover diligence
3. yield-balances tracks wallet positions and pending actions
4. Curated MCP tools are named syra_invest_yield_*
5. Read-only scope: no enter or exit transactions in this release

syraa.fun`,

  metrics: `Coverage numbers for the release.

Over 3,000 opportunities. More than 80 networks. Eight agent tools live under Invest. Agents get cross-chain yield search without building per-protocol clients.

syraa.fun`,

  featured: `Yield discovery is now inside Syra for agents.

Search once across chains, then diligence with risk and history before committing capital. Pay per call.

syraa.fun`,

  comparison: `Single-protocol browsing vs one Syra ask.

Before, agents juggled separate apps for Aave, Lido, vaults, and RWAs. Now yield-find returns a filtered list across networks, and risk plus history tools help compare candidates in the same loop.

syraa.fun`,

  launch: `Yield.xyz discovery is live inside Syra.

Eight Invest tools cover search, metadata, networks, providers, risk, reward history, TVL history, and wallet balances. Paid through the existing Syra x402 path.

syraa.fun
docs.yield.xyz`,

  deepDive: `What sits under the integration.

Syra calls Yield.xyz AgentKit over MCP. Free allowance first, then Base USDC x402 when needed. Agents pay Syra per call. Transaction building for enter and exit stays deferred until discovery proves useful.

syraa.fun`,

  split: `How Yield.xyz pairs with the rest of Syra.

Use yield-find and yield-get for research. Use yield-risk and history before sizing. Use yield-balances to track what a wallet already holds. From there, the same agent can move into other Invest or Spend tools to act.

syraa.fun`,

  terminal: `A real request path for Yield discovery.

MCP syra_invest_yield_find with token USDC and network base returns ranked opportunities. The same surface is available as yield-find through POST /agent/tools/call.

syraa.fun`,

  cta: `Ask Syra for better yields.

Try yield-find on USDC Base or ETH staking. Discovery and diligence only. Syra does not build or broadcast deposit transactions in this release.

syraa.fun/chat
docs.yield.xyz`,
};
