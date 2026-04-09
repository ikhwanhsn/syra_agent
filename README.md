<div align="center">

<img src="frontend/public/images/logo.jpg" alt="Syra Logo" width="96" height="96" />

# **Syra**

### The Intelligence Layer for Autonomous Trading Agents

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Documentation](https://img.shields.io/badge/docs-docs.syraa.fun-0ea5e9)](https://docs.syraa.fun)
[![Telegram](https://img.shields.io/badge/Telegram-Bot-26a5e4)](https://t.me/syra_trading_bot)

**[Documentation](https://docs.syraa.fun)** · **[Telegram Bot](https://t.me/syra_trading_bot)** · **[X (Twitter)](https://x.com/syra_agent)** · **[Agent](https://agent.syraa.fun)**

</div>

---

## What Is Syra?

**Syra** is an intelligent, research-driven **AI Trading Intelligence Agent** for the Solana ecosystem. It helps traders, analysts, and builders make smarter, data-based decisions by combining:

- **Real-time market data** — Live technical and contextual indicators
- **On-chain activity signals** — Holder flows, smart money, DEX activity
- **Narrative & sentiment intelligence** — News, trends, and market mood
- **Structured AI-driven research** — Clear, actionable insights with reasoning

Syra is used across **Telegram**, **API workflows**, and autonomous agents—including the **x402 Agent** on x402scan.

Syra is designed as **an intelligence layer**, not just a signal bot: it enhances understanding with structured research, risk-aware perspectives, and learning-oriented explanations.

---

## Capabilities at a Glance

| Section | Description |
|--------|-------------|
| **Market Overview** | Price, volume, volatility, trend strength |
| **Technical Indicators** | RSI, MACD, SMA, EMA, Bollinger Bands |
| **Action Perspectives** | Key levels, momentum bias, scenario outlooks |
| **Risk Context** | R/R awareness and exposure considerations |
| **AI Insights** | Confidence levels and sentiment interpretation |

---

## Where Syra Runs

| Platform | Description |
|----------|-------------|
| **x402 Autonomous Agent** | Research & insights workflows on x402scan |
| **Telegram Bot** | Chat-based access to market analysis and insights |
| **API & Workflows** | Integrates with n8n and automation pipelines |
| **Data & Signal Engine** | Indicators, trends, and on-chain movements |
| **AI Reasoning Layer** | Synthesizes signals into structured interpretations |

---

## Quick Start

### Telegram Bot

1. Open [Syra Trading Agent Bot](https://t.me/syra_trading_bot)
2. Press **Start**
3. Use `/list` to view supported tokens
4. Try `/signal bitcoin` for a live analysis

**Example commands**

| Command | Description |
|---------|-------------|
| `/start` | View available commands |
| `/signal bitcoin` | Get latest BTC trading analysis |
| `/list` | Show supported tokens |
| `/news BTC` | Get latest BTC-related news |
| `/top_mention today` | Most-discussed tokens today |
| `/docs` | Open documentation |
| `/feedback` | Send suggestions or issues |

### x402 Autonomous Agent

Syra runs as an autonomous research agent on **x402scan** for automated research cycles, news and narrative monitoring, and signal interpretation pipelines.

---

## Repository Structure (Monorepo)

| Package | Description |
|---------|-------------|
| **`api`** | Backend API and services |
| **`frontend`** | Next.js dashboard and app |
| **`landing`** | Marketing/landing site (Vite + React) |
| **`ai-agent`** | AI agent web app (chat, marketplace, x402) |
| **`documentation`** | Documentation site (Vite + React; deployed at docs.syraa.fun) |
| **`api-playground`** | API testing and exploration UI |
| **`dashboard`** | Internal KPI dashboard (paid calls vs grant targets) |
| **`staking`** | Staking program (scripts and app) |
| **`prediction-game`** | Prediction game app and server |
| **`mcp-server`** | MCP server exposing Syra API tools |
| **`terminal`** | Terminal-related package in the monorepo |
| **`openclaw`** | OpenClaw / x402 agent HTTP tool examples |

---

## Colosseum Frontier — hackathon submission

**Hero product (what to demo):** [`api`](./api) + [`ai-agent`](./ai-agent) — Solana **x402** pay-per-call intelligence. Treat other packages (prediction-game, staking, terminal, internal dashboard) as **ecosystem**, not equal demo time.

### Golden path (live)

1. Open **[agent.syraa.fun](https://agent.syraa.fun)** → connect wallet (**Phantom** recommended via Privy).
2. Open **Marketplace** (or chat) → run a **paid** tool or flow that returns **HTTP 402** first, then settles after payment.
3. Confirm the Solana transaction on **[Solscan](https://solscan.io)** (paste signature from the UI or network tab).
4. Discovery for integrators: **[api.syraa.fun](https://api.syraa.fun)** — `/.well-known/x402`, `/openapi.json`, `/mpp-openapi.json` (see [api README](./api/README.md)).

### Architecture (hero stack)

```mermaid
flowchart LR
  subgraph clients [Clients]
    AgentWeb[agent_syraa_fun]
    Playground[playground_syraa_fun]
    MCP[mcp_server]
  end
  subgraph backend [Backend]
    SyraAPI[api_syraa_fun_x402]
  end
  AgentWeb -->|"402_then_pay"| SyraAPI
  Playground --> SyraAPI
  MCP -->|"HTTP_proxy"| SyraAPI
```

### Traction KPIs (publish these in deck and social)

Aligned with [Superteam grant milestones](./superteam/README.md):

| Metric | Target |
|--------|--------|
| Paid API calls (cumulative) | **500** |
| Agent chat sessions with paid tool use | **200** |

**Public snapshot:** [syraa.fun/analytics](https://syraa.fun/analytics) — update weekly through the hackathon window.

### Production Solana RPC (Helius-class)

The API **must** use an RPC that allows **`getAccountInfo`** and full blockchain reads (8004 registry, agent tooling). Many read-only keys return 403. Set in **`api/.env`** (see [api `.env.example`](./api/.env.example)):

- `SOLANA_RPC_URL` — primary (recommended: **Helius** mainnet URL with API key).
- Optional split: `SOLANA_RPC_8004_URL` or `SOLANA_RPC_BLOCKCHAIN_URL` if you isolate 8004 traffic.

**Verify after deploy:** one paid agent tool, `GET /8004/agent/<ASSET>/liveness` (if registered), and `getLatestBlockhash` from the same RPC.

### Phantom-first wallet UX

- **ai-agent / api-playground:** Privy — enable **Phantom** in the Privy dashboard; fallback wallet order prefers **Phantom** before MetaMask for Solana flows.
- **prediction-game:** `@solana/wallet-adapter` — **Phantom** is listed first in the modal when multiple wallets are detected.

### MoonPay (fiat onramp — scoped for GTM)

**Chosen over Squads for this plan** to answer “how users fund USDC for x402.” Squads remains a strong follow-on for **treasury multisig** once ops scale.

**Integration steps (scope; requires MoonPay + Privy dashboard access):**

1. Enable **MoonPay** (or Privy **funding** / onramp) in [Privy dashboard](https://dashboard.privy.io) for your app — follow Privy docs for **Solana USDC** or **Base USDC** funding, matching the chain your demo uses.
2. Add a single CTA in the agent app near **Connect / Fund agent wallet** (e.g. link to Privy funding UI or MoonPay widget) with UTM params for attribution.
3. Document in your deck: **fiat → stablecoin → x402 call** in under 2 minutes (record once MoonPay is live).
4. Do **not** commit API secrets; use env vars and server-side session only per MoonPay/Privy requirements.

### Deferred (stay honest in pitch)

- **$SYRA staking → x402 discount** is **roadmap** until wired into API pricing (see [tokenomics](./documentation/src/data/tokenomicsV2.md)).
- **MCP + automated x402 signing** — document manual pay flow for MCP; full auto-pay is a separate product milestone.

---

## Why Syra?

- **AI-assisted insights** — Multiple indicators and reasoning combined into structured trade outlooks  
- **Real-time market data** — Powered by live technical and contextual sources  
- **Research-driven output** — Focused on understanding, not blind execution  
- **Multi-platform access** — Telegram, x402 Agent, and automation workflows  
- **Educational context** — Every output includes explanations and indicator context  
- **Agentic automation** — Analysis pipelines that run across platforms  

Syra is built for **clarity**, **consistency**, and **structured reasoning**. It blends AI insight with traditional market analysis and is designed for automation and agent workflows. It is not built to replace decision-making—it is built to **enhance understanding**.

---

## Documentation

Full documentation (welcome, API reference, Syra Agent, x402 agent, tokenomics) lives in the **`documentation`** app and is published at **[docs.syraa.fun](https://docs.syraa.fun)**.

- **Local:** `cd documentation && npm install && npm run dev`  
- **Entry route:** `/docs/welcome` (or open `/docs` for the docs home)

---

## License

This project is open source under the [MIT License](LICENSE).
