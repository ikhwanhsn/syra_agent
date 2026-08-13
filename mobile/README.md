# Syra Scout (Solana Mobile)

Consumer crypto-intelligence app for Android / Solana dApp Store.

Browse free (`/free/*`, `/preview/*`). Unlock alpha with USDC x402 micropayments signed via Mobile Wallet Adapter. Facilitator sponsors gas.

## Stack
- React Native 0.71 (Solana Mobile dApp scaffold)
- `@solana-mobile/mobile-wallet-adapter-protocol-web3js`
- `@solana/web3.js` + `@solana/spl-token`
- React Navigation + TanStack Query
- NativeWind / Tailwind tokens + StyleSheet theme mirrored from Syra web

## Run (Android)
```bash
cd mobile
npm install
npm start
# other terminal
npm run android
```

Requires Android SDK, an emulator or Seeker/Saga device, and an MWA-compatible wallet (e.g. Seed Vault / Fake Wallet for testing).

## Architecture
- `src/lib/x402Client.ts` — build + header for Solana x402 v2 (partial sign)
- `src/lib/paidApi.ts` — 402 → MWA `signTransactions` → `PAYMENT-SIGNATURE` retry
- `src/screens/*` — Home, Token detail, Scout, Wallet
- `dapp-store/` — listing copy + publish config

## API
Production base URL: `https://api.syraa.fun`

## dApp Store
See [dapp-store/listing.md](./dapp-store/listing.md).
