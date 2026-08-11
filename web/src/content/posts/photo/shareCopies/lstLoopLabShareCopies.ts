import type { PostPhotoCardRole } from "../photoCardSlots";

export const LST_LOOP_LAB_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `The Leveraged LST Loop is an experiment running on paper before Earn.

It loops staked tokens you can still use, mSOL or JitoSOL, with borrowed SOL layered on top, but only in simulation for now. An Earn listing is coming soon, once the health rules prove out. This is not a return guarantee.

syraa.fun/earn?track=yield`,

  thesis: `Looping can amplify staking yield, and it can amplify liquidations the same way.

Leverage tiers and rate spikes get simulated on paper first, before any depositor's SOL touches the actual loop.

syraa.fun/earn?track=yield`,

  quote: `Stake, borrow, restake, then guard.

Leverage without a kill band is how accounts get liquidated. The health band gets simulated on paper before it ever runs against real deposits.

syraa.fun/earn?track=yield`,

  flow: `The loop is four steps, then a guard.

1. Stake SOL into mSOL or JitoSOL, staked tokens you can still use
2. Borrow SOL against that position under a capped LTV
3. Restake the borrowed SOL to reach target leverage
4. Deleverage automatically on a health or rate trip

syraa.fun/earn?track=yield`,

  timeline: `Watch the experiment now, and deposit later.

1. Open the Yield tab to see the LST Loop listing
2. Wait for the paper gate to clear
3. Fund the invest wallet with SOL once beta opens
4. Enable it and stay inside the deposit cap

syraa.fun/wallet?wallet=invest`,

  pillars: `Guardrails come first.

Leverage caps are tiered, so loops cannot run unbounded. A minimum health factor triggers auto-exit if it slips. A borrow-rate kill unwinds the loop if borrow APR spikes. A paper gate of 50 or more trades has to clear with the experiment coming out ahead on paper first.

syraa.fun/earn?track=yield`,

  checklist: `Read this before enabling LST Loop, once it opens.

1. Understand that leverage can get you liquidated
2. Only risk what you can afford to lose
3. Borrow rates can exceed the staking yield they are funding
4. Past paper results are not future returns

syraa.fun/earn?track=yield`,

  metrics: `Status, not a promise.

The experiment runs at roughly 2x typical leverage and needs 50 or more decided trades to graduate. The planned beta cap is 1 to 10 SOL per depositor.

syraa.fun/earn?track=yield`,

  featured: `Earn, then Yield, then LST Loop, then fund, and only after graduation.

The listing is coming soon. SOL deposits unlock after the paper experiment graduates. No early enable.

syraa.fun/earn?track=yield`,

  comparison: `Earn had no leveraged LST product. Now the paper experiment is listed.

Before, there was nothing to watch. Now the loop lab is live on paper and an Earn listing is marked coming soon until it graduates.

syraa.fun/earn?track=yield`,

  launch: `The LST Loop lab is live as a paper experiment.

It is looping on simulated positions right now. Earn deposits open only after graduation, not before.

syraa.fun/earn?track=yield`,

  deepDive: `Leverage amplifies losses the same way it amplifies yield.

The strategy auto-deleverages when health slips, and rate spikes can still force an exit. It is not free yield.

syraa.fun/earn?track=yield`,

  split: `Watch first, accrue a paper record, and deposit only after graduation.

There is no early or FOMO enable. The experiment has to graduate first.

syraa.fun/earn?track=yield`,

  terminal: `Where the LST Loop lives today and later.

The Leveraged LST Loop listing sits under syraa.fun/earn?track=yield. SOL deposits will go to syraa.fun/wallet?wallet=invest once beta opens. Right now the paper experiment is accruing toward a capped real strategy.

syraa.fun/earn?track=yield`,

  cta: `Follow the LST Loop experiment. Deposit only after graduation.

Open Earn, go to Yield, and wait for the cap to lift. Paper results are not future returns.

syraa.fun/earn?track=yield`,
};
