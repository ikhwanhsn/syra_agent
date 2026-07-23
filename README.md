<div align="center">

<img src="https://syraa.fun/images/logo.jpg" alt="Syra Logo" width="96" height="96" />

# **Syra**

### Machine Money for Agents

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/ikhwanhsn/syra_agent/blob/main/LICENSE)
[![Documentation](https://img.shields.io/badge/docs-docs.syraa.fun-0ea5e9)](https://docs.syraa.fun)
[![API Marketplace](https://img.shields.io/badge/build-syraa.fun%2Fmarketplace-26a5e4)](https://syraa.fun/marketplace)
[![GitHub](https://img.shields.io/badge/GitHub-ikhwanhsn%2Fsyra__agent-181717?logo=github)](https://github.com/ikhwanhsn/syra_agent)

**[Documentation](https://docs.syraa.fun)** · **[API Marketplace](https://syraa.fun/marketplace)** · **[Live metrics](https://syraa.fun)** · **[Agent](https://syraa.fun/agent)** · **[X (Twitter)](https://x.com/syra_agent)** · **[GitHub](https://github.com/ikhwanhsn/syra_agent)**

</div>

---

## What Is Syra?

**Syra** is **machine money for agents** on Solana — five pillars so agents can **Earn**, manage **Treasury**, **Invest**, **Spend**, and **Grow** capital.

**Live today:** pay-per-call crypto APIs over **x402** (Spend) — integrate with **MCP** or the **SDK**, no per-vendor API keys.

| Integrate | How |
|-----------|-----|
| **MCP** | `claude mcp add syra -- npx -y @syra-ai/mcp-server@latest` |
| **SDK** | `npm i @syra-ai/sdk` → `createSyraPaidClient` |
| **Marketplace** | [syraa.fun/marketplace](https://syraa.fun/marketplace) — first paid call in ~5 minutes |

Discovery: [api.syraa.fun](https://api.syraa.fun) — `/.well-known/x402`, `/openapi.json`, `GET /pillars`. Strategy: [docs/MACHINE_MONEY_STRATEGY.md](./docs/MACHINE_MONEY_STRATEGY.md).

This repository is **Syra-only** — the machine-money rail, x402 APIs, MCP/SDK, and product surfaces.

---

## Five pillars (honest status)

| Pillar | Status | Purpose |
|--------|--------|---------|
| **Spend** | **Live** | x402 native pay-per-call APIs |
| **Invest** | **Beta** | Deploy capital (Marinade, Jito, Jupiter, partners) |
| **Earn** | **Beta** | Agents monetize skills (x402 skills, creator payouts) |
| **Treasury** | **Infra** | Wallets, billing, policy engine |
| **Grow** | **Roadmap** | Yield + portfolio optimization |

Status is also exposed on `GET /pillars` so agents see the same truth.

---

## Quick Start — first paid call

### 1. MCP (Cursor / Claude Code)

```bash
claude mcp add syra -- npx -y @syra-ai/mcp-server@latest
```

Set:

- `SYRA_API_BASE_URL=https://api.syraa.fun`
- `SYRA_PAYER_KEYPAIR` — Solana wallet with **≥ $1 USDC** (and a little SOL for fees)

Then call **`syra_spend_news`** (e.g. ticker `BTC`) from your MCP host.

### 2. SDK

```bash
npm i @syra-ai/sdk
```

See [docs.syraa.fun/docs/build/sdk](https://docs.syraa.fun/docs/build/sdk).

### 3. Marketplace

Open **[syraa.fun/marketplace](https://syraa.fun/marketplace)** → Integrate tab → follow the numbered guide (install → fund → call → troubleshoot).

**Public metrics:** [syraa.fun](https://syraa.fun) · **Agent:** [syraa.fun/agent](https://syraa.fun/agent) · **Agent docs:** [api.syraa.fun/llms-full.txt](https://api.syraa.fun/llms-full.txt)

---

## Where Syra runs

| Platform | Description |
|----------|-------------|
| **MCP / SDK** | **Primary** agent integration — Cursor, Claude, app code |
| **API Marketplace** | Browse and test x402 routes at syraa.fun/marketplace (Integrate = 5-min path) |
| **Web agent** | Reference chat client at syraa.fun/agent |
| **Live metrics** | Settled x402 traction at syraa.fun (`GET /api/metrics`) |
| **x402 Autonomous Agent** | Research workflows on x402scan |

Telegram bot is a **secondary** consumer surface (maintenance mode until settlement + payer growth — see [docs/TELEGRAM_MAINTENANCE_POLICY.md](./docs/TELEGRAM_MAINTENANCE_POLICY.md)). Do not lead GTM with waitlist/email.

---

## Repository structure

| Package | Description |
|---------|-------------|
| **`web`** | Unified Syra app — agent chat, marketplace, marketing, dashboard |
| **`api`** | Backend — x402 APIs, agent wallets, policy engine |
| **`syra-sdk`** | Typed `@syra-ai/sdk` client |
| **`mcp-server`** | `@syra-ai/mcp-server` |
| **`packages/syra-x402-payer`** | MIT `@syra-ai/x402-payer` |
| **`documentation`** | Docs site (docs.syraa.fun) |
| **`docs/`** | Strategy notes (e.g. Machine Money growth plan) |
| **`services/bnb-agent`** | BNB Chain ERC-8183 sidecar |
| **`contracts/`** | On-chain contracts (BNB listing) |
| **`plugins/syra`** | Cursor plugin (MCP, skills, rules) |

---

## Why Syra?

- **Machine money** — Earn · Treasury · Invest · Spend · Grow as one narrative
- **Spend live** — USDC via x402; no per-vendor API keys
- **MCP + SDK first** — install in Cursor/Claude or wire typed clients in minutes
- **Honest maturity** — pillar status on `GET /pillars` and in product copy
- **Crypto intelligence** — news, sentiment, signals, smart money

Syra is built for **agents that hold and move capital**. It is not financial advice and does not replace operator judgment.

---

## Documentation

| Resource | URL |
|----------|-----|
| Syra docs | [docs.syraa.fun](https://docs.syraa.fun) |
| Growth strategy | [docs/MACHINE_MONEY_STRATEGY.md](./docs/MACHINE_MONEY_STRATEGY.md) |
| API gateway | [api.syraa.fun](https://api.syraa.fun) |
| Marketplace | [syraa.fun/marketplace](https://syraa.fun/marketplace) |
| Metrics | [syraa.fun](https://syraa.fun) (home) · agent at [/agent](https://syraa.fun/agent) |

- **Local docs:** `cd documentation && npm install && npm run dev`

---

## License

This project is open source under the [MIT License](LICENSE).
