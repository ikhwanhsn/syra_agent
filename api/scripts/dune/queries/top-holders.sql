-- Top 100 SYRA holders by current balance
SELECT
    address AS wallet,
    token_balance AS syra_balance,
    100.0 * token_balance / CAST({{TOTAL_SUPPLY}} AS DOUBLE) AS pct_of_supply,
    updated_at
FROM solana_utils.latest_balances
WHERE token_mint_address = '{{SYRA_MINT}}'
  AND token_balance > 0
ORDER BY token_balance DESC
LIMIT 100
