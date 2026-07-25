# Crossmint Base wallet → Syra x402 (distribution)

Syra remains the **x402 merchant**. Crossmint is an optional **payer wallet** on Base (and fiat onramp into Syra/Privy agent addresses).

## Quick path

1. Create / fund a Crossmint Base wallet with USDC; authorize the agent signer ([Crossmint x402 docs](https://docs.crossmint.com/agents/payment-flows/x402)).
2. Wrap `fetch` with `@x402/core` Exact EVM scheme.
3. Call `https://api.syraa.fun/news?ticker=BTC` (or any paid Spend route).
4. Confirm HTTP 200 after 402 → sign → retry.

Human product funding (card → Solana USDC agent treasury): `syraa.fun/wallet` → **Buy USDC with card**. Env: `CROSSMINT_ONRAMP_*` on the API.

## Do not

- Replace Privy with Crossmint Auth/wallets
- Put Crossmint on the merchant settle path (facilitators stay authoritative)

See also: `docs/CROSSMINT_ONRAMP_SPIKE.md`, `docs/CROSSMINT_DEFERRED.md`, docs site `/docs/build/crossmint-x402`.
