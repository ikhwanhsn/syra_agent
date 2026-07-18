import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Invest Solana Protocols photo deck. 15 distinct topics. */
export const INVEST_SOLANA_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `SHIP LOG · Invest × Solana DeFi.

Five onchain protocols on the board.
Live APY/TVL. LST deposits in-app.

Marinade. Jito. Kamino. marginfi. Meteora.

Try it → syraa.fun/invest`,

  thesis: `Invest was a swap card. Now it is a yield board.

Real Solana venues with live APY and TVL.
Liquid stake from your invest agent wallet.

Browse. Fund. Deploy.`,

  quote: `"Browse yields. Deposit onchain."

Marinade + Jito in-app.
Kamino, marginfi, Meteora via dApp.
Policy-gated from the invest wallet.`,

  flow: `Invest deploy loop:

1. Open Invest (live APY/TVL)
2. Fund your invest agent wallet
3. Deposit SOL into Marinade or Jito
4. Or open Kamino / marginfi / Meteora

Same board. Clear next action.`,

  timeline: `What shipped:

→ investCatalog: 5 Solana protocols
→ DefiLlama yields + TVL on every card
→ POST /invest/deposit (marinade + jito)
→ walletBroker signs from invest wallet
→ Deep-links for lending + DLMM`,

  pillars: `3 layers. One Invest surface:

→ CATALOG: five protocols, kinds, deep links
→ YIELDS: DefiLlama APY/TVL (cached)
→ BROKER: Marinade + Jito txs, policy-gated`,

  checklist: `Invest Solana is live:

→ Five protocols on /invest
→ Live APY badge + TVL
→ Marinade + Jito deposit modal
→ Kamino, marginfi, Meteora deep-links
→ Invest wallet signs deposits

Open → syraa.fun/invest`,

  metrics: `By the numbers:

→ 5 onchain Solana protocols
→ 2 in-app liquid staking deposits
→ 1 invest agent wallet for signing

Live APY/TVL from DefiLlama.`,

  featured: `The two deposits that stay in Syra:

Marinade → mSOL
Jito → JitoSOL

Unsigned tx built on the API.
Signed by your invest agent wallet.`,

  comparison: `Before: Invest showed Jupiter swap only.

Now: five Solana protocols with live yields.
In-app LST for Marinade + Jito.
Deep-links for lending and DLMM.`,

  launch: `SHIP LOG · Invest gets Solana DeFi.

Five protocols. Live APY/TVL.
Deposits from your invest wallet.

→ syraa.fun/invest
→ syraa.fun/wallet`,

  deepDive: `Technical surface:

→ api/config/investCatalog.js
→ investYieldsService (DefiLlama)
→ marinadeExecutor + jitoStakePoolExecutor
→ POST /invest/deposit → walletBroker
→ InvestPage cards + InvestDepositModal`,

  split: `Two paths. One Invest board:

IN-APP: Marinade + Jito liquid stake
EXTERNAL: Kamino, marginfi, Meteora dApps

Live numbers either way. Clear CTAs.`,

  terminal: `Deposit from the stack:

$ GET /invest/opportunities
> catalog + DefiLlama APY/TVL
$ POST /invest/deposit
> build marinade|jito unsigned tx
> walletBroker.executeIntent(tx_sign)
< signature → invest wallet holds LST`,

  cta: `Ready to deploy on Solana?

Invest → syraa.fun/invest
Fund → syraa.fun/wallet
Swap → syraa.fun/swap`,
};
