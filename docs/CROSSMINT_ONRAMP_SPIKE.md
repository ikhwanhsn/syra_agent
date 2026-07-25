# Crossmint vs MoonPay/Privy — Onramp Spike (Phase 0)

**Date:** 2026-07-24  
**Decision:** **Ship Crossmint onramp** as the primary fiat → USDC path into existing Syra/Privy agent wallets. Keep manual USDC transfer. Do not replace Privy custody.

## Comparison

| Criterion | Crossmint | MoonPay via Privy (roadmap) |
| --- | --- | --- |
| Deliver to **external** Syra agent address | Yes — [onramp to non-Crossmint wallets](https://docs.crossmint.com/onramp/guides/onramp-to-external-wallets.md) + ownership proof when needed | Privy-centric; typically funds Privy-embedded wallet, not arbitrary agent treasury |
| **Solana USDC** token locator | Staging + production documented (`solana:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`) | Solana supported via MoonPay widget |
| Card / Apple Pay / Google Pay | Embedded checkout + headless orders | Yes (CSP already allows `*.moonpay.com`) |
| KYC | Required for regulated onramp; email on order | Required above thresholds |
| Agent wallet rewrite | None — recipient = `AgentWallet.agentAddress` | May push users onto Privy embedded only |
| Overlap with Syra core | Funding rail only; x402 stay on facilitators | Same |
| Staging self-serve | Yes (production needs sales enablement) | Depends on Privy app config |

## Why Crossmint wins this spike

1. **Activation job** is “USDC on the Syra spend agent address,” not “USDC in any wallet.” Crossmint’s external-wallet recipient model matches [`agentAddress`](../api/libs/agentWalletProvision.js) without a custody migration.
2. **Solana-primary** merchant stack gets a first-class USDC locator; Base remains a fallback rail.
3. MoonPay remains a **backup** (CSP already allowlisted). Revisit only if Crossmint KYC/conversion underperforms in staging.

## Go / no-go gates (staging)

Measure before flipping `CROSSMINT_ONRAMP_ENABLED=true` in production:

1. Time card → USDC balance visible on agent wallet (target &lt; 2 min after KYC).
2. KYC drop-off rate vs manual transfer activation.
3. Effective fee on a $10 exact-in pack (micropay $1 top-ups may be uneconomic — default UI minimum **$10**).
4. Webhook `orders.updated` / delivery completed reliably updates order row.

## Explicit non-goals (deferred)

See [`CROSSMINT_DEFERRED.md`](./CROSSMINT_DEFERRED.md): Agent Checkouts, offramp, Auth, NFT, wallet replacement.
