import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for LP Auto Earn Yield ship log (user-facing only). */
export const LP_EARN_YIELD_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `This cover announces LP Auto going live on Earn in beta.

Deposit SOL into the LP agent wallet and it farms Meteora fees for you, opening and managing positions while you stay non-custodial the whole time.

syraa.fun/earn?track=yield`,

  thesis: `This card names why most people never provide liquidity themselves.

LP fees are real money, but managing ranges, watching positions, and timing exits is a job. LP Auto puts that job on your agent wallet, so depositing is the only manual step left.

syraa.fun/earn?track=yield`,

  quote: `The line on this card is the whole product in four words: deposit SOL, earn fees.

It is your LP wallet running Syra's strategy. You keep the yield, minus a cut that only applies to net gains.

syraa.fun/earn?track=yield`,

  flow: `This image walks the setup in four steps.

1. Open the Yield tab under Earn
2. Enable LP Auto and set a 1 to 5 SOL cap
3. Fund the LP agent wallet
4. The agent farms fees from there

syraa.fun/earn?track=yield`,

  timeline: `This timeline shows the path from connecting a wallet to earning.

1. Sign in with your wallet to start a Syra session
2. Enable LP Auto and pick a max deposit
3. Send SOL to the LP wallet at /wallet?wallet=lp
4. Pause anytime, you stay in control the whole time

syraa.fun/wallet?wallet=lp`,

  pillars: `This bento layout shows the rules built to protect depositors.

Funds sit in your own LP agent wallet, non-custodial. The beta cap is 1 to 5 SOL so you start small. The performance fee is 10% and only applies to net-positive PnL. Deposits auto-pause if the strategy's health slips.

syraa.fun/earn?track=yield`,

  checklist: `This checklist is what to read before depositing.

1. Read the Yield disclosures
2. Only risk what you can afford to lose
3. Start at the 1 SOL minimum
4. Impermanent loss and fees can cut into returns

syraa.fun/earn?track=yield`,

  metrics: `The numbers on this card are a lab track record, not a guarantee.

The strategy closed roughly 90% of resolved positions as wins and produced about 12 SOL of net lab PnL. The public beta cap is 1 to 5 SOL per depositor.

syraa.fun/earn?track=yield`,

  featured: `This featured card lays out the exact path to your first deposit.

Open Earn, go to the Yield tab, enable LP Auto, then fund the LP wallet. From there the agent handles opening and managing Meteora positions.

syraa.fun/earn?track=yield`,

  comparison: `This before-and-after card compares the internal lab to the public Earn product.

Before, the real LP agent was internal and hard for anyone outside the team to try. Now there is a public Yield tab with capped deposits and clear fee and pause rules.

syraa.fun/earn?track=yield`,

  launch: `This launch card marks LP Auto as live on Earn.

Beta deposits are open between 1 and 5 SOL. The past lab results shown elsewhere in this deck are a track record, not a promise of future returns.

syraa.fun/earn?track=yield`,

  deepDive: `This deep-dive card explains the fee rule in plain terms.

The performance fee is 10% and it only applies to realized, net-positive PnL. It does not touch your original deposit, and it does not apply on flat or losing runs.

syraa.fun/earn?track=yield`,

  split: `This split card shows who controls what in the deposit loop.

You fund the wallet and can pause open positions or stop and close them whenever you want. The agent only farms inside the boundaries you set.

syraa.fun/earn?track=yield`,

  terminal: `This terminal card shows where LP Auto actually lives in the product.

The Yield tab under syraa.fun/earn is where you enable it. syraa.fun/wallet?wallet=lp is where you deposit SOL. From there the agent opens Meteora DLMM positions and you earn the fees.

syraa.fun/wallet?wallet=lp`,

  cta: `This closing card is the ship summary: fund the LP wallet and let the agent farm.

Open Earn, go to Yield, stay inside the 1 to 5 SOL cap, and pause anytime.

syraa.fun/earn?track=yield`,
};
