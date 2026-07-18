import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for TopLedger DeFi intelligence photo deck. 15 distinct topics. */
export const TOPLEDGER_DEFI_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `SHIP LOG · Syra ?- TopLedger DeFi intelligence is live.

Portfolio and Grow now show lending, perps, LP, staking, yield, and rewards across 20+ Solana protocols. Not just SPL balances.

? syraa.fun/wallet?view=portfolio`,

  thesis: `Token holdings are half the wallet story.

Kamino loans, Jupiter perps, Meteora LP, and staking were invisible in Syra Portfolio. TopLedger indexes 20+ protocols so operators see full net worth.`,

  quote: `"You cannot grow what you cannot measure in DeFi."

TopLedger brings lending health, LP value, pending rewards, and perps collateral into Syra Grow and Portfolio. One panel. Live USD.`,

  flow: `Full DeFi picture in 4 steps:

1. Connect on syraa.fun
2. Wallets ? Portfolio (or open Grow)
3. TopLedger analyze_wallet runs via treasury
4. DeFi panel shows lending, perps, LP, staking, yield, rewards

Agents: topledger-analyze-wallet via /agent/tools/call`,

  timeline: `TopLedger integration shipped end to end:

? defiPositionsService + Grow enrichment
? DeFi panel on Wallet Portfolio UI
? 9 agent tools (analyze, lending, perps, LP, staking, yield, rewards, DEX PnL)
? GET /topledger/wallet/* x402 routes
? MCP catalog + Ampersend listings`,

  pillars: `4 surfaces now DeFi-aware:

? Wallet Portfolio: DeFi positions panel + net worth
? Grow: lending risk + unclaimed reward signals
? Agent tools: 9 topledger-* x402 tools
? Public API: /topledger/wallet/analyze?wallet=`,

  checklist: `TopLedger ?- Syra. Verify it:

? Portfolio shows DeFi panel when positions exist
? Grow recommendations mention lending and rewards
? Agent tool topledger-analyze-wallet returns net worth
? GET /topledger/wallet/analyze returns 402 without payment
? MCP: syra_grow_topledger_analyze_wallet`,

  metrics: `Integration by the numbers:

? 20+ Solana DeFi protocols indexed
? 9 resellable agent tools
? ~$0.0004 MPP upstream per call
? 5 min cache for portfolio enrichment`,

  featured: `Before: SPL tokens only.
Now: full DeFi net worth.

Lending deposits and borrows. Perp collateral. LP positions. Staking. Yield vaults. Pending rewards. FIFO DEX PnL for agents.`,

  comparison: `Portfolio before vs after TopLedger:

Before: SPL holdings + USD prices. Kamino and Meteora positions required manual explorer checks.

After: DeFi breakdown panel, net worth includes lending/LP/staking, Grow flags unclaimed rewards and leverage risk.`,

  launch: `SHIP LOG · Syra ?- TopLedger is live.

Solana DeFi intelligence in Grow, Portfolio, and nine paid agent tools. MPP upstream. x402 resale. No TopLedger API key required for agents.

Try Portfolio ? syraa.fun/wallet?view=portfolio`,

  deepDive: `Technical surface:

? api/libs/topledgerClient.js: MPP / x402 client
? api/libs/defiPositionsService.js: analyze + cache
? api/routes/partner/topledger/: public x402 proxy
? 9 tools in agentTools.js + agentToolExecutor branch
? DefiPositionsPanel.tsx on Wallet Portfolio`,

  split: `Product depth + agent resale.

Operators see DeFi on Portfolio and Grow.
Agents pay per call via topledger-* tools or /topledger routes.
Treasury funds internal enrichment when AGENT_PRIVATE_KEY is set.`,

  terminal: `Agent tool call:

$ syra agent tools call \\
  --tool topledger-analyze-wallet \\
  --params '{"wallet":"..."}'

> total_net_worth_usd: 12450.22
> categories.lending.net_usd: 3200.00
> categories.lp_positions.value_usd: 890.50
> active_protocols: 7`,

  cta: `See your full Solana DeFi stack on Syra.

Open Portfolio for the DeFi panel. Agents: topledger-analyze-wallet.

? syraa.fun/wallet?view=portfolio
? api.topledger.xyz`,
};
