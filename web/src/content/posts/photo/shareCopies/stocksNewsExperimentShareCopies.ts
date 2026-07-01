import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy — Stocks News Lab (update #22). Trader-friendly, plain language. */
export const STOCKS_NEWS_EXPERIMENT_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `NEW · Stocks News Lab on Syra.

15 AI agents paper-trade tokenized stocks on headlines. $1,000 virtual bank each. TSLAx, AAPLx, NVDAx, SPYx, SPCXx.

Jupiter prices. Live news. Zero real money at risk.

Watch the leaderboard → syraa.fun/stocks`,

  thesis: `News moves stocks before most traders react.

Syra's Stocks News Lab runs 15 agents that scan headlines and sentiment for tokenized stocks on Solana — then paper-trade so you see what would have worked.

No capital at risk. Just proof.`,

  quote: `"Let the agents fight over headlines. You watch who wins."

15 strategies. $1,000 paper each. Daily evolution culls losers and spawns smarter copies.

Find the edge before you size a real trade.`,

  flow: `Stocks News Lab — 4 steps:

1. Agents scan headlines + sentiment per xStock
2. Rules pass → paper trade opens at Jupiter price
3. TP / SL / time limit closes the position
4. Leaderboard updates. Losers culled daily.

Paper only → syraa.fun/stocks`,

  timeline: `How the lab runs every day:

→ News feeds score TSLAx, AAPLx, NVDAx, SPYx, SPCXx
→ 15 agents compete on $1,000 paper banks
→ Best strategy climbs the leaderboard
→ Worst performers removed, elite agents mutate offspring

Gets smarter daily.`,

  pillars: `Four things traders care about:

→ Paper $1K: learn without wallet risk
→ News signals: headlines + sentiment drive entries
→ Jupiter prices: real on-chain marks for P&L
→ Evolution: only profitable strategies survive`,

  checklist: `What ships in Stocks News Lab:

→ 15 news-driven strategies with unique entry rules
→ xStocks universe on Solana (TSLAx, AAPLx, NVDAx, SPYx, SPCXx)
→ Live leaderboard + equity curve for the top agent
→ Daily evolution: cull losers, mutate winners`,

  metrics: `$1,000 paper. 15 agents. Zero real risk.

Tokenized stocks trade 24/7 on Solana. Syra scores the news, paper-trades the signal, and ranks who actually makes money.

Watch before you trade → syraa.fun/stocks`,

  featured: `$1,000 paper bank. Every agent.

No real swaps. No wallet risk. Just a live tournament on which news rules win on xStocks.

The leaderboard tells you who to copy when you're ready.`,

  comparison: `Before: you read headlines and guess the trade.

Now: 15 agents paper-trade the same news on xStocks. Jupiter marks entry and exit. Leaderboard shows who wins.

Stop guessing. Start watching proof.`,

  launch: `SHIP LOG · Stocks News Lab is live.

15 AI agents. Tokenized stocks on Solana. Headlines in, paper trades out.

$1,000 virtual bank each. Best agent on top. Losers culled daily.

→ syraa.fun/stocks`,

  deepDive: `Under the hood — trader view:

→ News + sentiment scoring per xStock symbol
→ Jupiter price v2 for paper entry and mark-to-market
→ Take-profit, stop-loss, max-hold exits
→ Evolution spawns smarter agents from daily winners`,

  split: `Paper first. Proof second. Real size later.

15 agents compete on news-driven rules. You watch P&L, win rate, and the equity curve — without risking a dollar on-chain.

When a leader earns your trust, you know which style to follow.`,

  terminal: `Stocks News Lab — what you'd see:

$ syra stocks lab --status
> 15 agents active · cohort stocks-cohort-…
> leader: Event Catalyst Hunter (+$84.20 paper)
> scanning: TSLAx NVDAx AAPLx SPYx SPCXx
> last signal: NVDAx bullish · earnings headline
> open: 3 paper positions · $2,940 deployed virtual

→ syraa.fun/stocks`,

  cta: `Watch which news agent wins — before you trade for real.

15 strategies. $1,000 paper each. xStocks on Jupiter. Daily evolution.

Open the lab → syraa.fun/stocks`,
};
