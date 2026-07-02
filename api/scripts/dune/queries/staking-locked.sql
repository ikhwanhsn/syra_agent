-- Approximate SYRA locked via Streamflow (on-chain proxy).
-- Active lock registry in the Syra app remains the source of truth.
WITH streamflow_transfers AS (
    SELECT
        block_time,
        action,
        amount_display,
        from_owner,
        to_owner
    FROM tokens_solana.transfers
    WHERE token_mint_address = '{{SYRA_MINT}}'
      AND outer_executing_account = '{{STREAMFLOW_PROGRAM_ID}}'
      AND amount_display > 0
),

daily AS (
    SELECT
        DATE_TRUNC('day', block_time) AS day,
        SUM(amount_display) FILTER (
            WHERE action IN ('transfer', 'mintTo')
        ) AS gross_inflow,
        SUM(amount_display) FILTER (
            WHERE action IN ('burn', 'transfer')
              AND from_owner IS NOT NULL
        ) AS gross_outflow,
        COUNT(DISTINCT from_owner) FILTER (
            WHERE action IN ('transfer', 'mintTo')
        ) AS unique_lockers
    FROM streamflow_transfers
    GROUP BY 1
)

SELECT
    day,
    gross_inflow,
    gross_outflow,
    gross_inflow - gross_outflow AS net_flow,
    SUM(gross_inflow - gross_outflow) OVER (ORDER BY day) AS cumulative_net_locked,
    100.0 * SUM(gross_inflow - gross_outflow) OVER (ORDER BY day)
        / CAST({{TOTAL_SUPPLY}} AS DOUBLE) AS pct_supply_locked,
    unique_lockers
FROM daily
ORDER BY day
