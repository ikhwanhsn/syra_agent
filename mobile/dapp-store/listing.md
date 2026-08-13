# Syra Scout — Solana dApp Store listing

## Short description
Crypto research in your pocket. Browse free. Pay per alpha in USDC.

## Full description
Syra Scout is the mobile face of Syra machine money: pay-per-call crypto intelligence on Solana.

**Browse free**
- Live BTC / ETH / SOL prices
- Free preview news, sentiment, and signals
- Watchlist and token dossiers

**Pay per alpha**
- Unlock full `/news`, `/sentiment`, `/signal` for about $0.005 USDC
- Scout pump.fun alpha segments
- Rugcheck and smart-money analytics summary
- Sign with Mobile Wallet Adapter (Seed Vault). Gas is sponsored.

**Holder utility**
- Connected wallets receive $SYRA holder discount pricing via `X-Payer-Address`

## Screenshots to capture (before publish)
1. Home markets + free headlines
2. Token detail with signal card + unlock CTA
3. Scout empty / results
4. Wallet with USDC + holder discount

Place PNGs in `dapp-store/assets/` as referenced by `config.yaml`.

## Build release APK
```bash
cd mobile/android
./gradlew assembleRelease
```

Signed APK path (default):
`android/app/build/outputs/apk/release/app-release.apk`

Configure signing in `android/app/build.gradle` / keystore before store submission.

## Publish (CLI)
```bash
npm i -g @solana-mobile/dapp-store-cli
# Create publisher NFT once, then app + release NFTs
npx dapp-store create publisher -k <publisher-keypair.json>
npx dapp-store create app -k <publisher-keypair.json> -c dapp-store/config.yaml
npx dapp-store create release -k <publisher-keypair.json> -c dapp-store/config.yaml
npx dapp-store publish submit -k <publisher-keypair.json> -c dapp-store/config.yaml
```

Never commit keypairs. Keep them in a local secrets path outside git.
