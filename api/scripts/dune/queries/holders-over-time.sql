-- Historical SYRA holder count (wallets with balance > 0)
SELECT
    DATE_TRUNC('day', day) AS day,
    COUNT(DISTINCT address) AS holder_count
FROM solana_utils.daily_balances
WHERE token_mint_address = '{{SYRA_MINT}}'
  AND token_balance > 0
GROUP BY 1
ORDER BY 1
