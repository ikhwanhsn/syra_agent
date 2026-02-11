<div align="center">

<img src="../frontend/public/images/logo.jpg" alt="Syra Logo" width="96" height="96" />

# **Syra API Playground**

### API testing and exploration UI for the Syra v2 API

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../LICENSE)
[![Documentation](https://img.shields.io/badge/docs-docs.syraa.fun-0ea5e9)](https://docs.syraa.fun)
[![Playground](https://img.shields.io/badge/Playground-playground.syraa.fun-26a5e4)](https://playground.syraa.fun)

**[Documentation](https://docs.syraa.fun)** · **[Playground](https://playground.syraa.fun)** · **[API](https://api.syraa.fun)** · **[Agent](https://agent.syraa.fun)** · **[Telegram Bot](https://t.me/syra_trading_bot)**

</div>

---

## Purpose

The **api-playground** package is a **Syra API testing and exploration UI**. It lets developers:

- **Call Syra API endpoints** — build and send requests (e.g. signals, research, news, browse, token report, token statistic, **token risk alerts**) from the browser.
- **Handle x402 payments** — connect a Solana wallet and complete pay-per-request flows where endpoints are gated.
- **Inspect responses** — view JSON and response details (e.g. via response viewer, history).

It uses the same **api** backend as the rest of the monorepo and is useful for integration work, debugging, and demos. Built with Vite, TypeScript, React, shadcn-ui, and Tailwind.

**Example flows** include: Correlation matrix, Token risk (Rugcheck stats), **Token risk alerts** (tokens above a risk threshold, e.g. `rugScoreMin=80`), News, Check status, Analytics summary, Signal, and many more — use the Request Builder quick-select or the Examples page.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| **Build** | Vite, TypeScript |
| **UI** | React, shadcn-ui, Tailwind CSS |
| **Wallet** | Solana wallet adapters (for x402) |
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
