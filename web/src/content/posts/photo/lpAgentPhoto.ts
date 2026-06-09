import { LP_AGENT_POST } from "../lpAgentUpdate";
import { LP_AGENT_PHOTO_SHARE_COPIES } from "./shareCopies/lpAgentShareCopies";
import type { PostPhotoUpdate } from "./types";

/**
 * Photo-format content for the LP agent ship log.
 * Swap ACTIVE_PHOTO_POST in index.ts when publishing the next update.
 * Meta and share copy live in the video post file (single source of truth).
 */
export const LP_AGENT_PHOTO: PostPhotoUpdate = {
  meta: LP_AGENT_POST.meta,
  /** Best templates for this update — tuned to announcement, flow, features, impact, and CTA. */
  picks: [
    "photo-cover-split",
    "photo-timeline",
    "photo-cards-quad",
    "photo-stat-featured",
    "photo-comparison",
    "photo-closing-cta",
  ],
  shareCopyByLayout: LP_AGENT_PHOTO_SHARE_COPIES,
  content: {
    eyebrow: "Ship log",
    badge: "Meteora DLMM · Sim + Live",
    title: "LP Agent System",
    subtitle: "Autonomous Meteora DLMM agents: sim lab competition, then live SOL deployment when you are ready.",
    kicker: "Why this matters",
    headline: "Manual LP is a full-time job.",
    body: "Meteora DLMM pools move fast. Fee yield, impermanent loss, and out-of-range exits need constant attention. Syra LP agents screen pools, size positions, and manage exits so you can deploy capital without babysitting bins.",
    quote: "Sim first. Deploy when convinced. Same economics, zero guesswork.",
    highlights: [
      "78 strategies: static roster + daily evo spawns + real mirror",
      "Unified lpEconomicsModel for sim and live agents",
      "Meteora DLMM open, hold, claim, close on-chain",
      "Jupiter sidecar sweeps with optional platform fees",
    ],
    steps: [
      { step: "01", title: "Screen Meteora pools", description: "Fee/TVL, organic score, smart money, risk/reward." },
      { step: "02", title: "Compete in the sim lab", description: "78 strategies evolve daily with no SOL at risk." },
      { step: "03", title: "Enable your real agent", description: "Fund LP wallet, accept terms, toggle live mode." },
      { step: "04", title: "Earn and sweep", description: "DLMM bins, fee collection, Jupiter sidecar exits." },
    ],
    cards: [
      { title: "Real mirror", subtitle: "Strategy 98", detail: "Sim follows PnL leader and real pool screen.", accent: "gold" },
      { title: "Hold guards", subtitle: "45m · 90m OOR", detail: "Collect fees before out-of-range exits.", accent: "gold" },
      { title: "Profit gate", subtitle: "52% · 6+ closes", detail: "Live opens pause until leader clears win rate." },
      { title: "Jupiter fees", subtitle: "Sidecar only", detail: "Platform fee when referral accounts exist." },
    ],
    stats: [
      { value: "78", label: "Evolving LP strategies" },
      { value: "DLMM", label: "Meteora on-chain execution" },
      { value: "1", label: "Shared economics model" },
    ],
    narrative: "Run the lab until a strategy earns your trust, then flip live with the same signals and exit rules.",
    links: [
      { label: "LP experiment", value: "syraa.fun/lp-experiment", href: "https://www.syraa.fun/lp-experiment" },
      { label: "Dashboard", value: "syraa.fun/overview", href: "https://www.syraa.fun/overview" },
      { label: "Settings", value: "Fund LP wallet", href: "https://www.syraa.fun/settings" },
    ],
    items: [
      "LP experiment lab with 78-strategy leaderboard",
      "Live Meteora DLMM agent with position tracking",
      "Dashboard LP analytics and treasury chart",
      "Dedicated LP wallet and policy-gated execution",
    ],
    compareLeft: {
      title: "Before",
      body: "Sim and live LP used different math. Hard to trust paper winners before deploying SOL.",
    },
    compareRight: {
      title: "Now",
      body: "One economics model, mirror agent, profit gates, and Meteora DLMM execution end to end.",
    },
    terminalLines: [
      "$ syra lp lab --cohort active",
      "> 78 strategies screening Meteora SOL pools…",
      "> leader: Conservative Spot + Smart Money (+12.4% sim)",
      "$ syra lp real --enable --fund 2.5 SOL",
      "> policy check passed · profit gate clear",
      "> opening DLMM position · bins 30/30 · pool SOL/USDC",
      "< position open · tx confirmed · earning fees",
    ],
  },
};
