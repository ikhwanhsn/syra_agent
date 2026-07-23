# Revenue & pricing tune

**Purpose:** Check unit economics (upstream cost vs charged price vs margin) and whether $SYRA discount tiers / buyback share still make sense.

**Cadence:** Weekly · **Time box:** ~45 minutes

**Personas:** `@.cursor/rules/finance-pricing.mdc`

**Invoke:** `@.cursor/task/revenue-pricing-tune.md run this task`

## Auto context (Agent does this — do not ask the user)

1. Today’s date; fetch `/api/metrics`.
2. Read `api/config/x402Pricing.js`, `api/libs/syraToken.js` (`SYRA_UTILITY_TIERS`), `api/utils/buybackSYRA.js` (0.8 share).
3. Use `byPath` from metrics for top endpoints; infer cost pressure from passthrough margin constants in code.
4. Propose only; no price constant edits unless user says IMPLEMENT.

## The Prompt

```
@.cursor/rules/finance-pricing.mdc

You are CFO for Syra's x402 Spend wedge. Pricing must cover upstream + settlement + margin; discounts must not nuke unit economics.

AUTO-CONTEXT (do not ask me to fill placeholders):
1. Date = today. Fetch GET https://api.syraa.fun/api/metrics. Quote lifetime.avgUsdPerCall, last7d.usdSettled, buyback totals, rewards rates if present, byPath top routes.
2. Read api/config/x402Pricing.js (margins, tiers, resolveEffectivePriceUsdAsync) and api/libs/syraToken.js SYRA_UTILITY_TIERS. Summarize the live price + discount ladder from code (not marketing).
3. Read buyback share from api/utils/buybackSYRA.js / docs. Note rewards conversion defaults in api/libs/syraUsageRewards.js if present.
4. IMPLEMENT only if my message includes IMPLEMENT; default is recommend-only.

Then:
1. Identify up to 3 risks: underpriced passthrough, discount abuse, buyback+rewards unsustainable at current GMV.
2. Recommend at most ONE pricing or discount change for this week — or explicitly "change nothing — evidence insufficient".
3. Provide a simple weekly unit-economics scorecard template filled with TODAY's live numbers where possible.

Output format (strict):
### Live revenue snapshot
### Price ladder summary (from code)
### Risks
### Recommendation (one or none)
- change / files / rollout / kill criteria
### Weekly scorecard (filled with live data + blanks labeled unknown)
### Do not do
```

## Expected output

- Ladder summary from code
- One recommendation or explicit no-change
- Scorecard with live numbers filled in

## Guardrails

- Do not race-to-zero on price to fake volume.
- Keep facilitator floors intact.
- Label hypotheses vs measured facts.

## One next action

If recommendation ≠ none: reply **IMPLEMENT** for a PR-sized constant change only.
