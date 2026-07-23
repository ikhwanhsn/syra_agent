# Celo facilitator ops — settlement first

Syra Labs Celo is **facilitator-only** (Track 2). Self-settle stays off so settlements count toward Dune `x402_*`. When `settle_failed` spikes, fix credits and gas — do not enable `CELO_SELF_SETTLE_FALLBACK` for production Labs traffic.

## Immediate checklist (when settle_failed alerts fire)

1. **API key + prepaid credits**
   - Env: `CELO_FACILITATOR_API_KEY` (alias `X402_CELO_API_KEY`)
   - Top up at [https://x402.celo.org](https://x402.celo.org) — flat **$0.001 USDC per settle**
   - Verify: `cd api && node scripts/check-celo-labs-config.js`
   - On `insufficient_credits`, Syra opens a **credit circuit breaker** (`celoFacilitatorCreditGate.js`): Labs Celo requests return **503** (no more settle_failed spam) until cooldown (`CELO_CREDIT_CIRCUIT_COOLDOWN_MS`, default 15m) or a successful facilitator settle clears it.

2. **Facilitator relayer CELO gas**
   - Public relayer: `0x0d74D5Cefd2e7F24E623330ebE3d8D4cB45fFB48`
   - Error strings often include “exceeds the balance of the account” / insufficient gas
   - Confirm balance on [Celoscan](https://celoscan.io/address/0x0d74D5Cefd2e7F24E623330ebE3d8D4cB45fFB48) (ops may need Celo facilitator support if depleting)

3. **Do not** turn on `CELO_ALLOW_SELF_SETTLE` / `CELO_SELF_SETTLE_FALLBACK` for Labs Track 2 purity

4. **Earn Yield guardrail** uses **Solana-only** settlement success (LP Auto is Solana). Celo credit outages do not block `/earn/yield` launch readiness.

## Env reference

| Var | Role |
|-----|------|
| `CELO_FACILITATOR_API_KEY` | Required for `/settle` |
| `CELO_FACILITATOR_URL` | Default `https://api.x402.celo.org` |
| `CELO_FACILITATOR_TIMEOUT_MS` | Default `12000` (retries once on timeout) |
| `CELO_SETTLE_VIA_FACILITATOR` | Default `true` |
| `CELO_SELF_SETTLE_FALLBACK` | Keep `false` for Labs |
| `SETTLE_FAILED_MONITOR_ENABLED` | Default `true` |

## Success bar (14 days)

- `settle_failed / (paid + settle_failed)` &lt; 10% in 7 days, &lt; 5% in 14
- Report **settled USD** only (`outcome: paid`) — never market sum of all `amountUsd`
