# Machine Money for Agents — Growth Strategy

**Brand:** Machine Money for Agents  
**Live wedge:** Pay-per-call crypto APIs over x402 (Spend)  
**Capital assumption:** Bootstrap now, position to raise seed / Series A within 6–12 months  
**North star (now):** Weekly paid API calls + unique paying wallets  
**North star (later):** Agent-managed capital (GMV) with platform take rate

---

## Positioning

> For agent builders who need crypto intelligence and capital actions without per-vendor API keys, Syra is **machine money for agents** — Earn, Treasury, Invest, Spend, and Grow on Solana. Unlike DIY vendor wiring or chat-only agents, Syra settles USDC on HTTP 402 and exposes the same rails via MCP and a typed SDK.

**Public honesty rule:** Always lead with what is Live. Never imply all five pillars ship at the same maturity.

---

## Pillar status ladder

| Pillar | Status | What is real today | Graduation criteria (→ Live) |
|--------|--------|--------------------|------------------------------|
| **Spend** | **Live** | x402-priced routes, MCP/SDK, marketplace | — (already Live) |
| **Invest** | **Beta** | Marinade/Jito deposits; partner tools (Giza/Jupiter); `positions` stub | Real positions + SDK `deposit`; measured deposit volume |
| **Earn** | **Beta** | Skills x402 to creators; payout stub; prompt attribution dead | On-chain creator payouts; prompt attribution wired from settlement |
| **Treasury** | **Infra** | Policy engine + wallet broker; no productized `/treasury` API | Public allocate/policy API with enforced caps; agent UX |
| **Grow** | **Roadmap** | Heuristic recommendations; mostly non-executable | Executable strategies with measured edge + fee |

