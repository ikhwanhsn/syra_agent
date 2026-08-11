# Agent state (auto)

The Agent reads and updates these files so **you never paste yesterday’s metrics**.

## Files

### `last-run.json` — Orchestrator (every `/growth`)

```json
{
  "date": "2026-08-11",
  "updatedAt": "2026-08-11T12:00:00.000Z",
  "source": "https://api.syraa.fun/api/metrics",
  "mode": "daily",
  "weekday": "Tue",
  "routedAgents": ["token-marketcap"],
  "northStar": {
    "paidCallsLast7d": 0,
    "uniquePayingWalletsLast7d": 0
  },
  "last7d": { "calls": 0, "usdSettled": 0 },
  "buyback": {
    "totalBuybackUsdSpent": 0,
    "totalSyraAcquired": 0,
    "treasurySyraBalance": null,
    "lastBuybackSignature": null
  },
  "rewards": { "uniqueEarners": 0, "totalClaimableSyra": 0, "totalClaimedSyra": 0 },
  "settlement": { "settleFailRate24h": null },
  "oneAction": "short description of the action chosen that day",
  "bottleneck": "activation|settlement|distribution|token-loop|pricing|product|experiments|reliability|proof-gap"
}
```

### `last-ceo-week.json` — Friday board review

```json
{
  "weekEnding": "2026-08-07",
  "updatedAt": "2026-08-07T12:00:00.000Z",
  "outcomes": ["outcome 1", "outcome 2", "outcome 3"],
  "scorecard": {},
  "killList": [],
  "metricsSnapshot": {}
}
```

### Per-division snapshots

Written when that division runs (directly or via orchestrator). If missing, create after the run.

| File | Written by |
| --- | --- |
| `last-activation.json` | activation |
| `last-distribution.json` | distribution |
| `last-content.json` | content-proof |
| `last-token.json` | token-marketcap |
| `last-revenue.json` | revenue-pricing |
| `last-product.json` | product |
| `last-experiments.json` | profit-experiments |
| `last-payments.json` | payments-security |
| `last-platform.json` | platform-health |
| `last-hire.json` | hire (Bench) |

Minimum shape for each:

```json
{
  "date": "2026-08-11",
  "updatedAt": "2026-08-11T12:00:00.000Z",
  "oneAction": "…",
  "notes": "optional short diagnosis"
}
```

Divisions may add extra fields (loop health, RICE winner, findings count, etc.). Never invent metric numbers.

## Rules for the Agent

1. If the file is missing → create it after fetching live metrics; say “baseline established.”
2. Never invent numbers — only write fields present in the API response (or null).
3. Do not commit secrets. These JSON files are metrics snapshots only.
4. Prefer updating state with the Write tool at the end of the run.
5. Orchestrator always updates `last-run.json`. Routed divisions also update their own `last-<slug>.json`.
