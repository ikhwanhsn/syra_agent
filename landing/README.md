<div align="center">

<img src="../frontend/public/images/logo.jpg" alt="Syra Logo" width="96" height="96" />

# **Syra Landing**

### Marketing and landing website for Syra

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../LICENSE)
[![Documentation](https://img.shields.io/badge/docs-docs.syraa.fun-0ea5e9)](https://docs.syraa.fun)
[![Website](https://img.shields.io/badge/Website-syraa.fun-26a5e4)](https://syraa.fun)

**[Documentation](https://docs.syraa.fun)** · **[Telegram Bot](https://t.me/syra_trading_bot)** · **[Agent](https://agent.syraa.fun)** · **[X (Twitter)](https://x.com/syra_agent)**

</div>

---

## Purpose

The **landing** package is Syra's **marketing and landing website**. It is a static site built with Vite + React that:

- **Introduces Syra** — hero, “What is Syra”, “Why Syra”, product modules, dashboard preview.
- **Showcases features** — FAQ, testimonials, roadmap, token section, live dashboard teaser.
- **Public leaderboard** — leaderboard page for discovery and social proof.
- **Drives signups** — CTA to Telegram bot, docs, and main app.

It is **not** the logged-in dashboard (that’s **frontend**). It’s the first page visitors see (e.g. syraa.fun).

---

## Tech stack

| Layer | Technology |
|-------|------------|
| **Build** | Vite, TypeScript |
| **UI** | React, shadcn-ui, Tailwind CSS |
| **Deploy** | Vercel (vercel.json) |

---

## Run locally

```bash
cd landing
npm install
npm run dev
```

| Script | Description |
|--------|-------------|
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run linting |

---

## Production build (API key)

The dashboard preview calls `api.syraa.fun/v1/regular/*` (news, sentiment, signal, binance-ticker). The production API requires an API key for those routes. When building the landing for production (e.g. on Vercel), set:

- **`VITE_SYRA_API_KEY`** — same value as one of the production API’s `API_KEY` or `API_KEYS`. This is baked into the client bundle and sent as `X-API-Key` on each request.
- **`VITE_SYRA_API_URL`** — leave unset or set to `https://api.syraa.fun/` so the app targets the production API. (Do not use `http://localhost:3000/` for production builds.)

If the production build is missing a valid `VITE_SYRA_API_KEY`, requests to the API will return **401 Unauthorized**.

---

## License

MIT — see [LICENSE](../LICENSE) at repo root.
