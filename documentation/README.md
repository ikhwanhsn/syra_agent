<div align="center">

<img src="../frontend/public/images/logo.jpg" alt="Syra Logo" width="96" height="96" />

# **Syra Documentation**

### Official docs, API reference, and guides for the Syra ecosystem

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../LICENSE)
[![Documentation](https://img.shields.io/badge/docs-docs.syraa.fun-0ea5e9)](https://docs.syraa.fun)
[![Docs Site](https://img.shields.io/badge/Docs-docs.syraa.fun-26a5e4)](https://docs.syraa.fun)

**[Documentation](https://docs.syraa.fun)** · **[API Reference](https://docs.syraa.fun)** · **[Agent](https://agent.syraa.fun)** · **[Telegram Bot](https://t.me/syra_trading_bot)** · **[X (Twitter)](https://x.com/syra_agent)**

</div>

---

## Purpose

The **documentation** package is the **Syra documentation site** built with **Vite**, **React**, and **React Router**. It provides:

- **Welcome & overview** — what Syra is and where it runs.
- **API reference** — x402 (and MPP discovery) endpoints, payment flow, preview routes.
- **Syra Agent** — getting started, features, trading guidance, supported tokens, catalog, system prompt.
- **x402 Agent** — autonomous agent on x402scan.
- **Token & community** — tokenomics, roadmap, changelog, community links.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| **Build** | Vite |
| **UI** | React, React Router, Tailwind CSS, shadcn-ui |
| **Deploy** | Vercel (vercel.json) |

---

## Run locally

```bash
cd documentation
npm install
npm run dev
```

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |

---

## License

MIT — see [LICENSE](../LICENSE) at repo root.
