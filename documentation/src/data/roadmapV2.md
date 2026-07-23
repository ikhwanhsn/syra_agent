# Roadmap

**Syra** — **pay-per-call crypto intelligence for agents on Solana.**

Live GTM is **Spend (x402)** + MCP/SDK. Earn, Treasury, Invest, and Grow are **platform roadmap** modules on the same rails — discover via `GET /pillars`.

| Module | What it means | Status |
|--------|----------------|--------|
| **Spend** | x402 pay-per-call APIs, marketplace, SDK, and MCP | **Live GTM** |
| **Earn** | Agents monetize skills, prompts, and creator attribution | Roadmap / shipping |
| **Treasury** | Wallets, billing caps, allocation, and policy | Shipping |
| **Invest** | Policy-gated deployment — Giza, LP, Jupiter, RISE, and more | Shipping |
| **Grow** | Yield routing and portfolio optimization (analysis-first) | Shipping |

**Live today:** [api.syraa.fun](https://api.syraa.fun) · [syraa.fun/marketplace](https://syraa.fun/marketplace) · [syraa.fun/wallet](https://syraa.fun/wallet) · [docs.syraa.fun](https://docs.syraa.fun)

Shipped milestones are tracked in the [Changelog](/docs/changelog). The quarters below are **directional** — priorities may shift with x402 ecosystem growth and community feedback.

**North-star metrics:** paid x402 calls per day · unique paying agents · time-to-first-paid-call

---

## Shipped foundations (2025 — H1 2026)

### Spend (x402)

- x402 payment rail on Solana and Base (MPP, Tempo where applicable)
- 200+ paid API routes — intelligence, market data, and partner gateways
- **API Marketplace** — browse Core vs Partners, per-route detail pages, agent manifests, Integrate (SDK/MCP) and Custom tester tabs
- Data-provider routes: DexScreener, GeckoTerminal, DefiLlama, RugCheck, Pyth Hermes
- `@syra-ai/sdk`, `@syra-ai/mcp-server`, `@syra-ai/x402-payer`
- Public discovery: `GET /.well-known/x402`, OpenAPI catalogs, x402scan listing

### Treasury

- Agent wallets (Privy), spend dashboard, and billing visibility
- Policy-gated execution — separate caps for chat, LP, and trading flows

### Invest

- Giza yield, Meteora LP, Jupiter quotes, RISE reads — policy-gated reference integrations
- Trading experiment API, scalper lab, and scout proof surfaces

### Earn

- Skills marketplace groundwork (x402 skills, agent registries)
- Purch Vault x402 paths and skill-marketplace groundwork

### Grow

- Assets board, token dossier, Bitcoin hub, equity and SPCX intelligence
- Syra Brain multi-tool synthesis (`/brain`)

---

## Q3 2026 — In progress

### Spend

- Expand **Partners** catalog — more external data providers and branded gateway groups
- Marketplace search, filtering, and agent-manifest quality for autonomous discovery
- ~~Staking-linked x402 discounts~~ **Shipped** — hold/stake tiers in `resolveEffectivePriceUsdAsync`

### Treasury

- Fiat → stablecoin onramp (MoonPay / Privy funding) for faster agent wallet funding
- Richer policy engine — per-tool budgets, daily caps, and operator alerts

### Invest

- Deeper Meteora LP and Jupiter execution paths with clearer pre-trade risk context
- RISE scout and market intelligence as Invest/Spend surfaces (`/rise`)

### Earn

- Creator payout attribution on Syra rails
- Expanded skill listings via Purch Vault and agent registries (8004)

### Grow

- Portfolio recommendations that combine on-chain positions with x402 intelligence calls
- Public metrics and treasury transparency (`/metrics`, analytics dashboard)

---

## Q4 2026 — Planned

### Spend

- Enterprise / white-label x402 gateway tier with custom SLAs
- Cross-chain Spend expansion (additional EVM networks beyond Base)
- x402 Intelligence Grant Program for agent builders

### Treasury

- Multi-agent treasury rooms — shared caps, roles, and audit exports
- Institutional custody integrations (scoped partnerships)

### Invest

- Multi-strategy portfolio optimization API (analysis-first, policy-gated execution)
- Historical backtesting and strategy experiment exports

### Earn

- Agent reputation and performance leaderboard (opt-in, verifiable on-chain stats)
- Revenue-share templates for skill authors and data partners

### Grow

- Explainable decision endpoints — structured rationale alongside signals
- Compliance-aware intelligence modules for regulated verticals

---

## 2027 — Directional

- **Agent collaboration protocols** — composable multi-agent workflows with shared treasury
- **Cross-agent learning flywheel** — anonymized outcome data improving default policies
- **Traditional markets expansion** — forex, commodities, and tokenized equities context
- **Scale target:** 1,000+ autonomous agents with positive unit economics on the Syra rail
- **Token loop:** x402 revenue → `$SYRA` buyback held for community airdrops and ecosystem grants

---

> **Token utility**  
> Agents pay for APIs with USDC via x402. **Live:** holder/staker fee discounts, production buybacks (~80% → Jupiter), usage rewards (`/rewards`), public proof on `/token` and `GET /api/metrics`. **Roadmap:** governance voting. See [Tokenomics](/docs/token/tokenomics).
>
> This roadmap is subject to change based on market conditions, x402 ecosystem evolution, and community feedback.
