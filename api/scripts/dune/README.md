# Syra Dune Analytics

Public on-chain analytics for **$SYRA** on Solana, published to [Dune Analytics](https://dune.com).

| Field | Value |
|-------|-------|
| Mint | `8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump` |
| Decimals | 6 |
| Total supply | 1,000,000,000 SYRA |
| Chain | Solana mainnet |

## What gets tracked

| Section | Query | Chart type |
|---------|-------|------------|
| **Overview** | Token Overview KPIs | Counter / table (price, FDV, volume, holders, top-10 %) |
| **Trading** | Daily Trading Volume | Stacked bar (buy vs sell) |
| **Trading** | Daily Unique Traders | Line |
| **Trading** | Daily VWAP Price | Line |
| **Trading** | Volume by DEX Venue | Stacked bar by `project` |
| **Holders** | Holders Over Time | Area / line |
| **Holders** | Top 100 Holders | Table |
| **Staking** | Streamflow Locks (Approximate) | Line (cumulative locked) |
| **Treasury** | Treasury Buybacks | Table + cumulative line |

> **Staking note:** The Streamflow query is an on-chain proxy. The Syra app's Mongo-backed staking registry (`/staking/dashboard/operator-stats`) remains the source of truth for active locks.

## Prerequisites

1. **Dune account** with **Analyst plan or higher** (API query creation requires paid tier).
2. **API key** with **Read/Write** scope from [dune.com/settings/api](https://dune.com/settings/api).
3. **Treasury wallet** (public key) for buyback tracking — auto-derived from `AGENT_PRIVATE_KEY` if set.

## Environment

Add to `api/.env`:

```env
DUNE_API_KEY=your_dune_api_key_with_read_write_scope

# Optional overrides (defaults match production Syra config)
SYRA_TOKEN_MINT=8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump
SYRA_TREASURY_WALLET=   # or rely on AGENT_PRIVATE_KEY to derive pubkey
SYRA_TOTAL_SUPPLY=1000000000
DUNE_EXECUTION_PERFORMANCE=medium   # small | medium | large
```

Never commit `.env` or API keys.

## Publish queries (automated)

From the `api/` folder:

```bash
npm run publish:dune
```

Options:

```bash
npm run publish:dune -- --dry-run        # print actions without API calls
npm run publish:dune -- --no-validate    # skip execution validation
```

The script:

1. Reads SQL from `queries/*.sql`
2. Substitutes `{{SYRA_MINT}}`, `{{TREASURY_WALLET}}`, etc.
3. Creates or updates queries via `POST/PATCH https://api.dune.com/api/v1/query`
4. Executes each query to validate SQL against live Dune data
5. Saves query IDs to `queries.manifest.json` (idempotent re-runs)

## Build the dashboard (manual — Dune UI only)

The Dune API cannot create dashboards or visualizations. After `npm run publish:dune`:

### 1. Open your queries

Check `queries.manifest.json` for URLs, or search Dune for queries prefixed **"Syra /"**.

### 2. Create a new dashboard

1. Go to [dune.com](https://dune.com) → **New** → **Dashboard**
2. Name it **Syra Analytics**
3. Add a short description: *On-chain analytics for $SYRA on Solana — trading, holders, staking, treasury buybacks.*

### 3. Add visualizations (one per query)

For each query, open it → **New visualization** → pick the chart type below → **Add to dashboard**.

| Query | Visualization | Config |
|-------|---------------|--------|
| Token Overview KPIs | **Counter** (or Table) | One counter per column: `price_usd`, `fdv_usd`, `volume_24h_usd`, `volume_7d_usd`, `total_holders`, `top10_concentration_pct` |
| Daily Trading Volume | **Bar chart** | X: `day`, Y: `buy_volume_usd` + `sell_volume_usd` (stacked) |
| Daily Unique Traders | **Line chart** | X: `day`, Y: `unique_traders` |
| Daily VWAP Price | **Line chart** | X: `day`, Y: `vwap_price_usd` |
| Volume by DEX Venue | **Bar chart** | X: `day`, Y: `volume_usd`, Group by: `project` |
| Holders Over Time | **Area chart** | X: `day`, Y: `holder_count` |
| Top 100 Holders | **Table** | Columns: `wallet`, `syra_balance`, `pct_of_supply` |
| Streamflow Locks | **Line chart** | X: `day`, Y: `cumulative_net_locked` |
| Treasury Buybacks | **Table** + **Line** | Table: recent rows; Line: X: `block_time`, Y: `cumulative_syra_bought` |

### 4. Layout suggestion

```
Row 1:  [ Overview KPIs — 6 counters across full width ]
Row 2:  [ VWAP Price (2/3) ]  [ Unique Traders (1/3) ]
Row 3:  [ Trading Volume stacked bar — full width ]
Row 4:  [ Venue split (1/2) ]  [ Holders over time (1/2) ]
Row 5:  [ Top holders table (1/2) ]  [ Staking locked (1/2) ]
Row 6:  [ Treasury buybacks table — full width ]
```

### 5. Publish publicly

1. Dashboard → **Share** → set visibility to **Public**
2. Optional: add tags `syra`, `solana`, `memecoin`, `staking`
3. Link the dashboard URL from your Syra site / docs

### 6. Make queries public (optional)

Queries are created **private** by default. To share embeddable query links:

- Open each query → **Share** → **Public**

Or use the Dune API: `PATCH /v1/query/{id}/unprivate`

## Updating after code changes

Edit SQL in `queries/*.sql`, then re-run:

```bash
npm run publish:dune
```

Existing query IDs in `queries.manifest.json` are updated in place — dashboard visualizations refresh automatically on their schedule.

## Troubleshooting

| Error | Fix |
|-------|-----|
| `402 Payment Required` | Upgrade Dune plan to Analyst+ |
| `403 Forbidden` | Regenerate API key with **Read/Write** scope |
| `Invalid API Key` | Check `DUNE_API_KEY` in `api/.env` |
| Buybacks query empty | Set `SYRA_TREASURY_WALLET` or `AGENT_PRIVATE_KEY` |
| Staking numbers differ from app | Expected — use Syra staking admin for exact active locks |
| Query timeout on validation | Re-run with `DUNE_EXECUTION_PERFORMANCE=large` |

## File layout

```
api/scripts/dune/
├── config.mjs              # mint, treasury, query definitions
├── publishSyraDune.mjs     # API publish + validate script
├── queries.manifest.json   # persisted Dune query IDs
├── README.md               # this file
└── queries/
    ├── overview.sql
    ├── trading-volume.sql
    ├── unique-traders.sql
    ├── price-vwap.sql
    ├── venue-split.sql
    ├── holders-over-time.sql
    ├── top-holders.sql
    ├── staking-locked.sql
    └── buybacks.sql
```
