# Agent builder GTM — distribution playbook

**ICP:** Agent builders (MCP hosts, SDK apps), not retail chat users.  
**Primary CTA:** Install MCP → fund Solana USDC → `syra_spend_news` (~5 min).  
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

## Design partners (target: 3)

Track in this table; replace placeholders as partners onboard.

| # | Partner / agent | Surface (MCP/SDK) | First paid date | D7 repeat | Notes |
|---|-----------------|-------------------|-----------------|-----------|-------|
| 1 | _TBD_ | | | | |
| 2 | _TBD_ | | | | |
| 3 | _TBD_ | | | | |

Recruit via: hackathon winners, MCP host communities, inbound from marketplace Integrate.

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
