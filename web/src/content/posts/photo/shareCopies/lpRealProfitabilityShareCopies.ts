import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for LP Real Profitability photo deck: 15 distinct topics. */
export const LP_REAL_PROFITABILITY_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `SHIP LOG · Your live LP agent was closing winners on price drift alone. Fixed.

Fee-aware stops. Stricter pool gates. Trailing exits. On-chain fee grounding.

Fee-positive positions stay open. Unprofitable pools never open.

Explore → syraa.fun/lp-experiment`,

  thesis: `The sim lab caught it first: Loss status with positive PnL.

Price hit stop loss. LP fees still outweighed the move. The live agent used the same blunt rule, and dumped fee-positive trades.

Real exits now follow net economics, not price drift alone.`,

  quote: `"LP profitability is net economics, not price direction alone."

Fees earned extend the stop. Trailing rules lock winners. On-chain fees ground every exit on live Meteora positions.`,

  flow: `How live LP exits protect real SOL:

1. Track claimed + unclaimed on-chain fees
2. Extend price stop by fees already earned
3. Trail peak PnL and close on giveback
4. Mark win or loss by net PnL, not drift alone

Fee-positive trades stay open longer. Tail risk stays capped.`,

  timeline: `From sim bug to live fix:

→ Sim showed Loss + green PnL on fee-heavy pools
→ Fee-aware stop: fees extend the price stop
→ Hard stop at 1.4× caps catastrophic IL
→ Trailing stop locks fee winners before giveback
→ Chain-cost gate blocks opens that can't pay for themselves`,

  pillars: `4 gates between your wallet and bad LP trades:

→ Fee-aware stop: fees extend stop, hard cap on tail risk
→ Cost gate: expected fees must beat 1.6× tx costs
→ Pool screen: 0.55 R:R hurdle, extreme pools banned
→ Adaptive exits: pool-aware rules frozen at open`,

  checklist: `LP real profitability checklist. What changed:

→ Fee-aware stop loss with hard IL cap
→ Chain-cost viability gate before every open
→ Trailing stop on live Meteora positions
→ On-chain fees ground exit PnL decisions`,

  metrics: `1.6× min fee-to-cost at open. 0.55 real pool R:R hurdle. 1.4× hard stop multiplier.

Three thresholds that keep live LP capital out of fee-negative and IL-heavy pools.

Sim proved the edge case. Real agent now enforces it.`,

  featured: `Fee-positive positions no longer close as losses.

When LP fees outweigh price drift, the live agent holds. When fees can't cover chain costs, it never opens.

Net economics drive every exit, not raw price alone.`,

  comparison: `Before:
Closed on raw price drift. Fee-positive positions exited as losses. Extreme pools could qualify.

Now:
Fee-aware stops. Trailing exits. Stricter pool screen. On-chain fees ground PnL.

The sim lab bug is fixed for real SOL.`,

  launch: `SHIP LOG · LP Real Agent Profitability is live.

Fee-aware exits. Pool gates. Trailing stops. On-chain fee grounding.

Your Meteora LP agent now holds fee winners and skips pools that can't pay for themselves.

Try it → syraa.fun/lp-experiment`,

  deepDive: `LP real profitability technical surface:

→ evaluateRealPositionExit: fee-aware stop + trailing
→ passesRealPoolScreen: 0.55 R:R, extreme tier banned
→ Chain-cost gate in attemptOpenLpRealPosition
→ peakPnlPct persisted on LpRealPosition for trailing

Sim logic. Live enforcement. On-chain proof.`,

  split: `Sim exposed the gap. Live agent closes it.

SIM LAB
Loss + green PnL when fees beat price drift. Proof the exit logic was wrong.

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

Prove the edge in sim. Deploy with fee-aware protection on real SOL.`,
};
