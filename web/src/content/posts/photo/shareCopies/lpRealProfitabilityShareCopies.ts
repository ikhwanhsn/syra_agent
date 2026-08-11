import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for LP Real Profitability photo deck: 15 distinct topics. */
export const LP_REAL_PROFITABILITY_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `LP Real Profitability is live.

Live Meteora agents now hold fee winners, skip pools that cannot pay for themselves, and exit on net economics, not price drift alone. LP here means providing tokens so others can trade, and earning a cut of fees.

syraa.fun/lp-experiment`,

  thesis: `Price stops were ignoring fees already earned.

In the sim lab, a position could show Loss while Sim PnL stayed green. The live agent used the same blunt rule and closed fee-positive trades on raw price drift.

syraa.fun/lp-experiment`,

  quote: `LP profitability is net economics, not price direction alone.

Fees earned extend the stop. Trailing rules lock winners. On-chain fees ground every exit on live Meteora positions.

syraa.fun/lp-experiment`,

  flow: `Track fees, extend the stop, trail the peak, close on net.

1. Track claimed and unclaimed on-chain fees so PnL is grounded
2. Fees earned push the price stop wider, with a hard IL cap
3. Trail the peak and close on giveback to bank fees before they fade
4. Exit status follows net PnL, not drift alone

syraa.fun/lp-experiment`,

  timeline: `From lab proof to production enforcement.

1. Sim exposed Loss status with green PnL on fee-heavy pools
2. Fee-aware stop: fees extend the price stop by up to half its distance
3. Cost and pool gates: 1.6x tx costs and 0.55 R:R before open
4. Trailing on live: peakPnlPct tracked, winners locked on giveback

syraa.fun/lp-experiment`,

  pillars: `Four gates between your wallet and a bad LP trade.

Fee-aware stop lets fees extend the stop, with a hard stop at 1.4x to cap tail IL. Cost gate: no open until expected fees are 1.6x transaction costs. Pool screen: 0.55 R:R, and extreme-risk pools banned from real capital. Adaptive exits freeze pool-aware stop and take-profit from live fee/TVL at open.

syraa.fun/lp-experiment`,

  checklist: `What changed for live LP profitability.

1. Fee-aware stop loss with a hard IL cap
2. Chain-cost viability gate before every open
3. Trailing stop on live Meteora positions
4. On-chain fees ground exit PnL decisions

syraa.fun/lp-experiment`,

  metrics: `Three thresholds that guard real capital.

1.6x minimum fee-to-cost at open. 0.55 real pool R:R hurdle. 1.4x hard stop multiplier.

Pools must pay for themselves. Exits follow net economics. Tail risk stays capped.

syraa.fun/lp-experiment`,

  featured: `Fee-positive positions stay open longer.

When LP fees outweigh price drift, the agent holds. When fees cannot cover chain costs, it never opens. Net economics drive every exit.

syraa.fun/lp-experiment`,

  comparison: `Raw price drift vs net economics.

Before, the agent closed on raw price drift, so fee-positive positions exited as losses, and extreme pools could still qualify. Now fee-aware stops, trailing exits, a stricter pool screen, and on-chain fees ground PnL.

syraa.fun/lp-experiment`,

  launch: `LP Real Profitability is live.

Fee-aware exits, pool gates, and trailing stops for live Meteora LP. The sim lab bug is fixed for real SOL. Hold fee winners. Skip pools that cannot pay for themselves.

syraa.fun/lp-experiment`,

  deepDive: `End-to-end profitability stack.

evaluateRealPositionExit runs fee-aware stop plus trailing. passesRealPoolScreen enforces 0.55 R:R and bans the extreme tier. A chain-cost gate sits in attemptOpenLpRealPosition. peakPnlPct on LpRealPosition tracks the trail.

syraa.fun/lp-experiment`,

  split: `Sim exposed the gap. The live agent closes it.

Sim showed Loss plus green PnL. Live now extends stops by fees earned and trails peak net PnL. On-chain fees ground exits. A hard stop caps catastrophic IL. A cost gate runs before every open. Trailing locks fee winners.

syraa.fun/lp-experiment`,

  terminal: `A resolve tick on a real position.

Bountywork/SOL: net +7.86%, price -8.2%. Fees earned 0.0968 SOL, stop extended. Peak PnL 9.1%, trailing not triggered. Holding, fee-positive despite drift. Net economics, not price alone.

syraa.fun/lp-experiment`,

  cta: `Prove the edge in sim. Deploy with fee-aware protection.

Watch sim leaders prove out, then enable your LP agent with smarter exits on real SOL.

syraa.fun/lp-experiment
syraa.fun/lp-experiment#real-agent
syraa.fun/settings`,
};
