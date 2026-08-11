import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for LP Agent photo deck: 15 distinct topics. */
export const LP_AGENT_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `The LP Agent System is live.

LP here means providing tokens so others can trade, and earning a cut of fees. 78 strategies compete in sim on Meteora DLMM. Your agent deploys SOL only when a leader proves out.

syraa.fun/lp-experiment`,

  thesis: `Meteora bins do not wait for you.

Fee yield, losses when prices move against your range, and out-of-range exits need constant attention. Syra LP agents screen pools, size positions, and manage exits so you can deploy capital without watching charts all day.

syraa.fun/lp-experiment`,

  quote: `Prove it in sim, then deploy the same math on-chain.

Paper winners and live LP used different economics. Syra unified the model, so trust earned in the lab transfers to real SOL.

syraa.fun/lp-experiment`,

  flow: `Four steps from screen to earn.

1. Screen Meteora pools on fee/TVL, organic score, smart money, and risk/reward
2. Run the sim lab: 78 strategies evolve daily with zero SOL at risk
3. Fund the LP wallet, pass the profit gate, toggle live
4. Collect fees in DLMM bins. Jupiter sidecar handles exits

syraa.fun/lp-experiment`,

  timeline: `No live deploy until the leader earns it.

1. Pool screen ranks Meteora SOL pools on fee/TVL and smart money
2. Daily sim race: 78 strategies compete, and a real mirror tracks the PnL leader
3. Profit gate: live opens blocked until the leader clears a 52% win rate
4. On-chain: open bins, earn fees, claim yield, Jupiter sweep

syraa.fun/lp-experiment`,

  pillars: `Built for real LP, not paper trading.

A real mirror (strategy 98) tracks the live PnL leader and pool screen. Hold guards wait 45 to 90 minutes before an out-of-range exit, so fees get collected first. The profit gate blocks live until the leader clears 52% win rate over 6+ closes. Jupiter sidecar sweeps exits on-chain, with an optional fee on referral accounts.

syraa.fun/lp-experiment`,

  checklist: `What ships with LP agents.

1. 78 strategies: static roster, daily evo spawns, and a real mirror
2. One lpEconomicsModel: same math in sim and live
3. Meteora DLMM open, hold, claim, and close on-chain
4. Jupiter sidecar sweeps with optional platform fees

syraa.fun/lp-experiment`,

  metrics: `One model, sim proof, then live deploy.

78 evolving LP strategies. Meteora DLMM for on-chain execution. 1 shared economics model.

Watch strategies compete in sim. When a leader clears the profit gate, flip live with identical signals and exit rules.

syraa.fun/lp-experiment`,

  featured: `Test 78 strategies with zero SOL at risk.

The lab screens Meteora pools and evolves strategies daily. Your SOL only deploys when a leader clears the profit gate.

syraa.fun/lp-experiment`,

  comparison: `Paper winners are not live confidence.

Before, sim and live ran different math, so deploying SOL meant guessing if paper PnL would hold. Now one economics model, a mirror agent, profit gates, and Meteora DLMM execution carry the same rules from sim to live.

syraa.fun/lp-experiment`,

  launch: `LP Agent System is live.

Sim lab, then profit gate, then live Meteora DLMM. 78 strategies compete daily. Real mirror. Profit gates. Non-custodial on-chain execution.

syraa.fun/lp-experiment`,

  deepDive: `Full LP stack, API to on-chain.

The experiment lab runs a 78-strategy leaderboard. The live Meteora DLMM agent tracks positions. Dashboard LP analytics and a treasury chart sit beside a dedicated LP wallet with policy-gated execution.

syraa.fun/lp-experiment`,

  split: `Sim proves it, then live runs it.

Zero-risk sim competition. The live agent deploys on identical economics once the profit gate clears. 78 strategies evolve daily. A real mirror tracks the PnL leader. Premature live opens stay blocked. Meteora DLMM plus Jupiter sidecar handle the rest.

syraa.fun/lp-experiment`,

  terminal: `An LP agent session end to end.

syra lp lab --cohort active screens 78 strategies on Meteora SOL pools. Leader in this run: Conservative Spot plus Smart Money, +12.4% sim. Enabling real with 2.5 SOL passes policy and the profit gate, then opens a DLMM position, bins 30/30, pool SOL/USDC. Tx confirmed, earning fees.

syraa.fun/lp-experiment`,

  cta: `Stop babysitting bins. Start the sim lab.

78 strategies compete daily. Fund your wallet. Deploy live when a leader clears the gate.

syraa.fun/lp-experiment
syraa.fun/overview
syraa.fun/settings`,
};
