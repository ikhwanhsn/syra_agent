import { LST_LOOP_LAB_POST } from "../lstLoopLabUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { LST_LOOP_LAB_PHOTO_SHARE_COPIES } from "./shareCopies/lstLoopLabShareCopies";

const copies = LST_LOOP_LAB_PHOTO_SHARE_COPIES;

export const LST_LOOP_LAB_PHOTO = definePhotoUpdate(LST_LOOP_LAB_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Paper · Earn soon",
      title: "Leveraged LST Loop",
      subtitle: "Paper loops on mSOL / JitoSOL. Earn after health rules prove out.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-accent",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The problem",
      headline: "Looping amplifies yield — and liquidations.",
      body: "We simulate leverage tiers and rate spikes on paper before any depositor SOL touches the loop.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Stake. Borrow. Restake. Guard.",
      narrative: "Leverage without a kill band is how accounts die. We simulate the band first.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "The loop",
      headline: "Four steps. Then guard.",
      steps: [
        { step: "01", title: "Stake", description: "SOL → mSOL / JitoSOL." },
        { step: "02", title: "Borrow", description: "SOL against LST (capped LTV)." },
        { step: "03", title: "Restake", description: "Loop to target leverage." },
        { step: "04", title: "Deleverage", description: "On health / rate trips." },
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
        { step: "01", title: "Open Yield", description: "See LST Loop card." },
        { step: "02", title: "Wait for beta", description: "Paper gate clears." },
        { step: "03", title: "Fund invest", description: "SOL in agent wallet." },
        { step: "04", title: "Enable", description: "Stay inside the cap." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Guardrails first.",
      cards: [
        { title: "Leverage caps", subtitle: "Tiered", detail: "No unbounded loops.", accent: "gold" },
        { title: "Health factor", subtitle: "Auto-exit", detail: "Deleverage on slips.", accent: "gold" },
        { title: "Rate kill", subtitle: "Borrow APR", detail: "Spike → unwind." },
        { title: "Paper gate", subtitle: "≥50 trades", detail: "Positive expectancy." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-checklist",
    shareCopy: copies.checklist,
    content: photoContent({
      kicker: "Before you enable",
      headline: "Leverage can liquidate you.",
      highlights: [
        "Understand liquidation risk",
        "Only risk what you can lose",
        "Borrow can beat staking yield",
        "Past paper ≠ future returns",
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
        { value: "~2x", label: "typical leverage" },
        { value: "≥50", label: "trades to graduate" },
        { value: "1–10", label: "SOL beta cap*" },
      ],
    }),
  },
  {
    role: "featured",
    layout: "photo-hero-split",
    shareCopy: copies.featured,
    content: photoContent({
      kicker: "Path",
      headline: "Earn → Yield → LST Loop → Fund.",
      body: "Card is listed as coming soon. SOL deposits unlock after graduation.",
      highlights: ["Yield tab", "Watch lab", "Invest wallet", "Enable"],
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Before vs now.",
      compareLeft: { title: "Before", body: "No leveraged LST product on Earn." },
      compareRight: { title: "Now", body: "Paper loop lab + Earn card (coming soon)." },
    }),
  },
  {
    role: "launch",
    layout: "photo-announcement",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Live",
      title: "LST Loop lab",
      subtitle: "Paper looping. Earn deposits after graduation.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-statement-boxed",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Risk",
      headline: "Leverage amplifies losses.",
      body: "Auto-deleverage on health slips. Rate spikes can force exits. Not free yield.",
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
        "→ Leveraged LST Loop card",
        "syraa.fun/wallet?wallet=invest",
        "→ SOL when beta opens",
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
      headline: "Follow the LST Loop lab.",
      subtitle: "Open Earn → Yield. Deposit only after graduation.",
    }),
  },
]);
