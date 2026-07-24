import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy: Stocks News Lab (update #22). Trader-friendly, plain language. */
export const STOCKS_NEWS_EXPERIMENT_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `This cover image announces the Stocks News Lab shipping on Syra.

Fifteen agents paper-trade tokenized stocks, TSLAx, AAPLx, NVDAx, SPYx, and SPCXx, using a $1,000 virtual bank each, priced through Jupiter, with no real money at risk.

syraa.fun/stocks`,

  thesis: `This card names the problem traders face with news-driven moves.

Headlines move stock prices before most traders can react. Syra runs 15 agents that score news and sentiment for TSLAx, AAPLx, NVDAx, SPYx, and SPCXx, then paper-trade the signal so you can see what would have worked before risking real capital.

syraa.fun/stocks`,

  quote: `The line on this card sums up the lab in one sentence: let the agents fight over headlines while you watch who wins.

Fifteen strategies each start with $1,000 paper capital, and daily evolution culls the losers so only working ideas survive.

syraa.fun/stocks`,

  flow: `This image walks the lab loop in four steps.

1. Agents scan headlines and sentiment for each xStock symbol
2. Rules pass, and a paper trade opens at the Jupiter price
3. Take-profit, stop-loss, or a time limit closes the position
4. The leaderboard updates and losers get culled at the daily evolution tick

syraa.fun/stocks`,

  timeline: `This timeline shows what runs inside the lab every day.

1. News feeds refresh and score TSLAx, AAPLx, NVDAx, SPYx, and SPCXx
2. Fifteen agents compete on their own $1,000 paper bank
3. Trades resolve and Jupiter marks the P&L on every close
4. The worst strategies get removed and the best ones spawn mutated copies

syraa.fun/stocks`,

  pillars: `This bento layout breaks down the four things the lab tracks.

Paper $1K keeps every agent's bank virtual, so no real swaps happen. News edge means headlines and sentiment signals drive entries. Jupiter marks means real on-chain prices decide the P&L. Evolution means only the strategies that stay profitable keep trading.

syraa.fun/stocks`,

  checklist: `This checklist is what shipped with the Stocks News Lab.

1. 15 news-driven strategies, each with its own entry rules
2. TSLAx, AAPLx, NVDAx, SPYx, and SPCXx make up the tradable universe
3. A live leaderboard and equity curve track the top agent
4. A live news panel shows the headline that triggered each trade

syraa.fun/stocks`,

  metrics: `The numbers on this card describe the lab's setup.

Each of the 15 agents starts with $1,000 in paper capital and zero real money is ever at risk. Tokenized stocks trade around the clock on Solana, so the news score and the paper trade can happen the moment a headline lands.

syraa.fun/stocks`,

  featured: `This featured card zooms in on the $1,000 paper bank every agent starts with.

No real swaps happen and no wallet is required to watch. It is a live tournament on which news-reading rules actually make money on xStocks, and the leaderboard tells you who is winning it.

syraa.fun/stocks`,

  comparison: `This before-and-after card compares reading headlines by hand to running a paper tournament.

Before, a trader reads a headline and guesses the trade with no record of which rules actually work. Now, 15 agents paper-trade that same news on xStocks, Jupiter marks every entry and exit, and the leaderboard shows who came out ahead.

syraa.fun/stocks`,

  launch: `This launch card marks the Stocks News Lab as live.

Fifteen AI agents trade tokenized stocks on Solana, turning headlines into paper trades with a $1,000 virtual bank each. The best agent sits on top of the leaderboard while daily evolution culls the rest.

syraa.fun/stocks`,

  deepDive: `This deep-dive card lists what powers each paper trade.

News and sentiment scoring runs per xStock symbol, Jupiter price v2 handles entry and mark-to-market, and every position closes on a take-profit, stop-loss, or max-hold rule. Evolution spawns smarter agents from whichever strategies won the day before.

syraa.fun/stocks`,

  split: `This split card shows the order of operations: paper first, proof second, real size later.

Fifteen agents compete on their own news-driven rules while you watch P&L, win rate, and the equity curve without putting a dollar on-chain. Once a leader earns your trust, you know which style to follow with real capital.

syraa.fun/stocks`,

  terminal: `This terminal card shows the lab's live status pulled straight from the stack.

Fifteen agents are active in the current cohort, with Event Catalyst Hunter leading on paper P&L. The scan covers TSLAx, NVDAx, AAPLx, SPYx, and SPCXx, and the last signal was a bullish read on an NVDAx earnings headline.

syraa.fun/stocks`,

  cta: `This closing card is the ship summary: watch which news agent wins before you ever trade for real.

Fifteen strategies, $1,000 paper each, priced on Jupiter, and evolving daily.

syraa.fun/stocks
syraa.fun/overview
syraa.fun/swap`,
};
