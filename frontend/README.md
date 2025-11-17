# 🤖 Syra AI Agent

**Syra** is an **AI-powered trading assistant** built on **Solana x402**, designed to simplify crypto trading through smart automation, analytics, and real-time Telegram interaction.

---

## 🚀 Overview

Syra integrates **AI analysis**, **n8n automation**, and **x402 connectivity** to deliver structured market insights directly to users.  
It empowers traders with intelligent data, not just signals — helping them understand the _why_ behind every move.

---

## ✨ Features

- 🤖 **AI Chat Assistant:** Web-based bot that explains Syra, tokens, and trading logic.
- 💬 **Telegram Trading Bot:** Instant access to token lists, signals, and docs.
- 📊 **AI Analysis Engine:** Generates simplified market summaries.
- 🧠 **Auto-Strategy:** Adaptive trading strategies powered by x402.

---

## 🔗 Official Links

| Platform         | Link                                                                       |
| ---------------- | -------------------------------------------------------------------------- |
| 🌐 Website       | [syraa.fun](https://www.syraa.fun/)                                        |
| 🤖 Telegram Bot  | [@syra_trading_bot](https://t.me/syra_trading_bot)                         |
| 📘 Docs          | [syra.gitbook.io/syra-docs](https://syra.gitbook.io/syra-docs)             |
| 🧵 X Community   | [Join here](https://x.com/i/communities/1984803953360716275)               |
| 💰 PumpFun Token | [View](https://pump.fun/coin/8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump) |

---

## ⚙️ Stack

- **Frontend:** Telegram Bot + Web (Next.js)
- **Backend:** n8n + Node.js
- **AI Layer:** OpenAI API
- **Blockchain:** Solana (x402 integration)

---

## 🧩 Run Locally

Follow these steps to set up and run the Syra AI Agent locally for development or testing:

```bash
# 1️⃣ Clone the repository
git clone https://github.com/ikhwanhsn/syra.git
cd syra

# 2️⃣ Install dependencies
npm install

set env
SOLANA_RPC_URL=https://solana-rpc.publicnode.com
SOLANA_PRIVATE_KEY=your_solana_private_key
FACILITATOR_URL=https://facilitator.payai.network
TREASURY_ADDRESS=your_treasury_address
AGENT_SECRET_KEY=ndis736jshdf8husadf7836jshdf8husadf7836jshdf8husadf7836jshdf8husadf7836 # just a random secret key
AGENT_PRIVATE_KEY=your_agent_private_key # create a new wallet for agent (run npx ts-node scripts/generate-agent-wallet.ts)

# 3️⃣ Start the development server
npm run dev

# 4️⃣ Generate a trading signal manually by agent & verified onchain
npx ts-node scripts/signal-agent.ts

# 5️⃣ Verify signal creation
# - Check your VS Code console for confirmation logs
# - Open the Syra dashboard website to confirm the signal is listed
```

---

## 🤝 Partner Integrations

Syra is expanding its AI trading ecosystem through key partnerships that enhance automation, payment flexibility, and cross-platform intelligence.

### 🔗 Current Integrations

- 💳 **PayAI** — Seamless AI-driven payment and transaction automation for trading operations.
- ⚡ **ATXP** — Smart execution protocol enabling fast, data-backed decision-making for on-chain data.

> These integrations empower Syra to move toward fully autonomous trading intelligence — connecting insights, payments, and execution through AI + Solana.
