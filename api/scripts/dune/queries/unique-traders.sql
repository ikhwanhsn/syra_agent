-- Daily unique wallets trading SYRA
SELECT
    DATE_TRUNC('day', block_time) AS day,
    COUNT(DISTINCT trader_id) AS unique_traders
FROM dex_solana.trades
WHERE (
    token_bought_mint_address = '{{SYRA_MINT}}'
    OR token_sold_mint_address = '{{SYRA_MINT}}'
)
  AND block_time >= NOW() - INTERVAL '90' DAY
GROUP BY 1
ORDER BY 1
