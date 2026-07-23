import { MOMENTUM_ROTATOR_POST } from "../momentumRotatorLabUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { MOMENTUM_ROTATOR_PHOTO_SHARE_COPIES } from "./shareCopies/momentumRotatorLabShareCopies";

const copies = MOMENTUM_ROTATOR_PHOTO_SHARE_COPIES;

export const MOMENTUM_ROTATOR_PHOTO = definePhotoUpdate(MOMENTUM_ROTATOR_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Paper · Earn soon",
      title: "Momentum Rotator",
      subtitle: "Paper rotate USDC across SOL, cbBTC, JLP. Earn after the lab proves out.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-accent",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The problem",
      headline: "Directional majors need a lab before your capital.",
      body: "Strategies compete on paper. Only positive expectancy graduates to capped Earn beta.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Paper first. Then capped beta.",
      narrative: "Momentum without a track record is gambling. We accrue expectancy first.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "Graduation",
      headline: "Paper. Prove. Cap. List.",
      steps: [
        { step: "01", title: "Paper", description: "Strategies trade live prices." },
        { step: "02", title: "Gate", description: "≥50 decided + positive PnL." },
        { step: "03", title: "Real", description: "Capped invest-wallet swaps." },
        { step: "04", title: "Earn", description: "Beta on Yield tab." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Your path",
      headline: "Watch now. Deposit later.",
      steps: [
        { step: "01", title: "Open Yield", description: "See Momentum card." },
        { step: "02", title: "Wait for beta", description: "Paper gate clears." },
        { step: "03", title: "Fund invest", description: "USDC in agent wallet." },
        { step: "04", title: "Enable", description: "Stay inside the cap." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Built for careful depositors.",
      cards: [
        { title: "Majors only", subtitle: "SOL · cbBTC · JLP", detail: "No thin memes.", accent: "gold" },
        { title: "Invest wallet", subtitle: "USDC", detail: "Non-custodial agent.", accent: "gold" },
        { title: "Paper gate", subtitle: "≥50 trades", detail: "Positive expectancy." },
        { title: "Kill switch", subtitle: "Earn guards", detail: "Auto-pause deposits." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-checklist",
    shareCopy: copies.checklist,
    content: photoContent({
      kicker: "Before you enable",
      headline: "Spot momentum can lose money.",
      highlights: [
        "Read Yield disclosures",
        "Only risk what you can lose",
        "Past paper ≠ future returns",
        "Start at the minimum when beta opens",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Status — not a promise.",
      stats: [
        { value: "3", label: "core assets" },
        { value: "≥50", label: "trades to graduate" },
        { value: "25–250", label: "USDC beta cap*" },
      ],
    }),
  },
  {
    role: "featured",
    layout: "photo-hero-split",
    shareCopy: copies.featured,
    content: photoContent({
      kicker: "Path",
      headline: "Earn → Yield → Momentum → Fund.",
      body: "Card is listed as coming soon. Deposits unlock after the paper gate.",
      highlights: ["Yield tab", "Watch lab", "Invest wallet", "Enable"],
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Before vs now.",
      compareLeft: { title: "Before", body: "No majors rotator on Earn." },
      compareRight: { title: "Now", body: "Paper lab live + Earn card (coming soon)." },
    }),
  },
  {
    role: "launch",
    layout: "photo-announcement",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Live",
      title: "Momentum Rotator lab",
      subtitle: "Paper accruing. Earn deposits after graduation.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-statement-boxed",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Universe",
      headline: "SOL · cbBTC · JLP.",
      body: "Trend, breakout, and vol-scaled strategies. Jupiter rails when real opens.",
    }),
  },
  {
    role: "split",
    layout: "photo-hero-compact",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Patience",
      headline: "Watch. Accrue. Deposit.",
      body: "No FOMO enable. Graduation first.",
      highlights: ["Watch", "Gate", "Fund", "Enable"],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Where it lives.",
      terminalLines: [
        "syraa.fun/earn?track=yield",
        "→ Momentum Rotator card",
        "syraa.fun/wallet?wallet=invest",
        "→ USDC when beta opens",
        "Paper lab accruing now",
        "→ Graduate → capped real",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-banner",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Follow the Momentum lab.",
      subtitle: "Open Earn → Yield. Enable when it graduates.",
    }),
  },
]);
