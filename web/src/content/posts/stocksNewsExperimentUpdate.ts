import { BarChart3, BrainCircuit, FlaskConical, LineChart, Newspaper, TrendingUp } from "lucide-react";
import type { PostUpdate } from "./types";

/**
 * Ship log: Stocks News Experiment. Paper-trade xStocks on news with evolving agents.
 * Copy is written for traders: plain language, clear risk framing, no jargon walls.
 */
export const STOCKS_NEWS_EXPERIMENT_POST: PostUpdate = {
  meta: {
    updateNumber: 22,
    id: "stocks-news-experiment",
    title: "Stocks News Lab",
    published: "July 2026",
    tagline: "15 AI agents paper-trade tokenized stocks on headlines. $1,000 each. Zero real money at risk.",
    shareCopyVideo: `SHIP LOG · Stocks News Lab is live on Syra.

15 AI agents compete on tokenized stocks using live headlines and Jupiter prices. $1,000 paper bank each. No real money on the line.

→ News + sentiment score TSLAx, AAPLx, NVDAx, SPYx, SPCXx before entry
→ Take-profit, stop-loss, and time limits close every trade
→ Leaderboard ranks the most profitable strategy
→ Daily evolution: losers culled, winners spawn smarter copies

Watch which news-driven agent wins. Learn before you risk capital.

Full breakdown in the video ↓`,
    shareCopyPhoto: `SHIP LOG · Stocks News Lab is live.

15 agents paper-trade xStocks on Solana from headlines and Jupiter prices. $1,000 virtual bank each. Best agent climbs the leaderboard. Losers get culled daily.

TSLAx · AAPLx · NVDAx · SPYx · SPCXx

Paper only. No wallet risk.

→ syraa.fun/stocks`,
  },
  slides: [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-split",
      label: "Cover",
      eyebrow: "Ship log",
      title: "Stocks News Lab",
      subtitle: "15 AI agents paper-trade tokenized stocks on live headlines. $1,000 each. Watch the best strategy win.",
      badge: "Paper $1K · xStocks · Jupiter",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-large-type",
      label: "Context",
      kicker: "For traders",
      headline: "News moves stocks. Most traders are already late.",
      body: "The headline drops. Price jumps. You are still reading the feed. Syra runs 15 autonomous agents that scan news and sentiment for TSLAx, AAPLx, NVDAx, SPYx, and SPCXx, then paper-trade on Jupiter prices so you can see what would have worked, with zero capital at risk.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-compact",
      label: "Shipped",
      kicker: "What we built",
      headline: "A news-driven paper trading tournament",
      body: "Each agent starts with $1,000 paper money. When headlines and sentiment pass its rules, it opens a position priced via Jupiter. Take-profit, stop-loss, and time limits close the trade. A live leaderboard shows who is actually making money.",
      highlights: [
        "$1,000 paper bank per agent. No real swaps",
        "Live headlines + sentiment for each xStock symbol",
        "Jupiter price feeds for entry and mark-to-market",
        "Daily evolution culls losers, mutates winners",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-timeline",
      label: "Flow",
      kicker: "How it works",
      headline: "Four steps any trader can follow",
      steps: [
        {
          step: "01",
          title: "Scan the news",
          description: "Agents pull headlines, sentiment, and event signals for each tokenized stock symbol.",
        },
        {
          step: "02",
          title: "Score and enter",
          description: "When an agent's rules pass (bullish news, catalyst, momentum), it opens a paper trade at Jupiter price.",
        },
        {
          step: "03",
          title: "Track P&L",
          description: "Positions close on take-profit, stop-loss, or max hold time. Wins and losses update the leaderboard.",
        },
        {
          step: "04",
          title: "Evolve daily",
          description: "Worst performers drop out. Top agents spawn smarter copies. The lab gets sharper over time.",
        },
      ],
    },
    {
      id: "features",
      kind: "cards",
      layout: "cards-bento",
      label: "Features",
      kicker: "Strategy styles",
      headline: "15 agents. 15 ways to trade the news.",
      cards: [
        {
          title: "News follower",
          subtitle: "Conservative",
          detail: "Only buys when sentiment is clearly positive and price momentum confirms.",
          accent: "gold",
        },
        {
          title: "Catalyst hunter",
          subtitle: "Fast rotation",
          detail: "Jumps on earnings, IPO, and event headlines within hours.",
          accent: "gold",
        },
        {
          title: "Mega-cap steady",
          subtitle: "AAPLx · SPYx",
          detail: "Tighter stops on large-cap xStocks with lower volatility targets.",
        },
        {
          title: "Tech aggressor",
          subtitle: "TSLAx · NVDAx",
          detail: "Higher take-profit targets on high-beta names when news breaks hot.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-list",
      label: "Product",
      kicker: "Where to watch",
      headline: "Open the lab on your dashboard",
      items: [
        {
          icon: BarChart3,
          title: "Stocks News Lab",
          description: "Leaderboard, equity curve, recent trades, and the live news feed driving entries.",
          href: "https://www.syraa.fun/stocks",
        },
        {
          icon: Newspaper,
          title: "News panel",
          description: "See which headlines and sentiment scores triggered each agent's last trade.",
          href: "https://www.syraa.fun/stocks",
        },
        {
          icon: LineChart,
          title: "xStocks universe",
          description: "TSLAx, AAPLx, NVDAx, SPYx, SPCXx priced via Jupiter on Solana.",
          href: "https://www.syraa.fun/stocks",
        },
        {
          icon: TrendingUp,
          title: "Best agent tracker",
          description: "Follow the current leader's return %, win rate, and trade history.",
          href: "https://www.syraa.fun/stocks",
        },
        {
          icon: BrainCircuit,
          title: "Evolution log",
          description: "Daily cull and spawn cycle keeps only strategies that earn paper profits.",
        },
        {
          icon: FlaskConical,
          title: "Experiment desk",
          description: "Same sim-first pattern as LP and BTC quant labs. Learn before you deploy.",
          href: "https://www.syraa.fun/overview",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-stats",
      label: "Impact",
      kicker: "Why paper first",
      headline: "Prove the edge before you risk SOL",
      stats: [
        { value: "$1K", label: "Paper bank per agent" },
        { value: "15", label: "Competing strategies" },
        { value: "0", label: "Real money at risk" },
      ],
      narrative:
        "Tokenized stocks on Solana trade like crypto: fast, 24/7, headline-driven. Stocks News Lab lets you watch which news rules actually make money before you size a real position. Paper P&L is tracked in USD. Jupiter marks every entry and exit.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-links",
      label: "Try it",
      headline: "Watch the leaderboard today.",
      subline: "See which news-driven agent is winning on xStocks. No wallet needed for the paper lab.",
      links: [
        { label: "Stocks lab", value: "syraa.fun/stocks", href: "https://www.syraa.fun/stocks" },
        { label: "Dashboard", value: "syraa.fun/overview", href: "https://www.syraa.fun/overview" },
        { label: "Swap xStocks", value: "syraa.fun/swap", href: "https://www.syraa.fun/swap" },
      ],
    },
  ],
};
