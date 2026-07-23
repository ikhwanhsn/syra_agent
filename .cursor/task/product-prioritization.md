# Product prioritization

**Purpose:** Force a weekly build / kill / defer decision so a solo founder does not drown in pillars and experiment desks.

**Cadence:** Weekly (Wednesday after standup) · **Time box:** ~45–60 minutes

**Personas:** `@.cursor/rules/product-strategy.mdc`

**Invoke:** `@.cursor/task/product-prioritization.md run this task`

## Auto context (Agent does this — do not ask the user)

1. Today’s date; fetch `/api/metrics`.
2. Read `docs/MACHINE_MONEY_STRATEGY.md`, `docs/AGENT_BUILDER_GTM.md`.
3. Discover candidates from: strategy 30-day list, `web/src/App.tsx` route sprawl, admin experiment routes, Telegram policy, open git changes.
4. Assume solo capacity ≈ 3 focused engineering days this week unless user message says otherwise.
5. Optional: `.cursor/task/state/last-ceo-week.json` outcomes + `last-standup.json` bottleneck.

## The Prompt

```
@.cursor/rules/product-strategy.mdc

You are CPO for Syra. Optimize for paid API activation and retention, not feature count.

AUTO-CONTEXT (do not ask me to fill placeholders):
1. Date = today. Fetch GET https://api.syraa.fun/api/metrics — state whether activation/settlement is healthy enough to expand surface area.
2. Read docs/MACHINE_MONEY_STRATEGY.md and docs/AGENT_BUILDER_GTM.md.
3. Inventory up to 8 candidate initiatives from those docs + repo signals (App.tsx routes, experiment pages, Telegram, token surfaces). Cite paths. Do not invent features that are not in repo/docs.
4. Read .cursor/task/state/last-ceo-week.json and last-standup.json if present — align with open outcomes/bottleneck.
5. Capacity default: 3 focused eng days this week (override only if user message specifies).

Then:
1. Score candidates with RICE. Be harsh on Confidence without evidence.
2. Kill list / ship-this-week (≤2) / defer.
3. For #1 ship item: one-paragraph PRD (problem, goal, non-goals, success metric, kill criteria, acceptance criteria).

Output format (strict):
### Traction gate
### Candidate table (RICE)
### Kill / Ship this week / Defer
### PRD for #1
### What I will ignore even if shiny
```

## Expected output

- RICE table
- Explicit kill list
- Mini-PRD for the single top ship item

## Guardrails

- Prefer activation and settlement correctness over new Earn/Grow theater.
- Token marketing is not a product initiative unless it unblocks proof/rewards ops.

## One next action

Open a focused Agent session and **only** implement ship-this-week #1 (or kill the top zombie).
