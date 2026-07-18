import { LP_AGENT_POST } from "../lpAgentUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { LP_AGENT_PHOTO_SHARE_COPIES } from "./shareCopies/lpAgentShareCopies";

const copies = LP_AGENT_PHOTO_SHARE_COPIES;

/** Photo-format content for the LP agent ship log — 15 cards, 15 X posts. */
export const LP_AGENT_PHOTO = definePhotoUpdate(LP_AGENT_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-split",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Meteora DLMM · Sim + Live",
      title: "LP Agent System",
      subtitle: "78 strategies compete in sim. Your agent deploys SOL on Meteora DLMM only when a leader proves out.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-accent",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The problem",
      headline: "Meteora bins don't wait for you.",
      body: "Fee yield, impermanent loss, and out-of-range exits demand constant attention. Syra LP agents screen pools, size positions, and manage exits so you deploy capital without watching charts all day.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Prove it in sim. Deploy the same math on-chain.",
      narrative: "Paper winners and live LP used different economics. Syra unified the model. Trust earned in the lab transfers directly to real SOL.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "How it works",
      headline: "Screen. Compete. Deploy. Earn.",
      steps: [
        { step: "01", title: "Screen Meteora pools", description: "Fee/TVL, organic score, smart money, risk/reward ranked." },
        { step: "02", title: "Run the sim lab", description: "78 strategies evolve daily. Zero SOL at risk." },
        { step: "03", title: "Flip live when ready", description: "Fund LP wallet, pass profit gate, toggle on." },
        { step: "04", title: "Collect and sweep", description: "DLMM bins earn fees. Jupiter sidecar handles exits." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Sim to live",
      headline: "No live deploy until the leader earns it.",
      steps: [
        { step: "01", title: "Pool screen", description: "Meteora SOL pools ranked on fee/TVL and smart money." },
        { step: "02", title: "Daily sim race", description: "78 strategies compete. Real mirror tracks PnL leader." },
        { step: "03", title: "Profit gate", description: "Live opens blocked until leader clears 52% win rate." },
        { step: "04", title: "On-chain execution", description: "Open bins, earn fees, claim yield, Jupiter sweep." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Built for real LP, not paper trading.",
      cards: [
        { title: "Real mirror", subtitle: "Strategy 98", detail: "Sim tracks live PnL leader and pool screen.", accent: "gold" },
        { title: "Hold guards", subtitle: "45m · 90m OOR", detail: "Collect fees before out-of-range exits fire.", accent: "gold" },
        { title: "Profit gate", subtitle: "52% · 6+ closes", detail: "Live blocked until leader clears win rate." },
        { title: "Jupiter sweep", subtitle: "Sidecar only", detail: "Exit positions on-chain. Fee on referral accounts." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-checklist",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "What ships with LP agents.",
      highlights: [
        "78 strategies: static roster + daily evo spawns + real mirror",
        "One lpEconomicsModel: same math in sim and live",
        "Meteora DLMM open, hold, claim, close on-chain",
        "Jupiter sidecar sweeps with optional platform fees",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "One model. Sim proof. Live deploy.",
      stats: [
        { value: "78", label: "Evolving LP strategies" },
        { value: "DLMM", label: "Meteora on-chain execution" },
        { value: "1", label: "Shared economics model" },
      ],
      narrative: "Watch strategies compete in sim. When a leader clears the profit gate, flip live with identical signals and exit rules.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "Test 78 strategies. Risk zero SOL.",
      stats: [{ value: "78", label: "Strategies compete daily in sim" }],
      narrative: "The lab screens Meteora pools and evolves strategies daily. Your SOL only deploys when a leader clears the profit gate.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Paper winners ≠ live confidence.",
      compareLeft: {
        title: "Before",
        body: "Sim and live ran different math. Deploying SOL meant guessing if paper PnL would hold.",
      },
      compareRight: {
        title: "Now",
        body: "One economics model. Mirror agent. Profit gates. Meteora DLMM execution: sim to live, same rules.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-announcement",
    shareCopy: copies.launch,
    content: photoContent({
      badge: "Now live",
      title: "LP Agent System",
      subtitle: "Sim lab → profit gate → live Meteora DLMM.",
      body: "78 strategies compete daily. Real mirror. Profit gates. Non-custodial on-chain execution.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Under the hood",
      headline: "Full LP stack. API to on-chain.",
      items: [
        "LP experiment lab with 78-strategy leaderboard",
        "Live Meteora DLMM agent with position tracking",
        "Dashboard LP analytics and treasury chart",
        "Dedicated LP wallet and policy-gated execution",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Sim + Live",
      headline: "Sim proves it. Live runs it.",
      body: "Zero-risk sim competition. Live agent deploys on identical economics once the profit gate clears.",
      highlights: [
        "78 strategies evolve daily in sim",
        "Real mirror tracks PnL leader",
        "Profit gate blocks premature live opens",
        "Meteora DLMM + Jupiter sidecar",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Run LP agents from terminal.",
      terminalLines: [
        "$ syra lp lab --cohort active",
        "> 78 strategies screening Meteora SOL pools…",
        "> leader: Conservative Spot + Smart Money (+12.4% sim)",
        "$ syra lp real --enable --fund 2.5 SOL",
        "> policy check passed · profit gate clear",
        "> opening DLMM position · bins 30/30 · pool SOL/USDC",
        "< position open · tx confirmed · earning fees",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Stop babysitting bins. Start the sim lab.",
      subtitle: "78 strategies compete daily. Fund your wallet. Deploy live when a leader clears the gate.",
      links: [
        { label: "LP experiment", value: "syraa.fun/lp-experiment", href: "https://www.syraa.fun/lp-experiment" },
        { label: "Dashboard", value: "syraa.fun/overview", href: "https://www.syraa.fun/overview" },
        { label: "Settings", value: "Fund LP wallet", href: "https://www.syraa.fun/settings" },
      ],
    }),
  },
]);
