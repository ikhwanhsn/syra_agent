# Flint depth for agents (launch note)

**One-liner:** CLOB-style Solana spot depth + cross-venue tape for agents — pay per call on Syra. Not live market-making.

## Try it

```bash
# After MCP install (curated profile includes Flint tools)
# syra_spend_flint_pairs
# syra_spend_flint_book  { "base": "PUMP", "quote": "USDC", "level": "L2" }
# syra_spend_flint_stats
# syra_spend_flint_candles { "base": "PUMP", "interval": "5M" }
# syra_spend_flint_external_tape { "base": "PUMP", "quote": "USDC" }
```

HTTP (x402): `GET https://api.syraa.fun/flint/book?base=PUMP&quote=USDC`

Docs: [api/docs/flint-integration.md](./flint-integration.md) · [Flint](https://docs.flintlabs.dev/)

## Do not say

- “Syra is market-making on Flint”
- “Replace Jupiter with Flint swaps”
