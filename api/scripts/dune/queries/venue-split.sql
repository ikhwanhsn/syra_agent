-- SYRA volume by DEX venue (project)
SELECT
    DATE_TRUNC('day', block_time) AS day,
    project,
    SUM(amount_usd) AS volume_usd,
    COUNT(*) AS trade_count
FROM dex_solana.trades
WHERE (
    token_bought_mint_address = '{{SYRA_MINT}}'
    OR token_sold_mint_address = '{{SYRA_MINT}}'
)
  AND block_time >= NOW() - INTERVAL '90' DAY
GROUP BY 1, 2
ORDER BY 1, 3 DESC
