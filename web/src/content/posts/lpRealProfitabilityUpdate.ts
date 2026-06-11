import { Droplets, FlaskConical, Shield, Target, TrendingUp, Zap } from "lucide-react";
import type { PostUpdate } from "./types";

/**
 * Ship log: LP real agent profitability upgrade (fee-aware exits, pool gates, trailing stop).
 * Slide copy: avoid em dashes; use commas, periods, or colons instead.
 */
export const LP_REAL_PROFITABILITY_POST: PostUpdate = {
  meta: {
    updateNumber: 5,
    id: "lp-real-profitability",
    title: "LP Real Agent Profitability",
    published: "June 2026",
    tagline: "Fee-aware exits, stricter pool gates, and trailing stops for live Meteora LP",
    shareCopyVideo: `SHIP LOG · Syra just upgraded the live LP agent for profitability.

Real positions no longer close on raw price drift when fees already paid for the trade. New pool gates block extreme-risk pools and require expected fees to beat chain costs before any open.

→ Fee-aware stop loss: fees earned extend the price stop
→ Chain-cost gate: 1.6× round-trip tx costs before open
→ Trailing stop on live positions to lock fee winners
→ On-chain fees ground PnL, not model guesses

The sim lab showed the bug: Loss status with positive PnL. Real money now uses smarter exits.

Full breakdown in the video ↓`,
    shareCopyPhoto: `MAJOR SHIP · Live LP agent just got a profitability overhaul.

Fee-aware stops. Stricter pool screen. Trailing exits. On-chain fee grounding.

Your real agent will not dump a fee-positive position just because price drifted. It will not open a pool whose expected yield cannot cover Meteora tx costs.

Sim proved the edge case. Real agent now closes the gap.

Try it at syraa.fun/lp-experiment`,
  },
  slides: [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-spotlight",
      label: "Cover",
      eyebrow: "Ship log",
      title: "LP Real Profitability",
      subtitle:
        "Live Meteora LP agents now use fee-aware exits, stricter pool gates, and trailing stops so profitable positions stay open longer.",
      badge: "Fee-aware · Pool gates · Trailing stop",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-large-type",
      label: "Context",
      kicker: "The problem",
      headline: "Price stops were ignoring fees already earned.",
      body: "In the sim lab, positions could show Loss while Sim PnL stayed green: price drift hit stop loss, but LP fees outweighed the move. The live agent used the same blunt rule. It closed on raw price drift and left fee-positive trades on the table.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-compact",
      label: "Shipped",
      kicker: "What we built",
      headline: "Profitability logic aligned with real LP economics",
      body: "The live agent now shares the sim lab's smarter exit model, plus gates tuned for on-chain costs. Opens only when expected fees justify tx spend. Closes when net economics say so, not price alone.",
      highlights: [
        "Fee-aware stop loss with a hard IL cap",
        "Chain-cost viability gate before every open",
        "Trailing stop to lock in fee winners on live positions",
        "On-chain claimed + unclaimed fees ground exit PnL",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-timeline",
      label: "Flow",
      kicker: "How exits work now",
      headline: "From price trigger to net economics",
      steps: [
        {
          step: "01",
          title: "Track real fees",
          description:
            "Resolve ticks read claimed and unclaimed on-chain fees. Modeled fee/TVL fills gaps when chain data is thin.",
        },
        {
          step: "02",
          title: "Extend the stop",
          description:
            "Fees already earned push the price stop wider, up to half the strategy distance. A hard stop still caps catastrophic IL.",
        },
        {
          step: "03",
          title: "Trail the peak",
          description:
            "When net PnL peaks and gives back beyond the trailing rule, the agent closes to bank fees instead of riding back to zero.",
        },
        {
          step: "04",
          title: "Win or loss by net",
          description:
            "Stop loss and trailing exits mark closed_win when net PnL clears the threshold, even if price moved against you.",
        },
      ],
    },
    {
      id: "features",
      kind: "cards",
      layout: "cards-bento",
      label: "Features",
      kicker: "Under the hood",
      headline: "Four gates that protect real SOL",
      cards: [
        {
          title: "Fee-aware stop",
          subtitle: "Fees extend stop",
          detail:
            "Price drift no longer forces a loss exit when LP fees already cover the move. Hard stop at 1.4× strategy stop caps tail risk.",
          accent: "gold",
        },
        {
          title: "Cost gate",
          subtitle: "1.6× tx costs",
          detail:
            "Before any sidecar swap or open tx, expected hold fees must beat round-trip chain costs with margin.",
          accent: "gold",
        },
        {
          title: "Pool screen",
          subtitle: "0.55 R:R · no extreme",
          detail:
            "Real pools need a higher fee-to-IL ratio than sim. Extreme-risk tier pools never qualify for on-chain capital.",
        },
        {
          title: "Adaptive exits",
          subtitle: "Frozen at open",
          detail:
            "Pool-aware stop and take-profit rules are resolved from live fee/TVL and bin geometry when the position opens.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-list",
      label: "Product",
      kicker: "Where you'll see it",
      headline: "Live across the LP experiment dashboard",
      items: [
        {
          icon: Droplets,
          title: "Real agent positions",
          description:
            "Open positions show trailing_stop and fee-aware stop_loss resolutions. Net PnL reflects on-chain fees.",
          href: "https://www.syraa.fun/lp-experiment#real-agent",
        },
        {
          icon: FlaskConical,
          title: "Sim run history",
          description:
            "Paper sim still shows the price-vs-fee split. Use it to validate leaders before enabling live mode.",
          href: "https://www.syraa.fun/lp-experiment",
        },
        {
          icon: Target,
          title: "Strategy profiles",
          description: "Adaptive exit rules and risk tier stored per position in screening snapshots for auditability.",
        },
        {
          icon: Shield,
          title: "Profit gate unchanged",
          description: "Live opens still require 52% win rate and 6+ settled sim closes before a leader qualifies.",
        },
        {
          icon: TrendingUp,
          title: "Dashboard LP panel",
          description: "Treasury and position PnL reflect real closes with claimed fees included.",
          href: "https://www.syraa.fun/overview",
        },
        {
          icon: Zap,
          title: "Resolve tick",
          description: "Background cron evaluates peaks, claims fees above threshold, and applies trailing rules each cycle.",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-featured-stat",
      label: "Impact",
      kicker: "For operators",
      headline: "Fewer fee-positive exits marked as losses.",
      stats: [
        { value: "1.6×", label: "Min fee-to-cost ratio at open" },
        { value: "0.55", label: "Real pool R:R hurdle" },
        { value: "1.4×", label: "Hard stop multiplier" },
      ],
      narrative:
        "The sim lab taught us that LP profitability is net economics, not price direction alone. This update brings that lesson to live Meteora positions: hold fee winners longer, skip pools that cannot pay for themselves, and lock gains before they evaporate.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-links",
      label: "Try it",
      headline: "Enable your LP agent with smarter exits.",
      subline:
        "Watch strategies compete in the sim lab, confirm a leader clears the profit gate, then deploy SOL with fee-aware stops and trailing protection.",
      links: [
        { label: "LP experiment", value: "syraa.fun/lp-experiment", href: "https://www.syraa.fun/lp-experiment" },
        { label: "Real agent", value: "Live positions", href: "https://www.syraa.fun/lp-experiment#real-agent" },
        { label: "Settings", value: "Fund LP wallet", href: "https://www.syraa.fun/settings" },
      ],
    },
  ],
};
