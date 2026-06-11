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
      subtitle: "Autonomous Meteora DLMM agents: sim lab competition, then live SOL deployment when you are ready.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-accent",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "Why this matters",
      headline: "Manual LP is a full-time job.",
      body: "Meteora DLMM pools move fast. Fee yield, impermanent loss, and out-of-range exits need constant attention. Syra LP agents screen pools, size positions, and manage exits so you can deploy capital without babysitting bins.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Sim first. Deploy when convinced. Same economics, zero guesswork.",
      narrative: "Paper winners and live deployment used to run on different math. Syra unified the economics model so trust earned in sim transfers to real SOL.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "LP agent flow",
      headline: "Screen → compete → deploy → earn.",
      steps: [
        { step: "01", title: "Screen Meteora pools", description: "Fee/TVL, organic score, smart money, risk/reward." },
        { step: "02", title: "Compete in the sim lab", description: "78 strategies evolve daily with no SOL at risk." },
        { step: "03", title: "Enable your real agent", description: "Fund LP wallet, accept terms, toggle live mode." },
        { step: "04", title: "Earn and sweep", description: "DLMM bins, fee collection, Jupiter sidecar exits." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Sim to live",
      headline: "Deploy only when a leader proves out.",
      steps: [
        { step: "01", title: "Pool screen", description: "Meteora SOL pools ranked on fee/TVL and smart money." },
        { step: "02", title: "Sim competition", description: "78 strategies compete daily. Real mirror tracks leader." },
        { step: "03", title: "Profit gate", description: "Live opens pause until leader clears win rate threshold." },
        { step: "04", title: "DLMM execution", description: "Open bins, earn fees, claim yield, Jupiter sidecar sweep." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Four things that make LP agents different.",
      cards: [
        { title: "Real mirror", subtitle: "Strategy 98", detail: "Sim follows PnL leader and real pool screen.", accent: "gold" },
        { title: "Hold guards", subtitle: "45m · 90m OOR", detail: "Collect fees before out-of-range exits.", accent: "gold" },
        { title: "Profit gate", subtitle: "52% · 6+ closes", detail: "Live opens pause until leader clears win rate." },
        { title: "Jupiter fees", subtitle: "Sidecar only", detail: "Platform fee when referral accounts exist." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-checklist",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "LP agent system highlights.",
      highlights: [
        "78 strategies: static roster + daily evo spawns + real mirror",
        "Unified lpEconomicsModel for sim and live agents",
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
      headline: "Same economics. Sim and live.",
      stats: [
        { value: "78", label: "Evolving LP strategies" },
        { value: "DLMM", label: "Meteora on-chain execution" },
        { value: "1", label: "Shared economics model" },
      ],
      narrative: "Run the lab until a strategy earns your trust, then flip live with the same signals and exit rules.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "Zero SOL at risk until you're ready.",
      stats: [{ value: "78", label: "Strategies compete daily in sim" }],
      narrative: "The lab runs Meteora screens and evolves strategies. Live deployment only when a leader earns your trust.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Before vs now.",
      compareLeft: {
        title: "Before",
        body: "Sim and live LP used different math. Hard to trust paper winners before deploying SOL.",
      },
      compareRight: {
        title: "Now",
        body: "One economics model, mirror agent, profit gates, and Meteora DLMM execution end to end.",
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
      subtitle: "Sim lab competition → live Meteora DLMM deployment.",
      body: "78 strategies. Real mirror. Profit gates. Non-custodial on-chain execution.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Technical surface",
      headline: "End-to-end LP agent stack.",
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
      headline: "Same signals. Same exit rules.",
      body: "Sim lab runs zero-risk competition. Live agent deploys on identical economics when profit gate clears.",
      highlights: [
        "78 strategies evolve daily in sim",
        "Real mirror tracks PnL leader",
        "Profit gate before live opens",
        "Meteora DLMM + Jupiter sidecar",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "LP agents from CLI.",
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
      headline: "Ready to earn Meteora fees without babysitting bins?",
      subtitle: "78 strategies compete daily. Your real agent deploys when a leader proves out.",
      links: [
        { label: "LP experiment", value: "syraa.fun/lp-experiment", href: "https://www.syraa.fun/lp-experiment" },
        { label: "Dashboard", value: "syraa.fun/overview", href: "https://www.syraa.fun/overview" },
        { label: "Settings", value: "Fund LP wallet", href: "https://www.syraa.fun/settings" },
      ],
    }),
  },
]);
