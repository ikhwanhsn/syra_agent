# Agent builder GTM — distribution playbook

**ICP:** Agent builders (MCP hosts, SDK apps), not retail chat users.  
**Primary CTA:** Agents: `set up https://api.syraa.fun/skill.md`. Humans: install MCP → fund Solana USDC → `syra_consult` → `syra_spend_news` (~5 min).  
**North star:** Weekly settled paid calls + unique paying wallets (`outcome: paid` only).  
**Prerequisite:** Settlement health green (`settle_failed` rate &lt; 5% of attempts) — see [api/docs/CELO_FACILITATOR_OPS.md](../api/docs/CELO_FACILITATOR_OPS.md).

---

## Channels to run (high fit)

| Channel | Hypothesis | Success metric | Kill after |
|---------|------------|----------------|------------|
| Dev content | “First paid Syra call in 5 minutes” thread / doc drives installs | MCP-sourced paid calls; first-paid conversions | 4 weeks flat |
| X (crypto + AI builders) | Working curl + settle receipt &gt; hype | Unique payers / week | 4 weeks flat |
| npm / GitHub | `@syra-ai/mcp-server` discoverability | Weekly downloads + first paid | 8 weeks |
| MCP host listings | Cursor / Claude directory presence | Config installs → paid | 8 weeks |
| Hackathons (x402 / Celo / Base) | Design partners from events | ≥3 agents with repeat paid | Per event |

## Channels to starve

- Waitlist / email newsletter campaigns (newsletter UI is not an activation rail)
- Broad paid social without builder targeting
- Telegram as hero CTA or TG ads
- Token-led / trading-bot heritage as primary story

---

## Design partners (target: 3+)

Track in this table; replace placeholders as partners onboard. CEO outcome #2: ≥1 net-new non-founder `mcpPaidCalls`, or ≥3 partners with logged contact + reply status.

**Trending chase (2026-08-20):** OpenClaw (**active**) · Nevermined (**piloting**, code shipped) · Cloudflare. Full scopes: [TRENDING_PARTNER_INTEGRATIONS.md](./TRENDING_PARTNER_INTEGRATIONS.md).

| # | Partner / agent | Surface (MCP/SDK) | contactedAt | replyStatus | First paid date | D7 repeat | Notes |
|---|-----------------|-------------------|-------------|-------------|-----------------|-----------|-------|
| 1 | Ampersend / Edge & Node (catalog) | Marketplace listing → agent discovery | 2026-08-13 | sent | | | Catalog email sent via `npm run register-ampersend` → `ampersend@edgeandnode.com` + `ampersend/catalog-registration.json` (53 Base x402 endpoints). Awaiting list confirmation. |
| 2 | MCP host builder (Cursor / Claude Desktop integrator) | MCP → `syra_spend_news` | 2026-08-13 | awaiting_founder_send | | | Paste-ready DM below. Ask one paid call from **their** Solana USDC wallet (not founder/treasury). |
| 3 | x402 / Celo builders cohort agent | MCP or SDK first paid | 2026-08-13 | awaiting_founder_send | | | Paste-ready DM below. Same ask: their-wallet `syra_spend_news` in ~5 min. |
| 4 | Cloudflare Agents / Monetization Gateway | Agents SDK `@x402/fetch` → Syra `/news` (Base) | 2026-08-20 | awaiting_founder_send | | | **Docs shipped.** Quickstart + `/docs/build/cloudflare-agents-x402`. Agent = payer; Syra = merchant. Monetization Gateway deferred. Send outreach from TRENDING_PARTNER_INTEGRATIONS.md. |
| 5 | OpenClaw | `openclaw mcp set` → `@syra-ai/mcp-server` | 2026-08-20 | awaiting_founder_send | | | **Active chase.** Quickstart shipped: [OPENCLAW_MCP_QUICKSTART.md](./OPENCLAW_MCP_QUICKSTART.md) · https://docs.syraa.fun/docs/build/openclaw. Paste-ready outreach in TRENDING_PARTNER_INTEGRATIONS.md. |
| 6 | Nevermined | `GET /partners/nevermined/news` (credits) | 2026-08-20 | awaiting_env | | | **Piloting.** SDK path shipped (not Exact failover). Quickstart: [NEVERMINED_X402_QUICKSTART.md](./NEVERMINED_X402_QUICKSTART.md). Set `NEVERMINED_X402_ENABLED` + `NVM_*` for sandbox traffic. |

Recruit via: hackathon winners, MCP host communities, inbound from marketplace Integrate, Cloudflare Agents / OpenClaw / Nevermined channels.

### Outreach drafts (2026-08-13)

**Ampersend (done):** subject `Catalog listing request: Syra x402 APIs (Base mainnet, 53 endpoints)` → `ampersend@edgeandnode.com`. Body from `buildCatalogEmailBody` in `api/scripts/registerAmpersendMarketplace.js`; attachment `ampersend/catalog-registration.json`.

**DM #2 — MCP host builder** (paste into X/Discord/email to a real MCP host human):

```
Hey — Syra is live pay-per-call crypto intel for agents (x402 + MCP).

If you host MCP tools for builders: install @syra-ai/mcp-server, fund Solana USDC, run syra_spend_news once from your wallet (~5 min). Docs: https://docs.syraa.fun

Goal is one external paid receipt, not a demo from our side. Happy to unblock config if anything 402s. Settlement is green today.
```

**DM #3 — x402 / Celo cohort builder**:

```
Building on x402 / Celo agent rails? Syra settles USDC on HTTP 402 for crypto news + insights (MCP + SDK).

Ask: one syra_spend_news paid call from your wallet so we can log a non-founder mcpPaidCall. Path: https://docs.syraa.fun · https://syraa.fun/marketplace

No token pitch — just a real settle receipt. I can pair on the first call if useful.
```

### Outreach drafts (2026-08-20) — trending partners

Paste-ready copy + proof line for **Cloudflare** (send first), **OpenClaw**, and **Nevermined**: [TRENDING_PARTNER_INTEGRATIONS.md](./TRENDING_PARTNER_INTEGRATIONS.md).

**Proof line (settled only, 2026-08-20):** last 7d 47,127 paid calls · $6,645.65 settled · 111 unique wallets; lifetime $15,776.12 · 129 wallets; 24h settle fail 1.29%. https://syraa.fun

When you send a DM, flip that row’s `replyStatus` to `sent` (then `replied` / `no-reply`). Do not count founder/treasury self-probes as outcome #2.

---

## Content skeleton (ship weekly)

1. **Thread / post:** Install one-liner → fund wallet → `syra_spend_news` → paste settle receipt + link to [syraa.fun](https://syraa.fun) settled metrics  
2. **Doc:** Keep README / BuildMcp / marketplace Integrate steps identical (no drift)  
3. **Proof:** Quote **settled** USD and unique payers only — never sum of all `amountUsd` on 402 logs  

---

## Endpoint focus for GTM demos

Lead with proven Spend paths: `/news`, `/insights/volatility-index`, `/insights/market-pulse`, `/insights/defi-tvl`. Do not demo every discovery route equally.

---

## Kill criteria

If weekly unique paying wallets are flat **after** settlement fix + 4 weeks of this GTM → reopen activation (starter credits / capped demo payer) before adding Invest/Earn/Grow scope.
