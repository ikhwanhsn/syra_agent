import { ExternalLink, RefreshCw, Shield, TrendingUp, Wallet } from "lucide-react";
import { defineVideoUpdate } from "./videoDeck";

/**
 * Ship log: Momentum Rotator paper lab — majors rotation → Earn Yield (coming soon).
 */
export const MOMENTUM_ROTATOR_POST = defineVideoUpdate(
  {
    updateNumber: 36,
    id: "momentum-rotator-lab",
    title: "Momentum Rotator Lab",
    published: "July 2026",
    tagline:
      "Paper lab live: rotate USDC across SOL, cbBTC, and JLP on trend signals. Graduates to Earn Yield after the track record proves out.",
    shareCopyVideo: `SHIP LOG · Momentum Rotator paper lab is live.

Trend-follow liquid Solana majors — SOL, cbBTC, JLP.
Paper first. No deposit risk while strategies compete.

→ Multi-strategy cohort + evolution
→ Earn Yield product: coming soon
→ Real beta only after ≥50 trades + positive expectancy

Watch the lab → syraa.fun/earn?track=yield

Full breakdown in the video ↓`,
    shareCopyPhoto: `SHIP LOG · Momentum Rotator lab is live.

Paper rotate USDC → SOL / cbBTC / JLP.
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
      title: "Momentum Rotator",
      subtitle:
        "Paper lab rotating USDC among SOL, cbBTC, and JLP. Earn Yield card listed — beta after the cohort proves out.",
      badge: "Paper lab · Earn soon",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-gold-frame",
      label: "Context",
      kicker: "Why this matters",
      headline: "Directional majors need a lab before your capital.",
      body: "Spot momentum can earn — or bleed. We run competing strategies on paper first, then graduate winners to a capped invest-wallet beta on Earn Yield.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-pillar-trio",
      label: "Shipped",
      kicker: "What we shipped",
      headline: "A full momentum paper cohort",
      body: "Breakout, trend, volatility-scaled, and multi-asset strategies trade the same universe. Evolution culls losers and mutates winners daily.",
      highlights: [
        "Universe: SOL · cbBTC · JLP",
        "Signal + resolve crons accruing trades",
        "Earn product: Momentum Rotator (coming soon)",
        "Graduation gate: ≥50 decided + positive PnL",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-vertical-rail",
      label: "Flow",
      kicker: "How graduation works",
      headline: "Paper. Prove. Cap. List.",
      steps: [
        {
          step: "01",
          title: "Paper trades",
          description: "Strategies open and exit on live prices — no capital at risk.",
        },
        {
          step: "02",
          title: "Expectancy check",
          description: "Need enough decided trades and net-positive paper PnL.",
        },
        {
          step: "03",
          title: "Capped real",
          description: "Invest wallet runs Jupiter swaps within deposit caps.",
        },
        {
          step: "04",
          title: "Earn Yield",
          description: "Product flips to beta when readiness guards pass.",
        },
      ],
    },
    {
      id: "features",
      kind: "cards",
      layout: "cards-row",
      label: "Features",
      kicker: "Built for depositors",
      headline: "Clear rails. Clear gates.",
      cards: [
        {
          title: "Majors only",
          subtitle: "Liquid spot",
          detail: "SOL, cbBTC, JLP — no thin memecoins in this product.",
          accent: "gold",
        },
        {
          title: "Invest wallet",
          subtitle: "USDC",
          detail: "When live, you fund invest — not a new custody story.",
          accent: "gold",
        },
        {
          title: "Paper first",
          subtitle: "No FOMO open",
          detail: "Public deposits wait on lab expectancy + settlement health.",
        },
        {
          title: "Kill switch",
          subtitle: "Auto-pause",
          detail: "Same Earn Yield guards as LP — error rate and PnL pause.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-tiles",
      label: "Surfaces",
      kicker: "Where to go",
      headline: "Watch it on Earn. Fund when ready.",
      items: [
        {
          icon: TrendingUp,
          title: "Earn Yield",
          description: "Momentum card",
          href: "https://www.syraa.fun/earn?track=yield",
        },
        {
          icon: Wallet,
          title: "Invest wallet",
          description: "USDC for beta",
          href: "https://www.syraa.fun/wallet?wallet=invest",
        },
        {
          icon: RefreshCw,
          title: "Lab path",
          description: "/momentum-rotator",
          href: "https://www.syraa.fun/momentum-rotator",
        },
        {
          icon: Shield,
          title: "Disclosures",
          description: "On the Yield tab",
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
      headline: "Paper accruing. Earn card live as coming soon.",
      stats: [
        { value: "3", label: "Core assets" },
        { value: "≥50", label: "Trades to graduate" },
        { value: "25–250", label: "USDC beta cap*" },
      ],
      narrative:
        "*Planned deposit band when real beta opens. Past paper results are not a guarantee. Spot momentum can lose capital.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-links",
      label: "CTA",
      kicker: "Next step",
      headline: "Follow the lab. Enable when it graduates.",
      body: "Open Earn → Yield for the Momentum Rotator card. We'll unlock deposits after the paper gate clears.",
      links: [
        { label: "Open Earn Yield", href: "https://www.syraa.fun/earn?track=yield" },
        { label: "Invest wallet", href: "https://www.syraa.fun/wallet?wallet=invest" },
      ],
    },
  ],
);
