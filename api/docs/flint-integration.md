# Flint → Syra integration

Syra exposes **Flint public market data** as pay-per-call Spend tools. Flint is the multi-maker on-chain Solana spot venue ([docs.flintlabs.dev](https://docs.flintlabs.dev/)).

## What shipped (v1)

| Tool id | Path | Price tier |
| --- | --- | --- |
| `flint-pairs` | `GET/POST /flint/pairs` | Tier 1 |
| `flint-book` | `GET/POST /flint/book` | Tier 1 |
| `flint-stats` | `GET/POST /flint/stats` | Tier 1 |
| `flint-candles` | `GET/POST /flint/candles` | Tier 1 |
| `flint-external-tape` | `GET/POST /flint/external-tape` | Tier 2 |

MCP (after `node scripts/sync-mcp-tools.mjs`): `syra_spend_flint_pairs`, `syra_spend_flint_book`, `syra_spend_flint_stats`, `syra_spend_flint_candles`, `syra_spend_flint_external_tape`.

Upstream: gRPC-Web to `https://mainnet.api.flint.trade` using the bundled proto at [`api/libs/flint/api.proto`](../libs/flint/api.proto). Official `@superis-labs/flint-api-client` was not on npm at integrate time.

## Explicit non-goals (parked)

- **Live market making** on Flint (MakerService / TxService / quoter key). Requires Flint-provisioned `maker_id`, inventory, soft caps, and a separate risk process — not the Syra API request path.
- **Taker swap execution** against Flint as a Jupiter replacement. Revisit only if book depth is usable and a clear taker/IDL path exists.
- Rewriting Syra paper MM (`api/libs/mm/*`) onto Flint.
- Invest-board executable listing (wrong pillar — this is Spend intel).

## Kill / revisit criteria

**Keep marketing + tools if:** paid Flint tool calls have repeat agents within 4 weeks and listed pairs return usable L2 depth.

**Stop marketing / do not build maker or taker if:** books empty or unusable for primary pairs, or paid usage is near zero after 4 weeks. Keep the thin client; do not add capital or maker ops.

**Maker experiment only if all are true:** Flint grants `maker_id`, dedicated hot quoter key (not treasury), dry-run + inventory caps + kill switch, sidecar process outside `api/` request handlers.

## Env (optional)

| Var | Default |
| --- | --- |
| `FLINT_PUBLIC_API_URL` | `https://mainnet.api.flint.trade` |
| `FLINT_FETCH_TIMEOUT_MS` | `20000` |
| `FLINT_STREAM_TIMEOUT_MS` | `2500` |
| `FLINT_STREAM_MAX_EVENTS` | `25` |

No secrets required for public market data.

## Messaging

Position as: *CLOB-depth + cross-venue tape for agents, paid per call.* Do **not** claim live Syra market-making on Flint.
