# Daily growth standup

**Purpose:** Pull live traction, compare to the last auto-saved baseline, pick the **one** highest-leverage action for today.

**Cadence:** Daily (Mon–Fri), first thing · **Time box:** ~15–25 minutes

**Personas:** `@.cursor/rules/growth-marketing.mdc` · `@.cursor/rules/data-analytics.mdc`

**Invoke:** `@.cursor/task/daily-growth-standup.md run this task`

## Auto context (Agent does this — do not ask the user)

1. Resolve **today’s date** (system / user_info).
2. `GET https://api.syraa.fun/api/metrics` (tools).
3. Read `.cursor/task/state/last-standup.json` if present; else treat as first run.
4. Skim `docs/MACHINE_MONEY_STRATEGY.md` kill list / ICP only if needed for the recommendation.

## The Prompt

```
@.cursor/rules/growth-marketing.mdc @.cursor/rules/data-analytics.mdc @.cursor/task/state/README.md

You are my daily growth operator for Syra (machine money / x402 pay-per-call APIs).

AUTO-CONTEXT (do not ask me to fill placeholders):
1. Set Date = today from system/user_info.
2. Fetch GET https://api.syraa.fun/api/metrics with tools. Quote real fields: northStar, last7d, funnel, settlement, buyback, rewards, holders.current.
3. Read .cursor/task/state/last-standup.json if it exists. Diff today’s key fields vs that file. If missing, say "baseline established" and skip fake deltas.
4. Optionally skim docs/MACHINE_MONEY_STRATEGY.md for ICP/kill list.

Then:
1. Identify the single biggest bottleneck: activation (402→paid / D7) vs settlement health vs distribution (attention) vs token loop visibility (buyback empty / rewards unfunded).
2. Propose exactly ONE action I can finish in ≤2 hours today. Prefer: fix activation friction, publish proof with a real Solscan/metrics number, close a design-partner paid call, or fund/claim rewards epoch — not new pillars or vanity UI.
3. List what NOT to do today (max 3).
4. WRITE/UPDATE .cursor/task/state/last-standup.json with today’s snapshot + the oneAction and bottleneck you chose (schema in state/README.md).

Output format (strict):
### Metrics snapshot
- table of key fields (today)
### Delta vs last baseline
### Bottleneck
- one sentence
### Today's ONE action
- what / why / how (steps) / done-when
### Do not do
- bullets
### Kill criteria
- if this action fails, what signal means stop and switch
### State
- confirmed last-standup.json updated (or created)
```

## Expected output

- Live metrics quoted from `/api/metrics`
- One named action with steps and done-when
- `last-standup.json` created/updated on disk

## Guardrails

- No invented metrics. If fetch fails, say so; do not invent a baseline.
- Do not recommend token-led homepage GTM or unshipped governance/APY claims.
- Do not expand scope into multi-day rewrites.

## One next action

After the Agent replies: **execute the ONE action** (or schedule the 2-hour block). Tomorrow’s standup will auto-diff against today’s state file.
