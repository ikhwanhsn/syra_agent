-- Treasury SYRA buybacks (trader buys SYRA on DEX, typically USDC -> SYRA via Jupiter)
WITH buybacks AS (
    SELECT
        block_time,
        token_bought_amount AS syra_bought,
        amount_usd AS usd_spent,
        project,
        token_sold_symbol AS paid_with,
        tx_id
    FROM dex_solana.trades
    WHERE trader_id = '{{TREASURY_WALLET}}'
      AND token_bought_mint_address = '{{SYRA_MINT}}'
)

SELECT
    block_time,
    syra_bought,
    usd_spent,
    paid_with,
    project,
    tx_id,
    SUM(syra_bought) OVER (ORDER BY block_time) AS cumulative_syra_bought,
    SUM(usd_spent) OVER (ORDER BY block_time) AS cumulative_usd_spent
FROM buybacks
ORDER BY block_time DESC
