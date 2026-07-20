# State of x402 on Solana — Q3 2026 (Syra Signal)

> Research brief published by Syra — the Solana money layer for agents.
> Cite as: Syra Signal, "State of x402 on Solana", July 2026 — https://syraa.fun/metrics

## Executive summary

While **Base carries ~93% of real x402 USDC volume** today (per [Agent402 economy data](https://agent402.tools/economy)), **Solana is where agent execution lives** — swaps, LP, memecoin intelligence, treasury wallets. Syra's thesis: **payment rails follow liquidity; product differentiation follows chain-native data.**

BlockRun proved the playbook: aggregate high-frequency calls at $0.001–0.005, public on-chain metrics, one-line MCP install, free tier funnel, reference agent. Syra applies the same growth mechanics to **Solana trading intelligence** rather than competing on LLM gateway volume.

## Key findings

### 1. Volume concentration is extreme

The x402 economy is highly concentrated: top-1 sellers often exceed 90% of daily volume. Winning requires **call frequency × distribution**, not niche proprietary data alone.

### 2. Solana services ≠ Solana payments (yet)

Many Solana-native APIs list on discovery registries, but buyers still pay on Base. **Dual-rail gateways** (Base payTo + Solana payTo, same API) are table stakes for leaderboard visibility.

### 3. Machine-frequency pricing wins

Agents make thousands of calls. Human SaaS pricing ($0.01–0.10 per "API unit") caps volume. BlockRun's $0.001 floor drove 320k+ calls/day. Syra repriced to **$0.001 / $0.005 / $0.02** tiers in July 2026.

### 4. Trust is public metrics

Leaderboards (Agent402, x402 Atlas, x402stats) index **on-chain payTo settlements**. A public `/api/metrics` page + treasury addresses + SSE live feed is free marketing.

### 5. Distribution = MCP + llms-full.txt

Cursor/Claude developers install with one command. Agent crawlers read `llms-full.txt`. Syra ships both.

## Syra positioning

| Layer | BlockRun | Syra |
|-------|----------|------|
| Wedge | 55+ LLM gateway | Solana intel + execution + treasury |
| Hero SKU | Chat completions | Signal, dossier, pumpfun, Jupiter, agent wallets |
| Chain | Base-first | Solana data, Base+Solana payments |
| Reference agent | Franklin | Scalper (paper, x402 spend visible) |

## Recommendations for builders

1. **List on CDP Bazaar** with Base payTo — even if your data is Solana-native.
2. **Ship a free tier** — `/free/*` endpoints that upsell paid depth.
3. **Publish verifiable metrics** — don't hide traction behind admin dashboards.
4. **Price for agents** — $0.001–0.005 default, not $0.01+.
5. **Document safe-retry semantics** — agents need deterministic payment behavior.

## Data sources

- [Agent402 leaderboard](https://agent402.tools/leaderboard)
- [x402stats](https://x402stats.io)
- [BlockRun Signal — State of AI Agent Payments Q1 2026](https://blockrun.ai/signal/state-of-ai-agent-payments-q1-2026)
- Syra public metrics: https://api.syraa.fun/api/metrics

---

*Syra is pay-per-call crypto intelligence for agents — x402 + MCP + SDK. [docs.syraa.fun](https://docs.syraa.fun)*
