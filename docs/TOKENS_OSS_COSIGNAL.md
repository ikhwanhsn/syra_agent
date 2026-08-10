# Tokens OSS co-signal ask

Short outreach for Solana Foundation / Tokens maintainers after [solana-foundation/tokens](https://github.com/solana-foundation/tokens) went public.

## Pitch (email / Discord / X DM)

Subject: Syra already ships on Tokens.xyz — happy to be an OSS consumer example

Hi Tokens team,

Syra (syraa.fun) has been integrating Tokens.xyz as the canonical asset layer for agents: board, dossier, risk/OHLCV, 13 `tokens-*` MCP tools, and x402 `/assets` routes. With the monorepo open, we are positioning Syra as the agent decision layer on Foundation-canonical assets (resolve → risk → Syra news/sentiment/signal).

Would you be open to any of:

1. A docs or README “ecosystem consumers” mention linking syraa.fun/assets
2. A short co-signal on X when useful
3. Feedback on two production DX issues we filed (OHLCV gaps for Solana mints; clearer agent-oriented OpenAPI examples)

We stay on hosted `api.tokens.xyz` in production and contribute upstream rather than forking.

Thanks,
Syra

## Links to include

- Product: https://www.syraa.fun/assets
- Docs: https://docs.tokens.xyz/v1/quickstart
- OSS: https://github.com/solana-foundation/tokens
- Syra ship log: `/post` update #47 (Tokens OSS)

## File upstream issues

Ready bodies live in [docs/tokens-upstream/](./tokens-upstream/). With `gh` authenticated:

```bash
./scripts/file-tokens-upstream-issues.sh
```
