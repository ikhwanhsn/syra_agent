-- Daily SYRA DEX volume: buys vs sells
SELECT
    DATE_TRUNC('day', block_time) AS day,
    SUM(CASE WHEN token_bought_mint_address = '{{SYRA_MINT}}' THEN amount_usd ELSE 0 END) AS buy_volume_usd,
    SUM(CASE WHEN token_sold_mint_address = '{{SYRA_MINT}}' THEN amount_usd ELSE 0 END) AS sell_volume_usd,
    SUM(amount_usd) AS total_volume_usd,
    COUNT(*) AS trade_count,
    COUNT(CASE WHEN token_bought_mint_address = '{{SYRA_MINT}}' THEN 1 END) AS buy_count,
    COUNT(CASE WHEN token_sold_mint_address = '{{SYRA_MINT}}' THEN 1 END) AS sell_count
FROM dex_solana.trades
WHERE (
    token_bought_mint_address = '{{SYRA_MINT}}'
    OR token_sold_mint_address = '{{SYRA_MINT}}'
)
  AND block_time >= NOW() - INTERVAL '90' DAY
GROUP BY 1
ORDER BY 1
