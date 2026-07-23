import { ALPHA_SNIPER_LAB_POST } from "../alphaSniperLabUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { ALPHA_SNIPER_LAB_PHOTO_SHARE_COPIES } from "./shareCopies/alphaSniperLabShareCopies";

const copies = ALPHA_SNIPER_LAB_PHOTO_SHARE_COPIES;

export const ALPHA_SNIPER_LAB_PHOTO = definePhotoUpdate(ALPHA_SNIPER_LAB_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Paper · High risk",
      title: "Alpha Sniper",
      subtitle: "RugCheck-gated new-pair paper snipes. Earn after the lab proves out.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-accent",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The problem",
      headline: "Alpha without gates is how wallets die.",
      body: "Syra scores new pairs. The sniper executes only after RugCheck — proven on paper first.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Scout. Gate. Enter. Exit.",
      narrative: "No RugCheck pass → no trade. Highest variance product — by design.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "A snipe",
      headline: "Four steps. Fail closed.",
      steps: [
        { step: "01", title: "Scout", description: "pump.fun alpha feed." },
        { step: "02", title: "Gate", description: "RugCheck hard reject." },
        { step: "03", title: "Enter", description: "Score + liq filters." },
        { step: "04", title: "Exit", description: "TP / SL / trailing." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Your path",
      headline: "Watch now. Tiny size later.",
      steps: [
        { step: "01", title: "Open Yield", description: "See Sniper card." },
        { step: "02", title: "Wait for beta", description: "Paper gate clears." },
        { step: "03", title: "Fund LP", description: "SOL — keep it tiny." },
        { step: "04", title: "Enable", description: "Daily loss cap applies." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Rules that keep rugs out.",
      cards: [
        { title: "RugCheck", subtitle: "Hard gate", detail: "Fail closed.", accent: "gold" },
        { title: "Size caps", subtitle: "Tiny", detail: "Per position + concurrent.", accent: "gold" },
        { title: "Daily loss", subtitle: "Kill switch", detail: "Pause deposits." },
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
      headline: "New pairs can go to zero.",
      highlights: [
        "Memecoins are extreme risk",
        "RugCheck ≠ immunity",
        "Start at the minimum",
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
        { value: "High", label: "variance" },
        { value: "≥50", label: "trades to graduate" },
        { value: "0.5–3", label: "SOL beta cap*" },
      ],
    }),
  },
  {
    role: "featured",
    layout: "photo-hero-split",
    shareCopy: copies.featured,
    content: photoContent({
      kicker: "Path",
      headline: "Earn → Yield → Sniper → Fund tiny.",
      body: "Card is listed as coming soon. LP deposits unlock after graduation.",
      highlights: ["Yield tab", "Watch lab", "LP wallet", "Tiny size"],
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Before vs now.",
      compareLeft: { title: "Before", body: "Alpha feed without an executing agent." },
      compareRight: { title: "Now", body: "Paper sniper lab + Earn card (coming soon)." },
    }),
  },
  {
    role: "launch",
    layout: "photo-announcement",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Live",
      title: "Alpha Sniper lab",
      subtitle: "Paper sniping. Highest risk product — deposits after graduation.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-statement-boxed",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Risk",
      headline: "New pairs can rug.",
      body: "Daily loss cap pauses deposits. Rugged pools get cooldown. Still extreme risk.",
    }),
  },
  {
    role: "split",
    layout: "photo-hero-compact",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Patience",
      headline: "Watch. Accrue. Deposit tiny.",
      body: "No FOMO size. Graduation first.",
      highlights: ["Watch", "Gate", "Fund", "Cap"],
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
        "→ New-Pair Alpha Sniper card",
        "syraa.fun/wallet?wallet=lp",
        "→ SOL when beta opens (tiny)",
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
      headline: "Follow the sniper lab.",
      subtitle: "Open Earn → Yield. Deposit only after graduation.",
    }),
  },
]);
