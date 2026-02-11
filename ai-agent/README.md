<div align="center">

<img src="../frontend/public/images/logo.jpg" alt="Syra Logo" width="96" height="96" />

# **Syra AI Agent**

### Web app for the Syra AI research and trading agent

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../LICENSE)
[![Documentation](https://img.shields.io/badge/docs-docs.syraa.fun-0ea5e9)](https://docs.syraa.fun)
[![Agent](https://img.shields.io/badge/Agent-agent.syraa.fun-26a5e4)](https://agent.syraa.fun)

**[Documentation](https://docs.syraa.fun)** · **[Agent](https://agent.syraa.fun)** · **[Telegram Bot](https://t.me/syra_trading_bot)**

</div>

---

## Purpose

The **ai-agent** package is the **Syra AI Agent web app**. It is a Vite + React (TypeScript) application that provides:

- **AI chat** — web-based chat that explains Syra, tokens, and trading logic.
- **Marketplace** — browse and use Syra agents and x402 pay-per-use flows.
- **Shareable chats** — share chat sessions via URL.
- **Solana wallet** — connect wallet for x402 payments and agent actions.

It uses the **api** backend and integrates with the x402 agent ecosystem (e.g. x402scan). Built with Vite, React, shadcn-ui, Tailwind, and Solana wallet adapters.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| **Build** | Vite, TypeScript |
| **UI** | React, shadcn-ui, Tailwind CSS, Radix UI |
| **Wallet** | Solana wallet adapters |
| **Testing** | Vitest, Testing Library |
| **Deploy** | Vercel (vercel.json) |

---

## Run locally

```bash
cd ai-agent
npm install
# Set env if needed (API URL, etc.)
npm run dev
```

| Script | Description |
|--------|-------------|
| `npm run build` / `npm run build:dev` | Production build |
| `npm run preview` | Preview production build |
| `npm run test` / `npm run test:watch` | Run tests |
| `npm run lint` | Run linting |

---

## License

MIT — see [LICENSE](../LICENSE) at repo root.
