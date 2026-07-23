# Syra daily growth tasks

Repeatable Cursor prompts for a solo founder. **No placeholders to fill** — the Agent auto-resolves date, live metrics, git history, and a local baseline.

These prompts compound what already ships: public buyback proof (`/token`, `GET /api/metrics`), usage rewards (`/rewards`), holder/staker x402 discounts, MCP/SDK activation. They do **not** restart the product from zero.

## How to invoke (zero fill)

**Fastest:** in a new Agent chat, type:

```
@.cursor/task/daily-growth-standup.md run this task
```

Or for the day’s focused task (see cadence below):

```
@.cursor/task/activation-doctor.md run this task
```

**Alternate:** open the `.md`, copy the fenced block under **The Prompt**, paste into Agent — still no fill-in required.

The Agent must:

1. Set **today’s date** from the system clock (or user_info).
2. **Fetch** `GET https://api.syraa.fun/api/metrics` with tools.
3. **Read/write** `.cursor/task/state/` for baselines (see below).
4. **Discover** context from the repo (`docs/`, git log/status, related files) — never ask you to paste numbers first.
5. End with **one** highest-leverage action.

Optional: add one sentence of human context after the @ mention (e.g. “blocked on wallet funding”). Never required.

## Auto state (baselines)

| File | Written by | Used for |
| --- | --- | --- |
| [state/last-standup.json](state/last-standup.json) | `daily-growth-standup` | Day-over-day metric delta |
| [state/last-ceo-week.json](state/last-ceo-week.json) | `weekly-ceo-brutal-review` | Week-over-week mandate check |
| [state/README.md](state/README.md) | — | Schema / rules |

If a state file is missing, the Agent creates it from today’s fetch and says “baseline established.”

## North-star metrics (watch these)

Pull live: `GET https://api.syraa.fun/api/metrics`

| Metric | Field | Why |
| --- | --- | --- |
| Paid calls (7d) | `northStar.paidCallsLast7d` / `last7d.calls` | Product demand |
| Unique paying wallets (7d) | `northStar.uniquePayingWalletsLast7d` | Retention of payers |
| USDC settled (7d / lifetime) | `last7d.usdSettled` / `lifetime.totalUsdSettled` | GMV |
| Buyback USD spent | `buyback.totalBuybackUsdSpent` | Token accrual proof |
| $SYRA acquired / treasury | `buyback.totalSyraAcquired` / `buyback.treasurySyraBalance` | Inventory for rewards |
| Reward earners | `rewards.uniqueEarners` | Closed loop |
| Settlement fail rate | `settlement.last24h.settleFailRate` | Trust / activation blocker |
| Holder funnel | `holders.current` + `holders.history7d` | Market structure (not a promise) |

If paying wallets are flat for 2 weeks: fix activation before more token posts.

## Weekly cadence

| Day | First (always) | Then (focused) | Time box |
| --- | --- | --- | --- |
| **Mon** | [daily-growth-standup](daily-growth-standup.md) | [activation-doctor](activation-doctor.md) | ~45–60m |
| **Tue** | daily-growth-standup | [token-marketcap-operator](token-marketcap-operator.md) | ~45–60m |
| **Wed** | daily-growth-standup | [product-prioritization](product-prioritization.md) | ~45–60m |
| **Thu** | daily-growth-standup | [payments-security-audit](payments-security-audit.md) *or* [codebase-health-sweep](codebase-health-sweep.md) (alternate weeks) | ~45–90m |
| **Fri** | daily-growth-standup | [weekly-ceo-brutal-review](weekly-ceo-brutal-review.md) | ~60–90m |
| **Any day something ships** | — | [ship-log-proof-post](ship-log-proof-post.md) | ~30–45m |
| **Weekly (pick a slot)** | — | [revenue-pricing-tune](revenue-pricing-tune.md) | ~45m |

**Auto day pick:** if you only `@.cursor/task/README.md run today’s growth tasks`, the Agent uses the calendar weekday to run standup + the focused task for that day.

## Prompt index

| File | Cadence | Purpose |
| --- | --- | --- |
| [daily-growth-standup.md](daily-growth-standup.md) | Daily | Metrics delta → one highest-leverage action today |
| [activation-doctor.md](activation-doctor.md) | Weekly (Mon) | Cut time-to-first-paid-call friction |
| [token-marketcap-operator.md](token-marketcap-operator.md) | Weekly (Tue) | Buyback/rewards proof + one distribution checklist item |
| [ship-log-proof-post.md](ship-log-proof-post.md) | On ship | Proof-driven X ship log (real number or Solscan) |
| [product-prioritization.md](product-prioritization.md) | Weekly (Wed) | RICE / kill list for the week |
| [codebase-health-sweep.md](codebase-health-sweep.md) | Weekly | One safe cleanup (dead code / coupling) |
| [payments-security-audit.md](payments-security-audit.md) | Weekly | x402 / treasury / rewards / secrets spot-check |
| [revenue-pricing-tune.md](revenue-pricing-tune.md) | Weekly | Unit economics + price/discount tiers |
| [weekly-ceo-brutal-review.md](weekly-ceo-brutal-review.md) | Weekly (Fri) | Keep / change / kill + 3 outcomes next week |

## Shared guardrails (all prompts)

- **Repo truth only.** Cite files, routes, or live metrics. No invented traction.
- **No fake utility.** Governance voting, “10% revenue share,” guaranteed APY = roadmap or forbidden (see `.cursor/rules/legal-compliance.mdc`).
- **Product GTM stays paid-calls-first.** Token narrative rides verifiable buybacks/rewards — do not lead homepage GTM with “buy $SYRA.”
- **One action.** Every run ends with a single next move you can finish today.
- **Self-contained + auto-context.** Prompts work in a fresh chat; Agent fills date/metrics/git itself.
- **Propose before destructive edits** unless the user message already says `IMPLEMENT`.

## Related anchors

- Strategy: `docs/MACHINE_MONEY_STRATEGY.md`, `docs/AGENT_BUILDER_GTM.md`
- Token distribution checklist: `docs/SYRA_TOKEN_LIQUIDITY_LISTING_KOL_CHECKLIST.md`
- Live proof UI: `syraa.fun/`, `/token`, `/rewards`, `/marketplace`
- Personas: `.cursor/rules/*.mdc`
