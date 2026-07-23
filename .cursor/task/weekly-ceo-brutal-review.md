# Weekly CEO brutal review

**Purpose:** End-of-week multi-hat review — keep / change / kill — and lock **exactly three** outcomes for next week.

**Cadence:** Weekly (Friday after standup) · **Time box:** ~60–90 minutes

**Personas:** `@.cursor/rules/ceo-review.mdc` (primary)

**Invoke:** `@.cursor/task/weekly-ceo-brutal-review.md run this task`

## Auto context (Agent does this — do not ask the user)

1. Week-ending date = today; fetch full `/api/metrics`.
2. Discover what shipped: `git log --since="7 days ago" --oneline` (or equivalent).
3. Read `docs/MACHINE_MONEY_STRATEGY.md`, `docs/AGENT_BUILDER_GTM.md`, `docs/SYRA_TOKEN_LIQUIDITY_LISTING_KOL_CHECKLIST.md`.
4. Read `.cursor/task/state/last-standup.json` and prior `last-ceo-week.json` if present — check whether last week’s 3 outcomes were met (honest unknown if no evidence).
5. Write updated `last-ceo-week.json` at the end.

## The Prompt

```
@.cursor/rules/ceo-review.mdc

Act as CEO running a brutal weekly board review of Syra. Truth over feelings. Solo founder capacity is the constraint.

AUTO-CONTEXT (do not ask me to fill placeholders):
1. Week ending = today’s date from system/user_info.
2. Fetch GET https://api.syraa.fun/api/metrics. Build a hard snapshot: paid calls 7d, unique payers 7d, funnel, settlement, buyback, rewards, holders.
3. Discover shipped work via git log --since="7 days ago" --oneline (and status). Summarize facts — call out if my memory would be wrong.
4. Read docs/MACHINE_MONEY_STRATEGY.md, docs/AGENT_BUILDER_GTM.md, docs/SYRA_TOKEN_LIQUIDITY_LISTING_KOL_CHECKLIST.md.
5. Read .cursor/task/state/last-ceo-week.json and last-standup.json if present. Grade last week’s 3 outcomes as met / missed / unknown with evidence.
6. After the review, WRITE .cursor/task/state/last-ceo-week.json with weekEnding, outcomes (the new 3), scorecard, killList, metricsSnapshot (schema in state/README.md).

Then run the full ceo-review template:
1. Multi-hat pass (CEO, CTO, Lead Eng, PM, Growth, Investor).
2. Decision challenges table (≥5 bets: five-pillar UI, Telegram, token GTM, experiment desks, MCP focus, buyback visibility, etc.) → keep / change / kill.
3. Kill immediately / change next week / double down / do not touch yet.
4. Scorecard 1–10 no inflation.
5. Next week mandate: ONLY 3 measurable outcomes.

Output format (strict):
### Executive verdict
### Business understanding (1 paragraph)
### Multi-hat review
### Decisions challenged (table)
### What should change
### Brutal truths (5–8 sentences, evidence-linked)
### Scorecard
### Last week outcomes grade
### This week: 3 outcomes only
### State
- confirmed last-ceo-week.json updated
```

## Expected output

- Harsh, evidence-linked review
- Keep/change/kill table
- Exactly three next-week outcomes
- `last-ceo-week.json` written

## Guardrails

- No motivational speaker mode.
- If activation is flat, kill token-led busywork.
- Residual unknowns labeled (“I don’t know — falsify by…”).

## One next action

Monday’s standup should treat the 3 outcomes as the mandate; refuse work that does not serve them.
