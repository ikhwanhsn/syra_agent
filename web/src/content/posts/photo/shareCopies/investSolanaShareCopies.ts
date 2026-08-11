import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Invest Solana Protocols photo deck. 15 distinct topics. */
export const INVEST_SOLANA_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Invest × Solana is live.

Five onchain protocols show live APY and TVL. You can liquid stake from your invest wallet: stake SOL and get a token back that still earns.

syraa.fun/invest`,

  thesis: `Invest was a swap widget. Now it is a yield board.

Five Solana venues with live APY and TVL. Marinade and Jito deposits run from the invest wallet.

syraa.fun/invest`,

  quote: `Browse yields, then deposit onchain.

Liquid staking stays in-app. Lending and providing tokens so others can trade (and earning a cut of fees) open through each protocol's own site. Policy-gated.

syraa.fun/invest`,

  flow: `Browse, fund, then deposit or open.

1. Browse live APY and TVL
2. Fund the invest agent treasury
3. Stake into Marinade or Jito in-app
4. Open Kamino, marginfi, or Meteora for the rest

syraa.fun/invest`,

  timeline: `From one swap to five Solana venues.

1. Catalog: five protocols listed
2. Yields: DefiLlama APY and TVL
3. Deposit: POST /invest/deposit
4. Broker: invest wallet signs

syraa.fun/invest`,

  pillars: `Four protocol kinds on one Invest board.

Marinade turns SOL into mSOL in-app. Jito turns SOL into JitoSOL in-app. Kamino is lending via a deep link to vaults. Meteora is providing tokens so others can trade, via a DLMM deep link.

syraa.fun/invest`,

  checklist: `Invest Solana is live now.

1. Five protocols on /invest
2. Live APY badge plus TVL
3. Marinade and Jito deposit modal
4. Kamino, marginfi, and Meteora links
5. Invest wallet signs deposits

syraa.fun/invest`,

  metrics: `Real venues, live numbers, onchain.

5 protocols. 2 in-app liquid staking options. 1 invest wallet.

APY and TVL come from DefiLlama. Yield is not guaranteed.

syraa.fun/invest`,

  featured: `Two deposits stay inside Syra.

Marinade and Jito stay inside Syra. The API builds an unsigned transaction. Your invest agent wallet signs it.

syraa.fun/invest`,

  comparison: `Swap-only board vs Solana yield board.

Before, Invest showed a Jupiter swap only, with no live yields. Now five protocols show live APY and TVL, with in-app liquid staking deposits.

syraa.fun/invest`,

  launch: `Syra × Solana DeFi is live.

Five onchain venues with live yields, and deposits from your invest wallet.

syraa.fun/invest
syraa.fun/wallet`,

  deepDive: `Wired into Invest and walletBroker.

investCatalog.js lists five protocols. investYieldsService pulls DefiLlama. Marinade and Jito stake-pool executors build the txs. POST /invest/deposit goes through walletBroker.

syraa.fun/invest`,

  split: `In-app liquid staking. External lending and LP.

Marinade and Jito deposit in Syra. Kamino, marginfi, and Meteora open their dApps. Every protocol shows live APY and TVL. The invest wallet signs LST deposits after policy and simulation. Deep links cover the rest.

syraa.fun/invest`,

  terminal: `A deposit in the stack.

GET /invest/opportunities returns catalog plus DefiLlama yields. POST /invest/deposit builds a Marinade or Jito tx, walletBroker.executeIntent signs it, and the liquid staking token lands in the invest wallet.

syraa.fun/invest`,

  cta: `Open Invest. Deploy on Solana.

Fund your invest wallet, then liquid stake in-app or open a linked dApp.

syraa.fun/invest
syraa.fun/wallet
syraa.fun/swap`,
};
