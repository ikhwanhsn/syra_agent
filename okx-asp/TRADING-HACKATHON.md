# OKX.AI Trading Hackathon (Season 1) — Syra Trading ASP Runbook

Win plan execution guide. Compete in [OKX.AI Season 1](https://www.okx.ai/hackathon) ($40k pool, 1st = $10k) with a Syra-powered **Trading ASP** that trades on Syra's own crypto intelligence.

- **Basis:** Onchain OS (bound OKX Agentic Wallet, on-chain trades, no instrument restrictions)
- **Capital:** ~300 USDT, aggressive
- **Mode:** fully automated 24/7 loop + hard kill switch

## Timeline (UTC+8)

| When | Milestone |
|------|-----------|
| by ~Aug 9 | Submit Trading ASP for review (buffer for ~24h review) |
| **Aug 11 12:00** | Registration closes — must be registered for the competition |
| Aug 11 12:00 → Aug 25 12:00 | Competition live-trading window (ranked by PnL% + PnL) |

## What was built in this repo

| Piece | Path |
|-------|------|
| Decision engine (signals + sentiment → ranked candidates) | [api/libs/okxTrading/decisionEngine.js](../api/libs/okxTrading/decisionEngine.js) |
| Risk engine (sizing, stop-loss, trailing TP, breakers) | [api/libs/okxTrading/riskEngine.js](../api/libs/okxTrading/riskEngine.js) |
| Executor (paper + Onchain OS live) | [api/libs/okxTrading/onchainOsExecutor.js](../api/libs/okxTrading/onchainOsExecutor.js) |
| Orchestrator loop + lifecycle | [api/libs/okxTrading/okxTradingService.js](../api/libs/okxTrading/okxTradingService.js) |
| Env config | [api/libs/okxTrading/tradingConfig.js](../api/libs/okxTrading/tradingConfig.js) |
| Control-plane API (`/experiment/okx-trading`) | [api/routes/okxTrading.js](../api/routes/okxTrading.js) |
| Mongo models / repo | [api/models/okxTrading/](../api/models/okxTrading/), [api/repositories/okxTrading/](../api/repositories/okxTrading/) |
| Cron registration | `api/index.js` (search `OKX trading`) |
| Registration payload / script | [trading-services.json](./trading-services.json), [register-trading-asp.mjs](./register-trading-asp.mjs) |
| Phase 0 setup | [setup-onchainos.sh](./setup-onchainos.sh) |
| Launch post | [TRADING-X-POST.md](./TRADING-X-POST.md) |

Unit tests: `cd api && node --test libs/okxTrading/*.test.js` (12 passing — pure decision/risk logic).

---

## Phase 0 — Environment + funding (human required)

```bash
bash okx-asp/setup-onchainos.sh
```

Then complete the interactive steps it prints:
1. `onchainos wallet login your@email.com` (OTP) → `onchainos wallet status` shows `loggedIn: true`.
2. Fund the Agentic Wallet with **> 300 USDT** on-chain (+ gas).
3. **Confirm the on-chain swap command** Onchain OS uses, do one tiny test swap from this wallet, and record it as `OKX_TRADING_EXEC_CMD` (see env below). This is the only unknown the executor needs.

## Phase 1 — Register Trading ASP + competition

**Status (2026-08-07):** Trading ASP **#10599 Syra Trading** created and **Listing under review**.
Service: Syra Signal Copy-Trade — A2A, 5 USDT/month, 3-day free trial (`freeTrial:72`), `categoryCode: TRADING`.

Activate requires A2A readiness. If Claude Max is unavailable, use OpenClaw instead:

```bash
npm i -g openclaw@latest --allow-scripts=openclaw
okx-a2a setup openclaw
openclaw gateway install && openclaw gateway restart
okx-a2a doctor --fix
onchainos agent activate --agent-id 10599 --preferred-language en_US
```

Or (scripted create path when you need another ASP):

```bash
node okx-asp/register-trading-asp.mjs
```

Registers the **Syra Signal Copy-Trade** subscription service (the leaderboard scoring basis). Then register for the competition — either the interactive prompt (recommended, uses the installed `okx-growth-competition` skill):

```
Help me register for the OKX.AI trading hackathon
```

or the CLI directly (find the OKX.AI activity, read its trading chain, join with the bound wallet):

```bash
onchainos competition list --status 0                     # find the activity + shortName
onchainos competition detail --activity-id <id>           # read participateChainIds + chainIndex
onchainos competition join --activity-id <id> \
  --evm-wallet <0x...> --sol-wallet <sol...> --chain-index <chainId>
onchainos competition user-status --activity-id <id>      # expect joinStatus: 1
```

Bind the funded Agentic Wallet. Keep the ASP + subscription service **online through review and the entire contest** (deleting the subscription = disqualification). Ranked on both `--sort-type 1` (PnL%) and `--sort-type 7` (PnL); each counted trade must be ≥ $1 and on a chain in `participateChainIds`.

**If `onchainos agent create` reverts with `origin error`:** do not debug the on-chain revert. Escalate immediately via the interactive prompt above, the [OKX Dev Portal](https://web3.okx.com/onchain-os/dev-portal), or a [GitHub issue](https://github.com/okx/onchainos-skills/issues/new). This blocked the Genesis attempt; the deadline is the real risk.

## Phase 4 — Dry run (paper) before going live

The loop ships **paper mode by default** (`OKX_TRADING_LIVE=false`) so it is safe to validate against live intelligence with zero risk.

```bash
# In the API service environment (Mongo connected):
export OKX_TRADING_CRON_ENABLED=true
export OKX_TRADING_CRON_SECRET=<pick-a-secret>
# leave OKX_TRADING_LIVE unset/false for paper

# enable + drive a manual cycle
curl -X POST localhost:PORT/experiment/okx-trading/enable -H "x-okx-trading-secret: <secret>"
curl -X POST localhost:PORT/experiment/okx-trading/tick   -H "x-okx-trading-secret: <secret>"
curl localhost:PORT/experiment/okx-trading/state
curl localhost:PORT/experiment/okx-trading/decide   # read-only ranked universe
```

Watch for ≥24h: candidate ranking sane, entries sized correctly, stop-loss/trailing/kill all fire, snapshots recorded. Deploy **always-on (cloud)**, not a laptop.

## Phase 5 — Go live (Aug 11) + operate

1. Set the live env (below) with the per-token routes (`OKX_TRADING_TOKENS`) and the bound wallet.
2. `enable` with `{ "live": true }` at the competition open; confirm ≥1 valid trade early.
3. Daily monitor:
   - Internal: `/state`, `/snapshots`, `/trades` (PnL, drawdown, uptime, errors).
   - Leaderboard: `onchainos competition rank --activity-id <id> --sort-type 1` (PnL%) and `--sort-type 7` (PnL), or `--all`.
   - Standing: `onchainos competition user-status --activity-id <id>`.
4. Never delete/alter the snapshotted subscription service.
5. After Aug 25, claim any prize: `onchainos competition claim --activity-id <id> --evm-wallet <0x...> --sol-wallet <sol...>` (top-10 winners then `submit-contact`).

**Kill switch (any time):**
```bash
curl -X POST localhost:PORT/experiment/okx-trading/kill   -H "x-okx-trading-secret: <secret>"  # flattens + halts
curl -X POST localhost:PORT/experiment/okx-trading/resume -H "x-okx-trading-secret: <secret>"
```

---

## Environment variables

| Var | Default | Purpose |
|-----|---------|---------|
| `OKX_TRADING_CRON_ENABLED` | `false` | Turn the internal loop on |
| `OKX_TRADING_LIVE` | `false` | `true` = real Onchain OS execution (else paper) |
| `OKX_TRADING_INTERVAL_MS` | `300000` | Loop cadence (min 60000) |
| `OKX_TRADING_CRON_SECRET` | — | Admin/cron secret (`x-okx-trading-secret`) |
| `OKX_TRADING_EXEC_CMD` | `onchainos swap execute ...` (built-in) | Live swap argv template. Placeholders: `{FROM_ADDR} {TO_ADDR} {READABLE_AMOUNT} {CHAIN} {WALLET} {SLIPPAGE_PCT} {SLIPPAGE_BPS} {TOKEN} {SIDE}` |
| `OKX_TRADING_TOKENS` | — | **Required for live.** JSON per-token route: `{ "solana": { "chain": "Solana", "address": "<mint>", "quoteAddress": "<USDT mint>", "wallet": "<addr>" } }` |
| `OKX_TRADING_WALLET` | — | Bound Agentic Wallet address (fallback for per-token `wallet`) |
| `OKX_TRADING_QUOTE_ADDR` | — | Quote/USDT token address (fallback for per-token `quoteAddress`) |
| `OKX_TRADING_CHAIN` | — | Default chain name/id (fallback for per-token `chain`) |
| `OKX_TRADING_UNIVERSE` | BTC,ETH,SOL,BNB,XRP,DOGE | Tradable whitelist (liquid) |
| `OKX_TRADING_SIGNAL_SOURCE` | `binance` | CEX OHLC source for signals |
| `OKX_TRADING_BARS` | `1h,15m` | Signal timeframes |
| `OKX_TRADING_MIN_CONVICTION` | `0.45` | Entry conviction gate |
| `OKX_TRADING_MAX_OPEN_POSITIONS` | `3` | Concentration cap |
| `OKX_TRADING_PER_TRADE_PCT` | `0.35` | Per-entry % of equity |
| `OKX_TRADING_MAX_DEPLOYED_PCT` | `0.9` | Keep ≥10% cash |
| `OKX_TRADING_STOP_LOSS_PCT` | `0.06` | Hard stop per position |
| `OKX_TRADING_TAKE_PROFIT_PCT` | `0.25` | Arm trailing after +25% |
| `OKX_TRADING_TRAILING_TP_PCT` | `0.04` | Giveback from peak to exit |
| `OKX_TRADING_DAILY_MAX_LOSS_PCT` | `0.15` | Halt new entries for the day |
| `OKX_TRADING_MAX_DRAWDOWN_PCT` | `0.4` | Auto-kill (flatten + halt) |
| `OKX_TRADING_SLIPPAGE_BPS` | `80` | Max slippage |
| `OKX_TRADING_PAPER_START_USD` | `300` | Paper starting cash |

### Live execution — how it maps to Onchain OS

The executor calls `onchainos swap execute` (from the `okx-agentic-wallet` skill),
which takes token **contract addresses**, a **chain**, the **wallet**, and
percent **slippage**, and returns `swapTxHash`, `fromAmount`, `toAmount`,
`tradeFee`, `priceImpact`.

- **Buy** = quote(USDT) → token, `--readable-amount` = USD notional.
- **Sell** = token → quote(USDT), `--readable-amount` = base qty.

Configure the per-token routes (from your Phase 0 test swaps):

```
OKX_TRADING_WALLET="<bound agentic wallet address>"
OKX_TRADING_TOKENS='{
  "solana":   { "chain": "Solana", "address": "So111...112",  "quoteAddress": "<USDT mint>" },
  "bitcoin":  { "chain": "X Layer", "address": "0x...WBTC",    "quoteAddress": "0x...USDT" },
  "ethereum": { "chain": "X Layer", "address": "0x...WETH",    "quoteAddress": "0x...USDT" }
}'
```

The default `OKX_TRADING_EXEC_CMD` is:

```
onchainos swap execute --from {FROM_ADDR} --to {TO_ADDR} --readable-amount {READABLE_AMOUNT} --chain {CHAIN} --wallet {WALLET} --slippage {SLIPPAGE_PCT} --json
```

Override it only if your CLI flags differ. On any non-zero exit or unparseable
output the trade is recorded as `failed` and the position is left untouched.

## Safety notes

- Live execution refuses to run if `OKX_TRADING_EXEC_CMD` is unset — it never guesses a money-moving command.
- On any execution failure, positions are **not** mutated (fail-safe).
- Total-drawdown breaker auto-kills; kill switch flattens on the next tick.
- Verify Onchain OS wallet balance reconciliation against the internal ledger daily while live.
