# prediction-game

## Purpose of this folder

The **prediction-game** folder is a **prediction/events app** in the Syra ecosystem. It allows users to:

- **Browse and join prediction events** — view event details, countdowns, and participate (e.g. stake or predict).
- **Stake** — stake on outcomes via the Staking page and context.
- **Create and manage events (admin)** — create events and manage content (admin + create-event flows).
- **Connect Solana wallet** — wallet context and UI for on-chain or gated actions.

It has its own **server** (Node/Express under `server/`) for event/creator/staking APIs and can use the monorepo **api** for shared data. The frontend is Vite + React (TypeScript, shadcn-ui, Tailwind). This app is a **separate product surface** from the main Syra trading dashboard.

---

## Tech stack

- **Frontend:** Vite, React, TypeScript, shadcn-ui, Tailwind CSS
- **Wallet:** Solana wallet adapters
- **Server:** Node.js, Express (in `server/`)

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

- **Build (frontend):** `npm run build` or `npm run build:dev`
- **Preview:** `npm run preview`
- **Lint:** `npm run lint`

See also:

- [INSTALLATION_INSTRUCTIONS.md](INSTALLATION_INSTRUCTIONS.md)
- [WALLET_INTEGRATION_GUIDE.md](WALLET_INTEGRATION_GUIDE.md)
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)

---

## License

MIT — see [LICENSE](../LICENSE) at repo root.
