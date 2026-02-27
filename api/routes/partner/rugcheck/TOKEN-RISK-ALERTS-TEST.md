# Token risk alerts endpoint – MCP test results

**Goal:** Verify if `/token-risk/alerts?rugScoreMin=80` is feasible using current `/token-report` and `/token-statistic` (via Syra API / MCP).

**Date:** 2026-02-09

---

## 1. Token statistic (MCP: `syra_v2_token_statistic`)

- **rugcheck/new_tokens:** Array of tokens with `mint`, `decimals`, `symbol`, `creator`, etc. **No rug/risk score** in list items.
- **rugcheck/recent:** Has `score` per item — this is a **popularity/visits score** (e.g. 501, 601), not a rug risk score.
- **rugcheck/trending:** `mint`, `vote_count`, `up_count` only. **No risk score.**
- **rugcheck/verified:** `mint`, `payer`, `name`, `symbol`, `description`, etc. **No risk score.**

**Conclusion:** We cannot filter “high risk” tokens from token-statistic alone; the lists do not include rug/risk score.

---

## 2. Token report (MCP: `syra_v2_token_report`)

Per-token report includes:

- **`score`** — Raw risk score (e.g. `117601`, `501`, `1`).
- **`score_normalised`** — Normalised risk score (e.g. `80`, `16`, `0`). This is the right field for something like `rugScoreMin=80`.
- **`risks`** — Array of risk items (`name`, `level`, `score`, `description`).
- **`rugged`** — Boolean.

**Sample from MCP:**

| Mint (short) | score | score_normalised | Would match rugScoreMin=80? |
|--------------|-------|------------------|-----------------------------|
| So111...112 (wrapped SOL) | 1 | 0 | No |
| 8SL2M...NHx (AMERICA) | 117601 | **80** | Yes |
| 5TATk...pump (Gentlemen) | 501 | 16 | No |

---

## 3. Feasibility for `/token-risk/alerts?rugScoreMin=80`

**Yes, it is possible**, with this approach:

1. **Source of mints:** Call the same Rugcheck stats as token-statistic (e.g. `new_tokens`, `recent`, `trending`, or a subset). Take a bounded list of mint addresses (e.g. top 50–100).
2. **Get risk scores:** For each mint, call Rugcheck token report (your existing `/token-report` or Rugcheck `GET /v1/tokens/{id}/report`). Alternatively, if Rugcheck supports it, use **bulk** report/summary to reduce calls.
3. **Filter:** Keep tokens where `data.score_normalised >= rugScoreMin` (e.g. 80). Optionally also filter by `data.rugged === true` or by `data.risks.length > 0`.
4. **Response:** Return the filtered list as “alerts” (e.g. array of `{ mint, score, score_normalised, risks, ... }` or minimal `{ mint, score_normalised }`).

**Query param:** `rugScoreMin=80` should be applied against **`score_normalised`** (0–100), not the raw `score`.

**Caveats:**

- N token-report calls per request (or 1 bulk call if available) — consider rate limits and pricing.
- Cap the number of mints evaluated per request to control cost/latency.

---

## 4. MCP calls used (testing only)

- `mcp_syra_syra_v2_token_statistic` — inspected structure of new_tokens, recent, trending, verified.
- `mcp_syra_syra_v2_token_report` with:
  - `So11111111111111111111111111111111111111112`
  - `8SL2M7Y18eNxtZQTC7vdKUKAfgav7sqr7fxpxufXZNHx`
  - `5TATk16oMrt4vsMR8WwQ9AtiPeosdJhXFkp2UhGJpump`

No endpoint was created; this file only records that the data and flow above are sufficient to implement the alerts endpoint when you are ready.
