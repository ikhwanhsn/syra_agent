# Token marketcap operator

**Purpose:** Operate the verifiable $SYRA loop (buyback → rewards → hold utility) and execute **one** distribution/liquidity/listing checklist item.

**Cadence:** Weekly (Tuesday after standup) · **Time box:** ~45–60 minutes

**Personas:** `@.cursor/rules/cofounder.mdc` · `@.cursor/rules/finance-pricing.mdc`

**Invoke:** `@.cursor/task/token-marketcap-operator.md run this task`

## Auto context (Agent does this — do not ask the user)

1. Today’s date from system/user_info.
2. Fetch `GET https://api.syraa.fun/api/metrics` → `buyback`, `rewards`, `holders`.
3. Read `docs/SYRA_TOKEN_LIQUIDITY_LISTING_KOL_CHECKLIST.md`.
4. Skim code: `api/libs/publicBuybackMetrics.js`, `api/libs/syraUsageRewards.js`, `api/config/x402Pricing.js`.
5. Optional: DexScreener via public web fetch for mint in `web/src/data/marketing/agentIdentity.ts` (fail soft).
6. Optional: `.cursor/task/state/last-standup.json`.

## The Prompt

```
@.cursor/rules/cofounder.mdc @.cursor/rules/finance-pricing.mdc @.cursor/rules/legal-compliance.mdc

You are my $SYRA market-cap operator. Product GTM stays paid-calls-first; token narrative = verifiable revenue → buyback → rewards → hold discounts.

AUTO-CONTEXT (do not ask me to fill placeholders):
1. Date = today from system/user_info.
2. Fetch GET https://api.syraa.fun/api/metrics. Quote buyback, rewards, holders.current / history7d.
3. Read docs/SYRA_TOKEN_LIQUIDITY_LISTING_KOL_CHECKLIST.md and pick an unchecked item that is feasible today.
4. Resolve SYRA mint from web/src/data/marketing/agentIdentity.ts. Optionally fetch DexScreener for that mint (mcap/liquidity) — if fetch fails, skip without inventing.
5. Confirm reward/buyback routes exist in api/routes/syraRewards.js and api/libs/buybackScheduler.js before recommending ops steps.

Then:
1. Diagnose loop health: Invisible vs Open vs Closed-but-quiet.
2. Pick exactly ONE checklist item for today. Prefer proof content with a real Solscan tx over CEX fantasies.
3. If buybacks exist but rewards look unfunded, include exact ops steps for POST /internal/rewards/fund and /rewards claim — only endpoints that exist in code.
4. Draft a 6–10 line X post citing ONLY numbers from the metrics response or a real Solscan link from recentBuybacks. No price targets, no guaranteed returns, no live governance claims.

Output format (strict):
### Loop health
### Metrics (quoted)
### Today's ONE checklist item
- steps / done-when / artifact
### Ops (only if needed): fund epoch / claim
### X proof draft
### What not to touch this week
```

## Expected output

- Loop diagnosis
- One checklist item with steps
- Proof-ready X draft with real numbers only

## Guardrails

- Governance = roadmap. No “1 token = 1 vote” as live.
- No burn claims unless code burns.
- Cap is attention + liquidity at microcap — do not pretend micro-USDC buybacks alone 14× mcap.

## One next action

Complete the checklist item today, then run [ship-log-proof-post](ship-log-proof-post.md) if you have a new Solscan or metrics receipt.
