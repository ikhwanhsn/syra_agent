# Publish Syra Scout to the Solana dApp Store

Prerequisites: signed release APK, publisher keypair (never commit), listing assets in `dapp-store/assets/`.

1. Build release:
   ```bash
   cd mobile && npm run android:release
   ```
2. Install CLI:
   ```bash
   npm i -g @solana-mobile/dapp-store-cli
   ```
3. Follow `dapp-store/listing.md` to create publisher / app / release NFTs and submit.

Replace placeholder screenshots with real device captures before submission.
