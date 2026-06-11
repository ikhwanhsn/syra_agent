import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for LP Real Profitability photo deck — 15 distinct topics. */
export const LP_REAL_PROFITABILITY_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Live LP agents just got a profitability overhaul.

Fee-aware stops. Stricter pool gates. Trailing exits. On-chain fee grounding.

Your real agent will not dump a fee-positive position just because price drifted.

Explore → syraa.fun/lp-experiment`,

  thesis: `The sim lab exposed a bug: Loss status with positive PnL.

Price hit stop loss, but LP fees outweighed the move. The live agent used the same blunt rule.

Now real exits use net economics, not price drift alone.`,

  quote: `"LP profitability is net economics, not price direction alone."

Fees earned extend the stop. Trailing rules lock winners. On-chain fees ground every exit decision.`,

  flow: `How live LP exits work now:

1. Track claimed + unclaimed on-chain fees
2. Extend price stop by fees already earned
3. Trail peak PnL and close on giveback
4. Mark win or loss by net PnL, not drift alone

Fee-positive trades stay open longer.`,

  timeline: `From sim insight to live fix:

→ Sim showed Loss + green PnL on fee-heavy pools
→ Fee-aware stop: fees extend the price stop
→ Hard stop at 1.4× caps catastrophic IL
→ Trailing stop locks fee winners before giveback
→ Chain-cost gate blocks unprofitable opens`,

  pillars: `4 gates that protect real SOL:

→ Fee-aware stop: fees extend stop, hard cap on tail risk
→ Cost gate: expected fees must beat 1.6× tx costs
→ Pool screen: 0.55 R:R hurdle, extreme pools banned
→ Adaptive exits: pool-aware rules frozen at open`,

  checklist: `LP real profitability upgrade:

→ Fee-aware stop loss with hard IL cap
→ Chain-cost viability gate before every open
→ Trailing stop on live Meteora positions
→ On-chain fees ground exit PnL decisions`,

  metrics: `1.6× min fee-to-cost at open. 0.55 real pool R:R hurdle. 1.4× hard stop multiplier.

Three numbers that keep live LP capital out of fee-negative and IL-heavy pools.

Sim proved the edge case. Real agent now closes the gap.`,

  featured: `Fee-positive positions no longer close as losses.

When LP fees outweigh price drift, the live agent holds. When fees cannot cover chain costs, it never opens.

Net economics drive every exit.`,

  comparison: `Before:
Live agent closed on raw price drift. Fee-positive positions exited as losses. Extreme pools could qualify.

Now:
Fee-aware stops. Trailing exits. Stricter pool screen. On-chain fees ground PnL.

The sim lab bug is fixed for real SOL.`,

  launch: `SHIP LOG · LP Real Agent Profitability is live.

Fee-aware exits. Pool gates. Trailing stops. On-chain fee grounding.

Your Meteora LP agent just got smarter about when to hold and when to close.

Try it → syraa.fun/lp-experiment`,

  deepDive: `LP real profitability — technical surface:

→ evaluateRealPositionExit: fee-aware stop + trailing
→ passesRealPoolScreen: 0.55 R:R, extreme tier banned
→ Chain-cost gate in attemptOpenLpRealPosition
→ peakPnlPct persisted on LpRealPosition for trailing`,

  split: `Sim insight vs live fix.

SIM LAB
Loss + green PnL when fees beat price drift. Exposed the exit logic gap.

LIVE AGENT
Fee-aware stop. Trailing exit. Cost gate. On-chain fee grounding.

Same economics model. Smarter real-money decisions.`,

  terminal: `LP real agent resolve tick:

$ syra lp real --resolve
> pool Bountywork/SOL · +7.86% net · price -8.2%
> fees earned: 0.0968 SOL · stop extended by fee offset
> peak PnL 9.1% · trailing giveback not triggered
> holding · fee-positive despite price drift

Net economics, not price alone.`,

  cta: `Ready for smarter live LP exits?

→ Sim lab: syraa.fun/lp-experiment
→ Real agent: syraa.fun/lp-experiment#real-agent
→ Fund wallet: syraa.fun/settings

Fee-aware stops. Trailing protection. Pools that pay for themselves.`,
};
