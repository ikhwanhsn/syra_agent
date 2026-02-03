# landing

## Purpose of this folder

The **landing** folder is Syra’s **marketing and landing website**. It is a static site built with Vite + React that:

- **Introduces Syra** — hero, “What is Syra”, “Why Syra”, product modules, dashboard preview.
- **Showcases features** — FAQ, testimonials, roadmap, token section, live dashboard teaser.
- **Public leaderboard** — leaderboard page for discovery and social proof.
- **Drives signups** — CTA to Telegram bot, docs, and main app.

It is **not** the logged-in dashboard (that’s **frontend**). It’s the first page visitors see (e.g. syraa.fun).

---

## Tech stack

- **Build:** Vite, TypeScript
- **UI:** React, shadcn-ui, Tailwind CSS
- **Deploy:** Vercel (vercel.json)

---

## Run locally

```bash
cd landing
npm install
npm run dev
```

- **Build:** `npm run build`
- **Preview (prod build):** `npm run preview`
- **Lint:** `npm run lint`

---

## License

MIT — see [LICENSE](../LICENSE) at repo root.
