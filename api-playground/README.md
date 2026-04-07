<div align="center">

<img src="public/images/logo.jpg" alt="Syra — Agentic Playground" width="96" height="96" />

# **Agentic Playground**

### Payment-gated API workspace for agents and builders (Syra · HTTP 402 · x402 · MPP)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../LICENSE)
[![Documentation](https://img.shields.io/badge/docs-docs.syraa.fun-0ea5e9)](https://docs.syraa.fun)
[![Playground](https://img.shields.io/badge/Playground-playground.syraa.fun-26a5e4)](https://playground.syraa.fun)

**[Documentation](https://docs.syraa.fun)** · **[Playground](https://playground.syraa.fun)** · **[API](https://api.syraa.fun)** · **[Agent](https://agent.syraa.fun)** · **[Telegram Bot](https://t.me/syra_trading_bot)**

</div>

---

## Purpose

**Agentic Playground** is Syra’s browser workspace to **call payment-gated APIs**: build requests, get an HTTP **402** challenge, pay with your wallet, retry with proof, and inspect JSON. It supports **x402** and **MPP** (machine payments) lanes — same wallet settlement flow for both. It shares the same **api** backend as the rest of the monorepo and is built for integration work, demos, and agent workflows.

- **Syra routes** — signals, research, news, Nansen partner flows, and more (see Example flows).
- **x402- and MPP-compatible URLs** — probe, pay, and debug responses like a mini Postman for agentic commerce.

Stack: Vite, TypeScript, React, shadcn-ui, Tailwind, Solana/Base wallets for settlement.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| **Build** | Vite, TypeScript |
| **UI** | React, shadcn-ui, Tailwind CSS |
| **Wallet** | Privy + adapters (HTTP 402 — x402 & MPP settlement) |
| **Testing** | Vitest, Testing Library |

---

## Run locally

```bash
cd api-playground
npm install
# Ensure api backend is running and set API base URL if needed
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
