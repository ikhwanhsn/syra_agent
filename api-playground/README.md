# api-playground

## Purpose of this folder

The **api-playground** folder is a **Syra API testing and exploration UI**. It lets developers:

- **Call Syra API endpoints** — build and send requests (e.g. signals, research, news, browse) from the browser.
- **Handle x402 payments** — connect a Solana wallet and complete pay-per-request flows where endpoints are gated.
- **Inspect responses** — view JSON and response details (e.g. via response viewer, history).

It uses the same **api** backend as the rest of the monorepo and is useful for integration work, debugging, and demos. Built with Vite, TypeScript, React, shadcn-ui, and Tailwind.

---

## Tech stack

- **Build:** Vite, TypeScript
- **UI:** React, shadcn-ui, Tailwind CSS
- **Wallet:** Solana wallet adapters (for x402)
- **Testing:** Vitest, Testing Library

---

## Run locally

```bash
cd api-playground
npm install
# Ensure api backend is running and set API base URL if needed
npm run dev
```

- **Build:** `npm run build` or `npm run build:dev`
- **Preview:** `npm run preview`
- **Test:** `npm run test` or `npm run test:watch`
- **Lint:** `npm run lint`

---

## License

MIT — see [LICENSE](../LICENSE) at repo root.