Discovery: `GET /pillars` on [api.syraa.fun](https://api.syraa.fun) includes a `status` field per pillar.

---

## Path to a $1B company (honest sequence)

1. **Wedge (now–12 months):** Become the default pay-per-call crypto intel layer for agents (Spend GMV + retention).
2. **Platform (12–24 months):** Agent wallets + treasury policy as sticky infra; Earn creators settle on-chain.
3. **Capital layer (24–36 months):** Take rate on Invest/Grow GMV (agent-managed capital), not only API markup.
4. **Category (36+ months):** “Machine money” as the default economic OS for agents — defendable via volume, settlement trust, and agent install habit.

**Falsifiers:** Activation stays gated forever; weekly paid callers flat after focused GTM; agents prefer calling Birdeye/Nansen direct.

---

## Unit economics (sketch)

| Stream | Mechanism | Scales? |
|--------|-----------|---------|
| Spend markup | Upstream × ~1.2 (passthrough) or × ~1.4 (media/chat floors) | Yes — with volume; thin moat without DX |
| Jupiter referral | ~100 bps default | Yes with swap GMV |
| Invest/Grow take | Not productized yet | Primary path to capital-scale AUM fees |
| $SYRA buyback | ~80% of settled Spend revenue | Narrative / token; **do not lead GTM** |

Cost floor: upstream API keys, RPC, settlement facilitators, infra. Price so first paid call is cheap enough to activate ($0.001–$0.02 tiers).

---

## 30 / 90 / 365 roadmap

### 30 days — Fix the core loop

| Outcome | Builds | Owner |
|---------|--------|--------|
| Settlement trustworthy | Facilitator credits/gas ops; settle_failed alerts; settled-only metrics | Eng / Ops |
| Stranger completes first paid call in &lt;10 min | Canonical MCP quickstart + funding steps | Product / DevRel |
| Funnel is measurable | First 402 → first paid → D7 repeat on KPI + public metrics | Eng |
| One brand story | Machine Money + pillar status everywhere | Product |
| Proof line public | Weekly **settled** paid calls + unique payers on home (`/`) | Eng / Growth |
| Agent GTM | [docs/AGENT_BUILDER_GTM.md](./AGENT_BUILDER_GTM.md) — MCP/SDK only | Growth |
| Telegram hold | [docs/TELEGRAM_MAINTENANCE_POLICY.md](./TELEGRAM_MAINTENANCE_POLICY.md) | Product |

**Risk if skipped:** Marketing burns attention into a broken activation gate.  
**Ops runbook:** [api/docs/CELO_FACILITATOR_OPS.md](../api/docs/CELO_FACILITATOR_OPS.md)

### 90 days — Prove retention and wedge

| Outcome | Builds | Owner |
|---------|--------|--------|
| Invest beta → near-Live | Real `/invest/positions` + SDK `deposit` | Eng |
| Earn honest | On-chain payout rail; wire `promptId` attribution | Eng |
| Activation unlock | Starter credits / capped demo payer (optional) | Eng / Product |
| Distribution | 3 design-partner agents + case studies; MCP/hackathon presence | Growth / DevRel |
| Retention | Spend receipts, budgets, agent-actionable 402 errors | Eng |

**Kill criteria:** If weekly paid callers do not trend up after activation + focused GTM, stop adding pillars and re-open the activation hypothesis.

### 1 year — Platform + raise narrative

| Outcome | Builds |
|---------|--------|
| Treasury productized | Enforce allocations; public policy API |
| Grow executable | Strategies with measured edge + fee |
| Capital GMV | Take rate on agent-managed capital |
| Raise readiness | Traction pack (see checklist below) |

---

## Metrics

| Stage | Metric |
|-------|--------|
| Awareness | Docs / marketplace visits, MCP config installs (proxy: first MCP-sourced call) |
| Activation | First `payment_required` → first `paid` conversion per payer |
| Revenue | Weekly paid calls, USDC settled |
| Retention | D7 repeat paying wallets |
| Later | Agent-managed capital (GMV), take rate |

Public proof: [syraa.fun](https://syraa.fun) (growth home) · JSON: `GET /api/metrics` · Agent: [syraa.fun/agent](https://syraa.fun/agent)

---

## Fundraise readiness checklist (bootstrap → raise)

Gather before pitching:

- [ ] Clear weekly paid-call and unique-payer trend (4+ weeks)
- [ ] Documented time-to-first-paid-call &lt;10 minutes (recorded once)
- [ ] ≥3 design-partner agents with public or shared usage
- [ ] Payment correctness (idempotency, settlement verify) audited enough for diligence
- [ ] Honest pillar statuses (no vapor in the deck)
- [ ] Unit economics: gross margin after upstream costs
- [ ] Kill list honored (no multi-brand distraction in the pitch)

**Use of funds (when raised):** payment/security hardening, DevRel, 1–2 platform engineers — not vanity surfaces.

---

## Kill / defer list

| Kill / defer | Why |
|--------------|-----|
| New settlement chains beyond what’s wired | Dilutes focus; Solana/Base enough |
| Self-serve provider marketplace | Demand side first |
| Token-led growth / buyback as primary CTA | Wrong ICP; dilutes product story |
| Multi-brand distraction outside Syra | This repo is Syra-only; keep GTM on Spend activation |
| Trading-bot heritage as hero CTA | Off-path for Machine Money |
| Telegram as primary acquisition | Secondary until settlement + payer growth ungate — see TELEGRAM_MAINTENANCE_POLICY.md |
| Waitlist / email as activation | Not a paid-call rail; starve vs MCP GTM |
| Shipping Grow as “optimizer” before edge exists | Trust risk |
| Rewriting the monorepo | Activation & measurement first |

---

## Focus

This repository ships **Syra only** — x402 Spend wedge, MCP/SDK distribution, agent wallets, and honest pillar maturity. External products live in separate repos and are out of GTM scope here.

---

## References in repo

- Brand modules: `web/src/lib/syraBranding.ts`, `api/config/syraBranding.js`, `documentation/src/content/syraBrand.ts`
- Pillars: `api/config/pillars.js` · `GET /pillars`
- Quickstart: `web` marketplace Integrate tab · docs MCP/SDK
- Metrics: `api/libs/publicMetricsService.js` · `GET /api/metrics` · `GET /analytics/kpi`
- Settlement ops: `api/docs/CELO_FACILITATOR_OPS.md` · `api/libs/settleFailedMonitor.js`
- Agent GTM: `docs/AGENT_BUILDER_GTM.md`
- Telegram hold: `docs/TELEGRAM_MAINTENANCE_POLICY.md`
