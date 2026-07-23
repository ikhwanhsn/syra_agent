# Task state (auto)

The Agent reads and updates these files so **you never paste yesterday’s metrics**.

## Files

### `last-standup.json`

Written at the end of every successful `daily-growth-standup` run.

```json
{
  "date": "2026-07-23",
  "updatedAt": "2026-07-23T12:00:00.000Z",
  "source": "https://api.syraa.fun/api/metrics",
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
  "bottleneck": "activation|settlement|distribution|token-loop"
}
```

### `last-ceo-week.json`

Written at the end of `weekly-ceo-brutal-review`.

```json
{
  "weekEnding": "2026-07-25",
  "updatedAt": "2026-07-25T12:00:00.000Z",
  "outcomes": ["outcome 1", "outcome 2", "outcome 3"],
  "scorecard": {},
  "killList": [],
  "metricsSnapshot": {}
}
```

## Rules for the Agent

1. If the file is missing → create it after fetching live metrics; say “baseline established.”
2. Never invent numbers — only write fields present in the API response (or null).
3. Do not commit secrets. These JSON files are metrics snapshots only.
4. Prefer updating state with the Write tool at the end of the task run.
