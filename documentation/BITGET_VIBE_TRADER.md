# Syra Bitget Vibe Trader — Hackathon Track 1

> **Grand-prize build:** See [SYRA_ALPHA_ARENA.md](./SYRA_ALPHA_ARENA.md) — multi-agent leaderboard, Playbook backtest, Alpha Overlay, publish/subscribe.

**Demo:** `https://agent.syraa.fun/vibe-trading` · **Arena:** `https://agent.syraa.fun/arena`  
**API:** `https://api.syraa.fun/experiment/bitget-vibe` (deploy latest `api/` first; until then use local API below)

## Project description (<200 words)

Syra Bitget Vibe Trader lets traders describe a spot-long strategy in plain English (e.g. “scalp BTC when RSI &lt; 30, 2% TP, 1% SL”). An LLM compiles the prompt into a structured `StrategySpec`, then an autonomous agent runs the full loop on **Bitget**: **perceive** (Bitget v2 candles + Agent Hub–aligned skill summaries: technical-analysis, sentiment-analyst, macro-analyst, market-intel, news-briefing) → **decide** (CryptoAnalysisEngine signal + RSI gates) → **risk** (notional caps, live policy gate) → **execute** (paper fills at live Bitget price by default; live spot orders when API keys are set) → **manage/exit** (TP/SL/max-hold resolution). All runs are persisted with verifiable win rate, return %, equity curve, and CSV export—no real capital required for the demo. Built on Syra’s production agent stack (Express API + React dashboard). Integrates **Bitget Agent Hub** public Tools (market data) and Skill Hub perception mapping; optional `npx bitget-mcp-server` for Cursor.

## Submission checklist (Track 1)

| Requirement | Deliverable |
|-------------|-------------|
| Demo link | `/vibe-trading` on agent.syraa.fun |
| Project description | This file (paragraph above) |
| Sim / backtest metrics | Session UI: win rate, return %, trade ledger, CSV export |
| Strategy loop | Perceive → Decide → Risk → Execute → Exit (visualized on page) |
| Bitget Agent Hub | Public Bitget API + 5 skill summaries; see `GET /agent/bitget-vibe/config` |

## Local development (fixes "Endpoint not found")

The web app proxies `/api` to **production** by default. New routes exist only on your machine until you deploy.

1. `cd api && npm run dev` (port 3000, needs `MONGODB_URI` + `OPENROUTER_API_KEY`)
2. In `web/`, copy `.env.development.local.example` → `.env.development.local` and set `VITE_USE_LOCAL_API=true`
3. Restart `cd web && npm run dev` → open `/vibe-trading`

## API quick start

```bash
# Compile NL → strategy JSON
curl -X POST https://api.syraa.fun/experiment/bitget-vibe/compile \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Scalp BTC when RSI below 35, 2% take profit, 1% stop"}'

# Create session + first tick
curl -X POST https://api.syraa.fun/experiment/bitget-vibe/sessions \
  -H "Content-Type: application/json" \
  -d '{"prompt":"...","mode":"paper"}'
```

## Environment (API server)

```bash
BITGET_VIBE_DEFAULT_MODE=paper          # paper | live (live needs keys)
BITGET_VIBE_CRON_MS=300000              # optional auto-tick every 5m
BITGET_VIBE_CRON_SECRET=...              # optional cron auth
BITGET_API_KEY=...
BITGET_SECRET_KEY=...
BITGET_PASSPHRASE=...
BITGET_VIBE_MAX_LIVE_NOTIONAL_USD=100
```

## Bitget MCP (optional, for judges / Cursor)

```bash
export BITGET_API_KEY=your-api-key
export BITGET_SECRET_KEY=your-secret-key
export BITGET_PASSPHRASE=your-passphrase

# Cursor / Claude MCP
npx -y bitget-mcp-server
```

Or install Agent Hub skills:

```bash
npx bitget-hub upgrade-all --target claude
```

## Community post

Tag **#BitgetHackathon** and @ Bitget AI when sharing the demo link.
