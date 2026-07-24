import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for LP Agent photo deck: 15 distinct topics. */
export const LP_AGENT_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `This cover introduces the LP Agent System launching on Syra.

78 strategies compete against each other in a simulation lab built on Meteora DLMM pools. Your agent only deploys real SOL once a leader proves itself in sim.

syraa.fun/lp-experiment`,

  thesis: `This card states the problem LP agents solve.

Meteora bins do not wait for you. Fee yield, impermanent loss, and out-of-range exits all need constant attention. Syra's LP agents screen pools, size positions, and manage exits so you can deploy capital without watching charts all day.

syraa.fun/lp-experiment`,

  quote: `This card carries the line that sums up the LP agent thesis: prove the strategy in simulation, then deploy the same math on-chain.

Paper winners and live LP used to run on different economics. Syra unified the model, so trust earned in the lab transfers directly to real SOL.

syraa.fun/lp-experiment`,

  flow: `This image walks through how Syra LP agents work, in four steps.

1. Screen Meteora pools on fee to TVL ratio, organic score, smart money, and risk to reward
2. Run 78 strategies through the sim lab daily with zero SOL at risk
3. Flip a strategy live once it clears the profit gate
4. Collect fees and let the Jupiter sidecar handle exits

syraa.fun/lp-experiment`,

  timeline: `This timeline traces how a strategy moves from sim to live capital.

1. Pool screen ranks Meteora SOL pools by fee to TVL and smart money signals
2. 78 strategies compete daily while a real mirror agent tracks the PnL leader
3. A profit gate blocks live opens until the leader clears a 52 percent win rate
4. Once cleared, the agent opens DLMM bins, earns fees, and sweeps exits through Jupiter

syraa.fun/lp-experiment`,

  pillars: `This bento layout shows four things that separate Syra LP agents from paper trading.

The real mirror strategy tracks the live PnL leader and pool screen. Hold guards wait 45 to 90 minutes before an out-of-range exit fires, so fees get collected first. The profit gate blocks live deployment until a leader clears its win rate, and the Jupiter sidecar handles on-chain exits with an optional fee on referral accounts.

syraa.fun/lp-experiment`,

  checklist: `This checklist covers what shipped with LP agents.

1. 78 strategies: a static roster, daily evolutionary spawns, and one real mirror
2. One lpEconomicsModel shared between sim and live math
3. Meteora DLMM open, hold, claim, and close on-chain
4. A Jupiter sidecar that sweeps exits with optional platform fees

syraa.fun/lp-experiment`,

  metrics: `This card lists the core numbers behind the LP agent system.

78 strategies evolve and compete every day inside the sim lab. Meteora DLMM handles the on-chain execution. Both sim and live share one economics model, so the fee math and exit rules never diverge between paper and real trades.

syraa.fun/lp-experiment`,

  featured: `This featured card highlights the sim lab where strategies prove themselves before risking SOL.

78 strategies compete daily, screening Meteora pools and evolving overnight. Your SOL only deploys once a leader clears the profit gate, so strategies earn their shot at real capital instead of guessing.

syraa.fun/lp-experiment`,

  comparison: `This before and after card compares paper LP trading with live deployment.

Before, sim and live ran on different economics, so a winning paper strategy was still a guess once real SOL was on the line. Now, one economics model, a real mirror agent, and profit gates carry the same rules from sim straight into Meteora DLMM execution.

syraa.fun/lp-experiment`,

  launch: `This launch card marks the LP Agent System as live on Syra.

The sim lab runs 78 competing strategies against Meteora pools every day. A real mirror agent tracks the leader, profit gates decide when live capital is justified, and execution stays non-custodial on-chain.

syraa.fun/lp-experiment`,

  deepDive: `This deep-dive card lists the technical surface behind the LP agent stack.

The LP experiment lab runs a 78-strategy leaderboard. The live Meteora DLMM agent tracks open positions, the dashboard shows LP analytics and a treasury chart, and execution runs through a dedicated LP wallet with policy-gated permissions.

syraa.fun/lp-experiment`,

  split: `This split card explains the two halves of the LP agent system.

The sim side runs 78 strategies through daily evolution with zero SOL at risk, while a real mirror agent tracks the PnL leader. The live side only opens once the profit gate clears, then manages Meteora DLMM positions and sweeps exits through a Jupiter sidecar.

syraa.fun/lp-experiment`,

  terminal: `This terminal card shows an LP agent session end to end.

Running the LP lab command screens Meteora SOL pools across 78 strategies and surfaces the current leader, in this case a Conservative Spot plus Smart Money strategy up 12.4 percent in sim. Enabling the real agent with 2.5 SOL passes the policy check and profit gate, then opens a DLMM position with 30 bins on each side of the SOL/USDC pool.

syraa.fun/lp-experiment`,

  cta: `This closing card points to where to start using LP agents.

Open the LP experiment page to watch 78 strategies compete, check the dashboard for treasury performance, or fund your LP wallet in settings to go live once a leader proves out.

syraa.fun/lp-experiment
syraa.fun/overview
syraa.fun/settings`,
};
