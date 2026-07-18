import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for LP Agent photo deck — 15 distinct topics. */
export const LP_AGENT_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `SHIP LOG · Syra LP agents just leveled up.

78 strategies compete in sim, then deploy SOL on Meteora DLMM when a leader clears the profit gate.

Zero SOL at risk until you are convinced.

Start the lab → syraa.fun/lp-experiment`,

  thesis: `Meteora bins do not wait for you.

Fee yield, impermanent loss, out-of-range exits: manual LP is a full-time job. Syra agents screen pools, size positions, and manage exits so you deploy capital without chart-watching.

Autonomous LP should not require screen time.`,

  quote: `"Prove it in sim. Deploy the same math on-chain."

Paper winners and live LP used different economics. Syra unified the model. Trust earned in the lab transfers directly to real SOL.

Run the sim first → syraa.fun/lp-experiment`,

  flow: `How Syra LP agents work:

1. Screen Meteora pools (fee/TVL, smart money, risk/reward)
2. 78 strategies compete daily. Zero SOL at risk.
3. Flip live when a leader clears the profit gate
4. Earn fees, claim yield, sweep via Jupiter sidecar

Stop babysitting bins.

Start the lab → syraa.fun/lp-experiment`,

  timeline: `What shipped for sim-to-live LP:

→ Screen Meteora SOL pools on fee/TVL + smart money
→ 78 strategies compete daily. Real mirror tracks PnL leader
→ Profit gate blocks live until 52% win rate clears
→ Fund LP wallet, open DLMM bins, earn fees, Jupiter sweep

Proof before SOL → syraa.fun/lp-experiment`,

  pillars: `4 things that separate Syra LP agents from paper trading:

→ Real mirror: sim tracks live PnL leader + pool screen
→ Hold guards: collect fees before out-of-range exits
→ Profit gate: live blocked until leader clears win rate
→ Jupiter sweep: on-chain exits, fee on referral accounts`,

  checklist: `What ships with LP agents:

→ 78 strategies: static roster + daily evo spawns + real mirror
→ One lpEconomicsModel: same math in sim and live
→ Meteora DLMM open, hold, claim, close on-chain
→ Jupiter sidecar sweeps with optional platform fees

See it in action → syraa.fun/lp-experiment`,

  metrics: `78 strategies. DLMM on-chain. One shared economics model.

Syra screens Meteora pools, runs daily sim competition, and mirrors the leader into live deployment. Same fee math. Same exit rules.

Watch the lab → syraa.fun/lp-experiment`,

  featured: `Test 78 strategies. Risk zero SOL.

The sim lab screens Meteora pools and evolves strategies daily. Your SOL only deploys when a leader clears the profit gate.

Strategies prove out before they touch your wallet.`,

  comparison: `Before: sim and live ran different math. Deploying SOL meant guessing if paper PnL would hold.

Now: one economics model. Mirror agent. Profit gates. Meteora DLMM. Sim to live, same rules.

The gap between "looks good in sim" and "deploy with proof" just closed.

→ syraa.fun/lp-experiment`,

  launch: `SHIP LOG · LP Agent System is live.

78 strategies compete in sim. Your agent deploys SOL on Meteora DLMM only when a leader clears the profit gate.

Real mirror. Profit gates. Non-custodial on-chain execution.

Start in the lab → syraa.fun/lp-experiment`,

  deepDive: `LP agent stack, API to on-chain:

→ LP experiment lab with 78-strategy leaderboard
→ Live Meteora DLMM agent with position tracking
→ Dashboard LP analytics and treasury chart
→ Dedicated LP wallet and policy-gated execution

Explore → syraa.fun/lp-experiment`,

  split: `Sim proves it. Live runs it.

SIM LAB
78 strategies evolve daily. Zero SOL at risk. Real mirror tracks PnL leader.

LIVE AGENT
Fund LP wallet. Pass profit gate. Meteora DLMM open, hold, claim, close on-chain.

Same signals. Same exit rules. Deploy only when convinced.

→ syraa.fun/lp-experiment`,

  terminal: `LP agents from the terminal:

$ syra lp lab --cohort active
> 78 strategies screening Meteora SOL pools…
> leader: Conservative Spot + Smart Money (+12.4% sim)
$ syra lp real --enable --fund 2.5 SOL
> policy check passed · profit gate clear
> opening DLMM position · bins 30/30 · pool SOL/USDC
< position open · tx confirmed · earning fees

Run the lab → syraa.fun/lp-experiment`,

  cta: `Stop babysitting bins. Start the sim lab.

→ LP experiment: syraa.fun/lp-experiment
→ Dashboard: syraa.fun/overview
→ Fund LP wallet: syraa.fun/settings

78 strategies compete daily. Deploy live when a leader clears the gate.`,
};
