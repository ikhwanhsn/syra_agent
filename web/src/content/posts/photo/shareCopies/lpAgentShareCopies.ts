import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for LP Agent photo deck — 15 distinct topics. */
export const LP_AGENT_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Meteora DLMM moves faster than you can babysit bins.

Syra LP agents screen pools, compete 78 strategies in a zero-risk sim lab, then deploy SOL on the same economics when a leader earns your trust.

Sim first. Live when ready.

Explore the lab → syraa.fun/lp-experiment`,

  thesis: `Manual LP is a full-time job.

Meteora DLMM pools move fast. Fee yield, impermanent loss, and out-of-range exits need constant attention. Syra LP agents screen pools, size positions, and manage exits so you can deploy capital without babysitting bins.

Autonomous agents shouldn't require screen time.`,

  quote: `"Sim first. Deploy when convinced. Same economics, zero guesswork."

Paper winners and live deployment used to run on different math. Syra unified the economics model so trust earned in sim transfers to real SOL deployment.`,

  flow: `How Syra LP agents work — in 4 steps:

1. Screen Meteora pools (fee/TVL, smart money, risk/reward)
2. Compete 78 strategies daily — no SOL at risk
3. Enable your real agent when a winner proves out
4. Earn fees, claim yield, sweep via Jupiter sidecar

Manual LP is a full-time job. Autonomous agents shouldn't be.`,

  timeline: `From sim lab to live DLMM — step by step:

→ Screen Meteora SOL pools on fee/TVL and smart money signals
→ 78 strategies compete daily in zero-risk sim
→ Real mirror agent tracks the PnL leader
→ Fund LP wallet, pass profit gate, toggle live mode
→ Open DLMM bins, earn fees, sweep via Jupiter sidecar`,

  pillars: `4 things that make Syra LP agents different:

→ Real mirror: sim leader feeds live pool screen
→ Hold guards: collect fees before out-of-range exits
→ Profit gate: live opens pause until win rate clears
→ Jupiter fees: sidecar sweeps with optional platform cut`,

  checklist: `LP agent system highlights:

→ 78 strategies: static roster + daily evo spawns + real mirror
→ Unified lpEconomicsModel for sim and live agents
→ Meteora DLMM open, hold, claim, close on-chain
→ Jupiter sidecar sweeps with optional platform fees`,

  metrics: `78 evolving LP strategies. DLMM on-chain execution. One shared economics model.

Syra screens Meteora pools, runs a daily sim competition, and mirrors the leader into live deployment — same fee math, same exit rules.

Run the lab → syraa.fun/lp-experiment`,

  featured: `78 strategies compete daily. Zero SOL at risk until you're ready.

The sim lab runs Meteora pool screens, evolves strategies, and tracks a real mirror agent — so live deployment only happens when a leader earns your trust.

Strategies that prove out before they touch your SOL.`,

  comparison: `Before Syra LP agents:
Sim and live used different math. Hard to trust paper winners before deploying SOL.

Now:
One economics model. Mirror agent. Profit gates. Meteora DLMM execution end to end.

The gap between "looks good in sim" and "deploy with confidence" just closed.`,

  launch: `SHIP LOG · Syra LP Agent System is live.

Meteora DLMM agents: sim lab competition, then live SOL deployment when you are ready.

78 strategies. Real mirror. Profit gates. Non-custodial execution.

Start in the lab → syraa.fun/lp-experiment`,

  deepDive: `LP agent system — technical surface:

→ LP experiment lab with 78-strategy leaderboard
→ Live Meteora DLMM agent with position tracking
→ Dashboard LP analytics and treasury chart
→ Dedicated LP wallet and policy-gated execution`,

  split: `Sim lab vs live deployment — same economics.

SIM LAB
78 strategies evolve daily. Zero SOL at risk. Real mirror tracks PnL leader.

LIVE AGENT
Fund LP wallet. Pass profit gate. Meteora DLMM open, hold, claim, close on-chain.

Same signals. Same exit rules. Deploy only when convinced.`,

  terminal: `LP agents from the terminal:

$ syra lp lab --cohort active
> 78 strategies screening Meteora SOL pools…
> leader: Conservative Spot + Smart Money (+12.4% sim)
$ syra lp real --enable --fund 2.5 SOL
> policy check passed · profit gate clear
> opening DLMM position · bins 30/30 · pool SOL/USDC
< position open · tx confirmed · earning fees

Earn Meteora fees without babysitting bins.`,

  cta: `Ready to earn Meteora fees without babysitting bins?

→ Sim lab: syraa.fun/lp-experiment
→ Dashboard: syraa.fun/overview
→ Fund LP wallet: syraa.fun/settings

78 strategies compete daily. Your real agent deploys when a leader proves out.`,
};
