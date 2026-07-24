import type { PostPhotoCardRole } from "../photoCardSlots";

export const LST_LOOP_LAB_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `This cover announces the Leveraged LST Loop lab running on paper before Earn.

It loops staked SOL through mSOL or JitoSOL positions with borrowed SOL layered on top, but only in simulation for now. An Earn card is coming soon, once the health rules prove out.

syraa.fun/earn?track=yield`,

  thesis: `This card names the tradeoff at the center of a leveraged LST loop.

Looping amplifies staking yield, and it amplifies liquidation risk the same way. Leverage tiers and rate spikes get simulated on paper first, before any depositor's SOL touches the actual loop.

syraa.fun/earn?track=yield`,

  quote: `The line on this card is the loop mechanics in order: stake, borrow, restake, guard.

Leverage without a kill band is how accounts get liquidated. The health band gets simulated on paper before it ever runs against real deposits.

syraa.fun/earn?track=yield`,

  flow: `This image walks the loop mechanics in four steps.

1. Stake SOL into mSOL or JitoSOL
2. Borrow SOL against the LST under a capped LTV
3. Restake the borrowed SOL to reach target leverage
4. Deleverage automatically on a health or rate trip

syraa.fun/earn?track=yield`,

  timeline: `This timeline shows what to do now versus once the lab graduates.

1. Open the Yield tab to see the LST Loop card
2. Wait for the paper gate to clear
3. Fund the invest wallet with SOL once beta opens
4. Enable it and stay inside the deposit cap

syraa.fun/wallet?wallet=invest`,

  pillars: `This bento layout shows the guardrails built in before any leverage runs live.

Leverage caps are tiered, so loops cannot run unbounded. A minimum health factor triggers auto-exit if it slips. A borrow-rate kill unwinds the loop if borrow APR spikes. A paper gate of 50 or more trades has to clear with positive expectancy first.

syraa.fun/earn?track=yield`,

  checklist: `This checklist is what to read before enabling LST Loop, once it opens.

1. Understand that leverage can get you liquidated
2. Only risk what you can afford to lose
3. Borrow rates can exceed the staking yield they're funding
4. Past paper performance is not a guarantee of future returns

syraa.fun/earn?track=yield`,

  metrics: `The numbers on this card describe status, not a promise.

The lab runs at roughly 2x typical leverage and needs 50 or more decided trades to graduate. The planned beta cap is 1 to 10 SOL per depositor.

syraa.fun/earn?track=yield`,

  featured: `This featured card lays out the path once LST Loop opens.

Go to Earn, open the Yield tab, and find the LST Loop card, currently listed as coming soon. SOL deposits unlock only after the strategy graduates.

syraa.fun/earn?track=yield`,

  comparison: `This before-and-after card compares the state of Earn before and after this ship.

Before, there was no leveraged LST product on Earn at all. Now the paper loop lab is live and an Earn card is listed, marked coming soon until it graduates.

syraa.fun/earn?track=yield`,

  launch: `This launch card marks the LST Loop lab as live in paper form.

It is looping on simulated positions right now. Earn deposits open only after graduation, not before.

syraa.fun/earn?track=yield`,

  deepDive: `This deep-dive card is a plain statement of the risk involved.

Leverage amplifies losses the same way it amplifies yield. The strategy auto-deleverages when health slips, and rate spikes can still force an exit. It is not free yield.

syraa.fun/earn?track=yield`,

  split: `This split card explains the sequence depositors should expect.

You watch the lab first. The loop accrues a track record on paper. You only deposit after it graduates, there is no early or FOMO enable option.

syraa.fun/earn?track=yield`,

  terminal: `This terminal card shows where the LST Loop lives today and later.

The Leveraged LST Loop card sits under syraa.fun/earn?track=yield. SOL deposits will go to syraa.fun/wallet?wallet=invest once beta opens. Right now the paper lab is accruing toward graduation into a capped real strategy.

syraa.fun/earn?track=yield`,

  cta: `This closing card is the ship summary: follow the LST Loop lab and deposit only after graduation.

Open Earn, go to Yield, and watch for the cap to lift.

syraa.fun/earn?track=yield`,
};
