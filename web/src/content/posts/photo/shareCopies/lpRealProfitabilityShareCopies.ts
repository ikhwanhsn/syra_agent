import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for LP Real Profitability photo deck: 15 distinct topics. */
export const LP_REAL_PROFITABILITY_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `This cover announces a fix to how live LP agents decide when to exit.

Live Meteora LP agents now hold onto fee winners, skip pools that cannot pay for themselves, and exit based on net economics instead of price drift alone.

syraa.fun/lp-experiment`,

  thesis: `This card states the bug the update fixes.

In the sim lab, a position could show a Loss status while its Sim PnL stayed green, because the stop rule only looked at price. The live agent used the same blunt rule and closed fee-positive trades purely on price drift.

syraa.fun/lp-experiment`,

  quote: `This card carries the rule behind the fix: LP profitability comes from net economics, not price direction alone.

Fees already earned now extend the stop, trailing rules lock in winners, and on-chain fees ground every exit decision on live Meteora positions.

syraa.fun/lp-experiment`,

  flow: `This image walks through the new exit logic, in four steps.

1. Track claimed and unclaimed on-chain fees for every open position
2. Extend the price stop by the fees already earned, with a hard cap on impermanent loss
3. Trail the peak PnL and close on giveback to bank fees before they fade
4. Mark the trade win or loss by net PnL, not by price drift alone

syraa.fun/lp-experiment`,

  timeline: `This timeline traces the fix from sim discovery to live enforcement.

1. The sim lab exposed a Loss status alongside a positive PnL on fee-heavy pools
2. A fee-aware stop now lets fees earned extend the price stop by up to half its distance
3. A cost gate requires 1.6x expected fees over transaction costs, and a pool screen requires a 0.55 risk to reward ratio before opening
4. Live positions now track a peak PnL percentage and lock in winners on a trailing stop

syraa.fun/lp-experiment`,

  pillars: `This bento layout shows the four gates between your wallet and a bad LP trade.

The fee-aware stop lets earned fees extend the stop, with a hard stop at 1.4x to cap tail risk. The cost gate blocks an open unless expected fees clear 1.6x transaction costs. The pool screen requires a 0.55 risk to reward ratio and bans extreme-risk pools from real capital. Adaptive exits freeze pool-aware stop and take-profit levels at the moment a position opens.

syraa.fun/lp-experiment`,

  checklist: `This checklist covers what changed in LP real profitability.

1. A fee-aware stop loss with a hard impermanent loss cap
2. A chain-cost viability gate that runs before every open
3. A trailing stop applied to live Meteora positions
4. On-chain fees now ground every exit PnL decision

syraa.fun/lp-experiment`,

  metrics: `This card lists the three thresholds guarding real capital.

A pool needs at least 1.6 times its transaction cost in expected fees to open. It needs a 0.55 risk to reward ratio to pass the real pool screen. And a hard stop at 1.4 times the base distance caps how much impermanent loss any single position can take.

syraa.fun/lp-experiment`,

  featured: `This featured card highlights how the agent now treats fee-positive trades.

When LP fees outweigh price drift, the agent holds the position instead of closing it. When a pool cannot cover its own chain costs, the position never opens in the first place.

syraa.fun/lp-experiment`,

  comparison: `This before and after card compares the old and new exit logic.

Before, positions closed on raw price drift, so fee-positive trades could still exit as losses, and extreme-risk pools could still qualify for real capital. Now, fee-aware stops, trailing exits, and a stricter pool screen all ground exits in on-chain fee data.

syraa.fun/lp-experiment`,

  launch: `This launch card marks LP Real Profitability as live.

The sim lab bug is now fixed for real SOL. The live agent holds fee winners, skips pools that cannot pay for themselves, and exits based on fee-aware stops, pool gates, and trailing rules.

syraa.fun/lp-experiment`,

  deepDive: `This deep-dive card lists the technical surface behind the fix.

evaluateRealPositionExit now runs the fee-aware stop and trailing logic. passesRealPoolScreen enforces the 0.55 risk to reward hurdle and bans the extreme tier. A chain-cost gate sits inside attemptOpenLpRealPosition, and peakPnlPct is persisted on each LpRealPosition to track the trailing stop.

syraa.fun/lp-experiment`,

  split: `This split card explains how the sim lab and the live agent connect.

The sim lab first exposed the gap: a Loss status next to a green PnL whenever fees outweighed price drift. The live agent now closes that gap by extending stops with fees earned and trailing the peak net PnL, using the same economics model as the lab.

syraa.fun/lp-experiment`,

  terminal: `This terminal card shows a resolve tick on a real position.

Resolving the Bountywork/SOL position shows net PnL at plus 7.86 percent even while price moved down 8.2 percent, because 0.0968 SOL in earned fees extended the stop. Peak PnL sits at 9.1 percent and the trailing giveback has not triggered, so the agent keeps holding a fee-positive position despite the price drift.

syraa.fun/lp-experiment`,

  cta: `This closing card points to where to see the fix in action.

Watch sim leaders prove out on the LP experiment page, check the real agent tab for live positions, or fund your LP wallet in settings to enable fee-aware protection on real SOL.

syraa.fun/lp-experiment
syraa.fun/lp-experiment#real-agent
syraa.fun/settings`,
};
