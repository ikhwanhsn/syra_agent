<div align="center">

<img src="../frontend/public/images/logo.jpg" alt="Syra Logo" width="96" height="96" />

# **Syra Prediction Game**

### Prediction and events app in the Syra ecosystem

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../LICENSE)
[![Documentation](https://img.shields.io/badge/docs-docs.syraa.fun-0ea5e9)](https://docs.syraa.fun)
[![Website](https://img.shields.io/badge/Website-syraa.fun-26a5e4)](https://syraa.fun)

**[Documentation](https://docs.syraa.fun)** · **[Agent](https://agent.syraa.fun)** · **[Telegram Bot](https://t.me/syra_trading_bot)** · **[X (Twitter)](https://x.com/syra_agent)**

</div>

---

## Purpose

The **prediction-game** package is a **prediction/events app** in the Syra ecosystem. It allows users to:

- **Browse and join prediction events** — view event details, countdowns, and participate (e.g. stake or predict).
- **Stake** — stake on outcomes via the Staking page and context.
- **Create and manage events (admin)** — create events and manage content (admin + create-event flows).
- **Connect Solana wallet** — wallet context and UI for on-chain or gated actions.

It has its own **server** (Node/Express under `server/`) for event/creator/staking APIs and can use the monorepo **api** for shared data. The frontend is Vite + React (TypeScript, shadcn-ui, Tailwind). This app is a **separate product surface** from the main Syra trading dashboard.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Vite, React, TypeScript, shadcn-ui, Tailwind CSS |
| **Wallet** | Solana wallet adapters |
| **Server** | Node.js, Express (in `server/`) |

---

## Run locally

### Frontend

```bash
cd prediction-game
npm install
npm run dev
```

### Server (if running prediction-game APIs locally)

```bash
cd prediction-game/server
npm install
# Set env as needed
npm start
```

| Script | Description |
|--------|-------------|
| `npm run build` / `npm run build:dev` | Frontend production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run linting |

### See also

- [INSTALLATION_INSTRUCTIONS.md](INSTALLATION_INSTRUCTIONS.md)
- [WALLET_INTEGRATION_GUIDE.md](WALLET_INTEGRATION_GUIDE.md)
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)

---

## License

MIT — see [LICENSE](../LICENSE) at repo root.
