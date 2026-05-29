# Syra Main — Unified Web App

Single Next.js 14 app aggregating **AI Agent** (homepage), **Staking**, and **API Playground** on one domain.

## Routes

| Path | Feature |
|------|---------|
| `/` | AI agent chat |
| `/overview`, `/agents`, `/alpha`, `/assets`, experiments… | Agent dashboard |
| `/staking` | Streamflow token locks |
| `/staking/details` | Legacy Anchor positions |
| `/staking/dashboard` | Admin operator dashboard |
| `/playground` | x402 API playground |

## Setup

```bash
cd main
cp .env.example .env.local
# Set NEXT_PUBLIC_PRIVY_APP_ID and NEXT_PUBLIC_SYRA_API_URL
npm install --legacy-peer-deps
npm run dev
```

Dev server: http://localhost:3000

## Deploy

Point `syraa.fun` Vercel project root to `main/`. Use env vars from `.env.example`.

## Notes

- Source apps (`ai-agent/`, `staking/`, `api-playground/`) are unchanged; this folder is the new unified app.
- Wallet: Privy (Solana) for all sections.
- React Router pages were ported via `@/lib/navigation` shim + Next.js App Router routes.
