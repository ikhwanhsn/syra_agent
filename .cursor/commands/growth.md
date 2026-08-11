# growth

Run today’s Syra growth org (no placeholders).

Default = daily Helix (orchestrator). If the user said `week` or weekday is Friday → board review.

1. Read `.cursor/agents/ORG.md` (cadence, overrides, guardrails).
2. Resolve weekday + ISO week from system/user_info.
3. Run `.cursor/agents/orchestrator.md` fully (fetch `GET https://api.syraa.fun/api/metrics`, diff `.cursor/agents/state/last-run.json`, route, update state).
4. Daily: orchestrator spawns 1–2 division agents; each division spawns its micro-team. Week: board review + 3 outcomes.
5. Do not ask the user to fill metrics, dates, or baselines — use tools + `.cursor/agents/state/`.
6. Propose only unless the user message includes `IMPLEMENT`.
7. End with a single combined “do this next” action for the founder.

Direct a division instead of routing: `@.cursor/agents/<slug>.md run this`

| Name | Slug |
| --- | --- |
| Spark | activation |
| Beacon | distribution |
| Chronicle | content-proof |
| Mint | token-marketcap |
| Ledger | revenue-pricing |
| Compass | product |
| Wager | profit-experiments |
| Sentinel | payments-security |
| Keel | platform-health |
| Bench | hire |
