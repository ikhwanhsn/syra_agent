-- Daily volume-weighted average SYRA price (USD)
SELECT
    DATE_TRUNC('day', block_time) AS day,
    SUM(amount_usd) / NULLIF(
        SUM(
            CASE
                WHEN token_bought_mint_address = '{{SYRA_MINT}}' THEN token_bought_amount
                WHEN token_sold_mint_address = '{{SYRA_MINT}}' THEN token_sold_amount
                ELSE 0
            END
        ),
        0
    ) AS vwap_price_usd,
    SUM(amount_usd) AS volume_usd
FROM dex_solana.trades
WHERE (
    token_bought_mint_address = '{{SYRA_MINT}}'
    OR token_sold_mint_address = '{{SYRA_MINT}}'
)
  AND block_time >= NOW() - INTERVAL '90' DAY
GROUP BY 1
ORDER BY 1
