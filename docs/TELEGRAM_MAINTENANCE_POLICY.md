# Telegram bot — maintenance policy

**Status:** Secondary consumer surface. Keep running; do **not** treat as ICP acquisition.

## Ungate criteria (all required before TG growth work)

1. `settle_failed / (paid + settle_failed)` &lt; **5%** over a rolling 7d window (`GET /api/metrics` → `settlement.last7d`)
2. Unique paying wallets / week trending **up** for **2 consecutive weeks** (settled `outcome: paid`)

Until then:

| Allowed | Blocked |
|---------|---------|
| P0 bugfixes | Acquisition campaigns / TG ads |
| Wallet deposit clarity | Viral loops / heavy onboarding redesign |
| Security fixes | New trading modes as hero features |
| Digests / referrals as-is | Homepage or README hero CTA |

## Resource cap

Engineering time on Telegram &lt; **10%** of eng weeks spent on settlement + MCP activation until ungate criteria hit.

## Product placement

- Docs: under “Use Syra” only — not primary Build path  
- Homepage: no Telegram hero  
- GTM: see [AGENT_BUILDER_GTM.md](./AGENT_BUILDER_GTM.md) (starve TG ads)

Code lives under `api/libs/syraTelegramBot/` — same Spend tools as web/MCP via custodial AgentWallet.
