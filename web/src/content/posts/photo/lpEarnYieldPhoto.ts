import { LP_EARN_YIELD_POST } from "../lpEarnYieldUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { LP_EARN_YIELD_PHOTO_SHARE_COPIES } from "./shareCopies/lpEarnYieldShareCopies";

const copies = LP_EARN_YIELD_PHOTO_SHARE_COPIES;

/** Photo-format content for LP Auto Earn Yield ship log. */
export const LP_EARN_YIELD_PHOTO = definePhotoUpdate(LP_EARN_YIELD_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Earn · Beta",
      title: "LP Auto on Earn",
      subtitle: "Deposit SOL. Agent farms Meteora fees. You stay non-custodial.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-accent",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The problem",
      headline: "LP fees are real. Managing ranges is a job.",
      body: "LP Auto puts opens, watches, and exits on your agent wallet so you can deposit and earn.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Deposit SOL. Earn fees.",
      narrative: "Your LP wallet. Syra's strategy. You keep the yield minus a cut on net gains.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "How it works",
      headline: "Four steps. Then it runs.",
      steps: [
        { step: "01", title: "Open Yield", description: "Earn → Yield tab." },
        { step: "02", title: "Enable", description: "Set 1–5 SOL cap." },
        { step: "03", title: "Fund", description: "LP agent wallet." },
        { step: "04", title: "Earn", description: "Agent farms fees." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Your path",
      headline: "From connect to deposit.",
      steps: [
        { step: "01", title: "Sign in", description: "Wallet + Syra session." },
        { step: "02", title: "Enable LP Auto", description: "Pick max deposit." },
        { step: "03", title: "Send SOL", description: "/wallet?wallet=lp" },
        { step: "04", title: "Pause anytime", description: "You stay in control." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Rules that protect depositors.",
      cards: [
        { title: "Non-custodial", subtitle: "Your wallet", detail: "Funds in LP agent.", accent: "gold" },
        { title: "Beta cap", subtitle: "1–5 SOL", detail: "Start small.", accent: "gold" },
        { title: "Fee on gains", subtitle: "10%", detail: "Only net-positive PnL." },
        { title: "Auto-pause", subtitle: "Safety", detail: "Deposits gate if health slips." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-checklist",
    shareCopy: copies.checklist,
    content: photoContent({
      kicker: "Before you deposit",
      headline: "Risks are real. Start small.",
      highlights: [
        "Read Yield disclosures",
        "Only risk what you can lose",
        "Start at 1 SOL",
        "IL and fees can cut returns",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Lab track record — not a guarantee.",
      stats: [
        { value: "~90%", label: "win rate" },
        { value: "+12", label: "SOL lab PnL" },
        { value: "1–5", label: "SOL beta cap" },
      ],
    }),
  },
  {
    role: "featured",
    layout: "photo-hero-split",
    shareCopy: copies.featured,
    content: photoContent({
      kicker: "Path",
      headline: "Earn → Yield → Enable → Fund.",
      body: "One tab to turn on LP Auto. One wallet to deposit. Agent handles Meteora from there.",
      highlights: ["Yield tab", "Enable", "LP wallet", "Farm fees"],
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Lab vs public Earn.",
      compareLeft: {
        title: "Before",
        body: "LP real agent was internal. Hard to try.",
      },
      compareRight: {
        title: "Now",
        body: "Yield tab, capped deposits, clear fee + pause rules.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-announcement",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Live",
      title: "LP Auto on Earn",
      subtitle: "Beta deposits 1–5 SOL. Past lab results are not a promise.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-statement-boxed",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Fees",
      headline: "10% only on net gains.",
      body: "Performance fee hits realized net-positive PnL — not your deposit, not flat or losing runs.",
    }),
  },
  {
    role: "split",
    layout: "photo-hero-compact",
    shareCopy: copies.split,
    content: photoContent({
      badge: "You control",
      headline: "Fund. Farm. Pause.",
      body: "Enable when ready. Pause opens. Stop and close if you want out.",
      highlights: ["Enable", "Fund", "Pause", "Stop"],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Where it lives.",
      terminalLines: [
        "syraa.fun/earn",
        "→ Yield tab · Enable LP Auto",
        "syraa.fun/wallet?wallet=lp",
        "→ Deposit SOL",
        "Agent opens Meteora DLMM",
        "→ You earn fees",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-banner",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Fund the LP wallet. Let the agent farm.",
      subtitle: "Open Earn → Yield. Cap 1–5 SOL. Pause anytime.",
    }),
  },
]);
