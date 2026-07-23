import { Crosshair, ExternalLink, Shield, Wallet, Zap } from "lucide-react";
import { defineVideoUpdate } from "./videoDeck";

/**
 * Ship log: New-Pair Alpha Sniper paper lab → Earn Yield (coming soon).
 */
export const ALPHA_SNIPER_LAB_POST = defineVideoUpdate(
  {
    updateNumber: 38,
    id: "alpha-sniper-lab",
    title: "Alpha Sniper Lab",
    published: "July 2026",
    tagline:
      "Paper lab live: RugCheck-gated snipes on high-quality new pairs from Syra's pump.fun alpha feed. Highest variance — paper mandatory.",
    shareCopyVideo: `SHIP LOG · New-Pair Alpha Sniper paper lab is live.

Pump.fun alpha → RugCheck gate → adaptive TP / SL / trailing.
Highest upside. Highest variance. Paper first.

→ Score + liquidity + graduated filters
→ Earn product: coming soon
→ Real beta only after clean expectancy

Watch → syraa.fun/earn?track=yield

Full breakdown in the video ↓`,
    shareCopyPhoto: `SHIP LOG · Alpha Sniper lab is live.

RugCheck-gated new-pair paper snipes.
Earn listing after the lab proves out.

→ syraa.fun/earn?track=yield`,
  },
  [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-dual-badge",
      label: "Cover",
      eyebrow: "Ship log",
      title: "New-Pair Alpha Sniper",
      subtitle:
        "Paper snipes from Syra's pump.fun alpha feed — RugCheck hard gate, adaptive exits. Earn card listed; deposits wait on the lab.",
      badge: "Paper lab · High risk",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-gold-frame",
      label: "Context",
      kicker: "Why this matters",
      headline: "Alpha feeds are useless if nobody executes — and lethal if they do blindly.",
      body: "Syra already scores new pairs. The sniper turns that into an agent with hard RugCheck rejects, size caps, and trailing exits — proven on paper before any LP-wallet deposits.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-pillar-trio",
      label: "Shipped",
      kicker: "What we shipped",
      headline: "Six sniper styles competing in paper.",
      body: "Safe 80+, balanced 70+, fast scalp, graduated-only, smart-money echo, and wide-net — all with TP/SL/trailing and rugged-pool cooldowns.",
      highlights: [
        "pump.fun scout + RugCheck hard gate",
        "Adaptive take-profit, stop-loss, trailing",
        "Earn product: New-Pair Alpha Sniper (coming soon)",
        "LP wallet when real opens — tiny caps",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-vertical-rail",
      label: "Flow",
      kicker: "How a snipe works",
      headline: "Scout. Gate. Enter. Exit.",
      steps: [
        {
          step: "01",
          title: "Scout alpha",
          description: "Pull high-score candidates from the pump.fun feed.",
        },
        {
          step: "02",
          title: "RugCheck",
          description: "Fail closed — dangerous / failed reports never enter.",
        },
        {
          step: "03",
          title: "Size & enter",
          description: "Strategy score, mcap, and liquidity filters apply.",
        },
        {
          step: "04",
          title: "Adaptive exit",
          description: "TP, SL, trailing, or time expiry — then cooldown rugs.",
        },
      ],
    },
    {
      id: "features",
      kind: "cards",
      layout: "cards-row",
      label: "Features",
      kicker: "Highest variance product",
      headline: "Rules that keep rugs out of the book.",
      cards: [
        {
          title: "RugCheck",
          subtitle: "Hard gate",
          detail: "No pass, no trade — paper and real.",
          accent: "gold",
        },
        {
          title: "Size caps",
          subtitle: "Per position",
          detail: "Tiny notional + max concurrent when real opens.",
          accent: "gold",
        },
        {
          title: "Daily loss",
          subtitle: "Kill switch",
          detail: "Hit the day loss cap → deposits pause.",
        },
        {
          title: "Paper gate",
          subtitle: "≥50 trades",
          detail: "Positive expectancy before any public beta.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-tiles",
      label: "Surfaces",
      kicker: "Where to go",
      headline: "Watch the card. Do not FOMO size.",
      items: [
        {
          icon: Crosshair,
          title: "Earn Yield",
          description: "Sniper card",
          href: "https://www.syraa.fun/earn?track=yield",
        },
        {
          icon: Wallet,
          title: "LP wallet",
          description: "SOL when beta",
          href: "https://www.syraa.fun/wallet?wallet=lp",
        },
        {
          icon: Zap,
          title: "Lab path",
          description: "/alpha-sniper",
          href: "https://www.syraa.fun/alpha-sniper",
        },
        {
          icon: Shield,
          title: "Disclosures",
          description: "Memecoin risk",
          href: "https://www.syraa.fun/earn?track=yield",
        },
        {
          icon: ExternalLink,
          title: "Docs",
          description: "Onchain experiments",
          href: "https://docs.syraa.fun",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-stats",
      label: "Impact",
      kicker: "Status",
      headline: "Paper sniping. Earn card listed as coming soon.",
      stats: [
        { value: "High", label: "Variance" },
        { value: "≥50", label: "Trades to graduate" },
        { value: "0.5–3", label: "SOL beta cap*" },
      ],
      narrative:
        "*Planned deposit band when real beta opens. New-pair trading can lose most or all capital. RugCheck reduces risk — it does not eliminate it.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-links",
      label: "CTA",
      kicker: "Next step",
      headline: "Watch the sniper lab. Deposit only after graduation.",
      body: "Open Earn → Yield for New-Pair Alpha Sniper. Highest variance product on the board — paper first by design.",
      links: [
        { label: "Open Earn Yield", href: "https://www.syraa.fun/earn?track=yield" },
        { label: "LP wallet", href: "https://www.syraa.fun/wallet?wallet=lp" },
      ],
    },
  ],
);
