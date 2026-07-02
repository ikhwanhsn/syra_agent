-- Syra Token Overview KPIs
-- Mint: {{SYRA_MINT}}

WITH syra_trades AS (
    SELECT *
    FROM dex_solana.trades
    WHERE token_bought_mint_address = '{{SYRA_MINT}}'
       OR token_sold_mint_address = '{{SYRA_MINT}}'
),

price_from_oracle AS (
    SELECT price AS price_usd
    FROM prices.day
    WHERE blockchain = 'solana'
      AND contract_address = from_base58('{{SYRA_MINT}}')
    ORDER BY timestamp DESC
    LIMIT 1
),

price_from_trades AS (
    SELECT
        SUM(amount_usd) / NULLIF(
            SUM(
                CASE
                    WHEN token_bought_mint_address = '{{SYRA_MINT}}' THEN token_bought_amount
                    WHEN token_sold_mint_address = '{{SYRA_MINT}}' THEN token_sold_amount
                    ELSE 0
                END
            ),
            0
        ) AS price_usd
    FROM syra_trades
    WHERE block_time >= NOW() - INTERVAL '7' DAY
),

latest_price AS (
    SELECT COALESCE(
        (SELECT price_usd FROM price_from_oracle),
        (SELECT price_usd FROM price_from_trades),
        0
    ) AS price_usd
),

volume_stats AS (
    SELECT
        COALESCE(SUM(CASE WHEN block_time >= NOW() - INTERVAL '1' DAY THEN amount_usd END), 0) AS volume_24h_usd,
        COALESCE(SUM(CASE WHEN block_time >= NOW() - INTERVAL '7' DAY THEN amount_usd END), 0) AS volume_7d_usd,
        COALESCE(SUM(amount_usd), 0) AS volume_all_time_usd
    FROM syra_trades
),

holder_stats AS (
    SELECT COUNT(DISTINCT address) AS total_holders
    FROM solana_utils.latest_balances
    WHERE token_mint_address = '{{SYRA_MINT}}'
      AND token_balance > 0
),

top10 AS (
    SELECT COALESCE(SUM(token_balance), 0) AS top10_balance
    FROM (
        SELECT token_balance
        FROM solana_utils.latest_balances
        WHERE token_mint_address = '{{SYRA_MINT}}'
          AND token_balance > 0
        ORDER BY token_balance DESC
        LIMIT 10
    )
)

SELECT
    lp.price_usd,
    lp.price_usd * CAST({{TOTAL_SUPPLY}} AS DOUBLE) AS fdv_usd,
    vs.volume_24h_usd,
    vs.volume_7d_usd,
    vs.volume_all_time_usd,
    hs.total_holders,
    100.0 * t.top10_balance / CAST({{TOTAL_SUPPLY}} AS DOUBLE) AS top10_concentration_pct
FROM latest_price lp
CROSS JOIN volume_stats vs
CROSS JOIN holder_stats hs
CROSS JOIN top10 t
