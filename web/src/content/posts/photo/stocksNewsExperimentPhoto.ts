import { STOCKS_NEWS_EXPERIMENT_POST } from "../stocksNewsExperimentUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { STOCKS_NEWS_EXPERIMENT_PHOTO_SHARE_COPIES } from "./shareCopies/stocksNewsExperimentShareCopies";

const copies = STOCKS_NEWS_EXPERIMENT_PHOTO_SHARE_COPIES;

/** Photo deck: Stocks News Lab (update #22). Trader-friendly copy. */
export const STOCKS_NEWS_EXPERIMENT_PHOTO = definePhotoUpdate(STOCKS_NEWS_EXPERIMENT_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Paper $1K · xStocks",
      title: "Stocks News Lab",
      subtitle: "15 agents trade tokenized stocks on headlines. Jupiter marks. Zero real money at risk.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-accent",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "For traders",
      headline: "News moves stocks. Most traders are already late.",
      body: "The headline drops. Price moves. You are still scrolling. Syra runs 15 agents that score news and sentiment for TSLAx, AAPLx, NVDAx, SPYx, and SPCXx, then paper-trade so you see what works.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Agents fight the news. You keep the proof.",
      narrative: "Fifteen strategies. $1,000 paper each. Daily evolution keeps only what earns. Spot the edge before you size real capital.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "How it works",
      headline: "Scan. Enter. Close. Evolve.",
      steps: [
        { step: "01", title: "Scan news", description: "Headlines + sentiment per xStock symbol." },
        { step: "02", title: "Paper enter", description: "Rules pass, open at Jupiter price." },
        { step: "03", title: "Close on rules", description: "Take-profit, stop-loss, or time limit." },
        { step: "04", title: "Evolve daily", description: "Losers culled. Winners spawn copies." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Every day",
      headline: "The cohort gets sharper.",
      steps: [
        { step: "01", title: "News refresh", description: "Live feeds score each tokenized stock." },
        { step: "02", title: "Agents compete", description: "$1K paper bank. Leaderboard updates." },
        { step: "03", title: "Trades resolve", description: "Jupiter marks P&L on every close." },
        { step: "04", title: "Evolution tick", description: "Worst strategies removed. Elite mutates." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Proof first. Capital later.",
      cards: [
        { title: "Paper $1K", subtitle: "Zero risk", detail: "Virtual bank per agent. No real swaps.", accent: "gold" },
        { title: "News edge", subtitle: "Headlines in", detail: "Sentiment + event signals drive entries.", accent: "gold" },
        { title: "Jupiter marks", subtitle: "Real prices", detail: "On-chain xStock prices for P&L." },
        { title: "Evolution", subtitle: "Daily", detail: "Only profitable strategies survive." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-checklist",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "Inside the Stocks News Lab.",
      highlights: [
        "15 news-driven strategies with unique rules",
        "TSLAx, AAPLx, NVDAx, SPYx, SPCXx universe",
        "Leaderboard + equity curve for top agent",
        "Live news panel showing signal triggers",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Paper bank. Real signal.",
      stats: [
        { value: "$1K", label: "Paper per agent" },
        { value: "15", label: "Competing strategies" },
        { value: "0", label: "Real money risk" },
      ],
      narrative: "See which news rules win on tokenized stocks before you size a real position on Jupiter.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "Which news agent is winning?",
      stats: [{ value: "15", label: "Agents racing on headlines" }],
      narrative: "The leaderboard answers it. Paper P&L, win rate, and return % update live. No wallet required.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Guesswork vs a live paper tournament.",
      compareLeft: {
        title: "Before",
        body: "You read a headline and guess the trade. No record of which news rules actually work.",
      },
      compareRight: {
        title: "Now",
        body: "15 agents paper-trade the same news on xStocks. Jupiter marks every entry. Leaderboard shows the winner.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-announcement",
    shareCopy: copies.launch,
    content: photoContent({
      badge: "Now live",
      title: "Stocks News Lab",
      subtitle: "Headlines in. Paper trades out. Best agent on top.",
      body: "Tokenized stocks on Solana. $1,000 virtual bank. Daily evolution. Zero real risk.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Trader view",
      headline: "What powers each paper trade.",
      items: [
        "News + sentiment scoring per xStock symbol",
        "Jupiter price v2 for entry and mark-to-market",
        "Take-profit, stop-loss, and max-hold exits",
        "Daily cull + elite mutation for smarter agents",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Paper only",
      headline: "Watch the winner. Size when ready.",
      body: "Fifteen agents compete on news rules. You follow P&L and win rate without putting capital on-chain.",
      highlights: [
        "Leaderboard ranks most profitable agent",
        "Equity curve for top performer",
        "News panel shows what triggered trades",
        "Evolution improves strategies daily",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Live lab status.",
      terminalLines: [
        "$ syra stocks lab --leaderboard",
        "> #1 Event Catalyst Hunter  +8.4%  62% win",
        "> #2 Sentiment Momentum     +5.1%  58% win",
        "> scanning NVDAx: earnings headline detected",
        "> paper open: $412 notional @ Jupiter price",
        "< 3 open positions · 12 settled today",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Open the lab. Watch who wins.",
      subtitle: "Paper $1K. xStocks on Jupiter. Daily evolution. No wallet risk.",
      links: [
        { label: "Stocks lab", value: "syraa.fun/stocks", href: "https://www.syraa.fun/stocks" },
        { label: "Dashboard", value: "syraa.fun/overview", href: "https://www.syraa.fun/overview" },
        { label: "Swap", value: "syraa.fun/swap", href: "https://www.syraa.fun/swap" },
      ],
    }),
  },
]);
