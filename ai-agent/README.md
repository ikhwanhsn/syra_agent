# ai-agent

## Purpose of this folder

The **ai-agent** folder is the **Syra AI Agent web app**. It is a Vite + React (TypeScript) application that provides:

- **AI chat** — web-based chat that explains Syra, tokens, and trading logic.
- **Marketplace** — browse and use Syra agents and x402 pay-per-use flows.
- **Shareable chats** — share chat sessions via URL.
- **Solana wallet** — connect wallet for x402 payments and agent actions.

It uses the **api** backend and integrates with the x402 agent ecosystem (e.g. x402scan). Built with Vite, React, shadcn-ui, Tailwind, and Solana wallet adapters.

---

## Tech stack

- **Build:** Vite, TypeScript
- **UI:** React, shadcn-ui, Tailwind CSS, Radix UI
- **Wallet:** Solana wallet adapters
- **Testing:** Vitest, Testing Library
- **Deploy:** Vercel (vercel.json)

---

## Run locally

```bash
cd ai-agent
npm install
# Set env if needed (API URL, etc.)
npm run dev
```

- **Build:** `npm run build` or `npm run build:dev`
- **Preview:** `npm run preview`
- **Test:** `npm run test` or `npm run test:watch`
- **Lint:** `npm run lint`

---

## License

MIT — see [LICENSE](../LICENSE) at repo root.
