import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for Invest Solana Protocols photo deck. 15 distinct topics. */
export const INVEST_SOLANA_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `This cover announces the Invest page turning into a real Solana yield board.

Five onchain protocols now show live APY and TVL, and liquid staking deposits can be made directly from the invest wallet.

syraa.fun/invest`,

  thesis: `This card names the shift Invest just made.

It used to be a single swap card. Now it is a yield board covering five Solana venues with live APY and TVL, where Marinade and Jito deposits run directly from the invest agent wallet.

syraa.fun/invest`,

  quote: `The line on this card is the workflow in plain words: browse yields, deposit onchain.

Liquid staking happens in-app, while lending and LP positions open through each protocol's own dApp, all gated by the invest wallet's policy.

syraa.fun/invest`,

  flow: `This image walks the deploy loop in four steps.

1. Browse live APY and TVL across the five listed protocols
2. Fund the invest agent's treasury wallet
3. Stake into Marinade or Jito directly in-app
4. Open Kamino, marginfi, or Meteora to deploy elsewhere

syraa.fun/invest`,

  timeline: `This timeline shows how the board grew from one swap to five venues.

1. A catalog of five protocols was added to the page
2. Live APY and TVL numbers were pulled in from DefiLlama
3. A POST /invest/deposit route was built for on-chain deposits
4. The invest wallet's broker signs the resulting transaction

syraa.fun/invest`,

  pillars: `This bento layout groups the four kinds of protocols on the board.

Marinade is a liquid staking venue where SOL becomes mSOL with an in-app deposit. Jito is the same idea, turning SOL into JitoSOL. Kamino is a lending venue reached through a deep link to its vaults. Meteora is a liquidity venue reached through a deep link to its DLMM pools.

syraa.fun/invest`,

  checklist: `This checklist is what shipped on Invest.

1. Five protocols are listed on the /invest page
2. Every card shows a live APY badge and TVL
3. Marinade and Jito both have an in-app deposit modal
4. Kamino, marginfi, and Meteora link out to their own dApps
5. The invest wallet signs every in-app deposit

syraa.fun/invest`,

  metrics: `The numbers on this card describe the board.

Five protocols are listed, two of them, Marinade and Jito, support an in-app deposit, and one invest wallet handles the signing for both. APY and TVL come from DefiLlama, and yield is never guaranteed.

syraa.fun/invest`,

  featured: `This featured card is about the two deposits that stay entirely inside Syra.

Marinade turns SOL into mSOL and Jito turns SOL into JitoSOL. The API builds an unsigned transaction, and the invest agent wallet signs it.

syraa.fun/invest`,

  comparison: `This before-and-after card compares the old swap-only card to the current yield board.

Before, Invest only showed a Jupiter swap widget with no live yield data. Now, five protocols show live APY and TVL, with in-app liquid staking deposits for two of them.

syraa.fun/invest`,

  launch: `This launch card marks Invest expanding into Solana DeFi.

Five onchain venues are listed with live yields, and deposits into the liquid staking pools run straight from the invest wallet.

syraa.fun/invest
syraa.fun/wallet`,

  deepDive: `This deep-dive card lists the technical surface behind the board.

investCatalog.js defines the five protocols, investYieldsService pulls live numbers from DefiLlama, and dedicated Marinade and Jito stake-pool executors build the deposit transactions that POST /invest/deposit routes through the wallet broker.

syraa.fun/invest`,

  split: `This split card explains the two paths on the board.

Marinade and Jito deposits stay in-app, signed by the invest wallet after a policy check and simulation. Kamino, marginfi, and Meteora open their own dApps for lending and liquidity positions.

syraa.fun/invest`,

  terminal: `This terminal card shows a deposit in a real request path.

A call to GET /invest/opportunities returns the catalog with DefiLlama yields, then POST /invest/deposit builds a Marinade or Jito transaction and hands it to the wallet broker to execute, leaving the resulting LST sitting in the invest wallet.

syraa.fun/invest`,

  cta: `This closing card is the ship summary: open Invest and deploy on Solana.

Fund the invest wallet first, then either liquid stake in-app or open one of the linked dApps.

syraa.fun/invest
syraa.fun/wallet
syraa.fun/swap`,
};
