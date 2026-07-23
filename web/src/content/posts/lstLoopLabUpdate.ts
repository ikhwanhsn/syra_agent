import { ExternalLink, Layers, Shield, Wallet, Zap } from "lucide-react";
import { defineVideoUpdate } from "./videoDeck";

/**
 * Ship log: Leveraged LST Loop paper lab → Earn Yield (coming soon).
 */
export const LST_LOOP_LAB_POST = defineVideoUpdate(
  {
    updateNumber: 37,
    id: "lst-loop-lab",
    title: "LST Loop Lab",
    published: "July 2026",
    tagline:
      "Paper lab live: loop SOL into mSOL/JitoSOL with borrow amplification. Earn Yield listing after health-factor and rate gates prove out.",
    shareCopyVideo: `SHIP LOG · Leveraged LST Loop paper lab is live.

Stake → collateral → borrow → restake.
Amplify LST yield — with hard LTV and health-factor rules.

→ Paper first (leverage tiers compete)
→ Earn product: coming soon
→ Real beta only after positive paper expectancy

Watch → syraa.fun/earn?track=yield

Full breakdown in the video ↓`,
    shareCopyPhoto: `SHIP LOG · LST Loop lab is live.

Paper leverage on mSOL / JitoSOL.
Earn listing after the lab proves out.

→ syraa.fun/earn?track=yield`,
  },
  [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-brand-lockup",
      label: "Cover",
      eyebrow: "Ship log",
      title: "Leveraged LST Loop",
      subtitle:
        "Paper loops of mSOL and JitoSOL with borrow amplification. Steady yield — gated hard before real deposits.",
      badge: "Paper lab · Earn soon",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-large-type",
      label: "Context",
      kicker: "Why this matters",
      headline: "LST yield is boring until you loop it — then risk is the product.",
      body: "Borrowing against staked SOL can amplify APY and amplify liquidations. We simulate leverage tiers and borrow-rate spikes on paper before any depositor capital touches the loop.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-compact",
      label: "Shipped",
      kicker: "What we shipped",
      headline: "Leverage-tier strategies competing in paper.",
      body: "Conservative 1.5x through aggressive 2.5x, mSOL vs JitoSOL, with auto-deleverage rules when health or borrow rates break band.",
      highlights: [
        "LST APY vs borrow cost modeled each cycle",
        "Min health factor + max borrow-rate kills",
        "Earn product: Leveraged LST Loop (coming soon)",
        "Invest wallet SOL when real opens",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-numbered",
      label: "Flow",
      kicker: "How the loop works",
      headline: "Stake. Borrow. Restake. Guard.",
      steps: [
        {
          step: "01",
          title: "Stake SOL",
          description: "Into mSOL or JitoSOL.",
        },
        {
          step: "02",
          title: "Borrow SOL",
          description: "Against LST collateral (capped LTV).",
        },
        {
          step: "03",
          title: "Restake",
          description: "Loop to target leverage.",
        },
        {
          step: "04",
          title: "Deleverage",
          description: "If health or rates trip the band.",
        },
      ],
    },
    {
      id: "features",
      kind: "cards",
      layout: "cards-row",
      label: "Features",
      kicker: "Guardrails first",
      headline: "Leverage without pretending it is free.",
      cards: [
        {
          title: "Leverage caps",
          subtitle: "Tiered strategies",
          detail: "Paper strategies declare target leverage and LTV — no unbounded loops.",
          accent: "gold",
        },
        {
          title: "Health factor",
          subtitle: "Auto-deleverage",
          detail: "Resolve cycle unwinds when health slips under strategy minimum.",
          accent: "gold",
        },
        {
          title: "Rate kill",
          subtitle: "Borrow spikes",
          detail: "If borrow APR exceeds the strategy max, the loop exits.",
        },
        {
          title: "Paper gate",
          subtitle: "≥50 trades",
          detail: "Positive expectancy required before capped Earn beta.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-tiles",
      label: "Surfaces",
      kicker: "Where to go",
      headline: "Watch the card. Fund invest when beta opens.",
      items: [
        {
          icon: Layers,
          title: "Earn Yield",
          description: "LST Loop card",
          href: "https://www.syraa.fun/earn?track=yield",
        },
        {
          icon: Wallet,
          title: "Invest wallet",
          description: "SOL for beta",
          href: "https://www.syraa.fun/wallet?wallet=invest",
        },
        {
          icon: Zap,
          title: "Lab path",
          description: "/lst-loop",
          href: "https://www.syraa.fun/lst-loop",
        },
        {
          icon: Shield,
          title: "Disclosures",
          description: "Leverage risks",
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
      headline: "Paper looping. Earn card listed as coming soon.",
      stats: [
        { value: "~2x", label: "Typical leverage" },
        { value: "≥50", label: "Trades to graduate" },
        { value: "1–10", label: "SOL beta cap*" },
      ],
      narrative:
        "*Planned deposit band when real beta opens. Leverage can liquidate. Paper results are not a promise of future yield.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-links",
      label: "CTA",
      kicker: "Next step",
      headline: "Follow the loop lab. Deposit only after graduation.",
      body: "Open Earn → Yield for Leveraged LST Loop. We'll unlock SOL deposits when paper expectancy and health rules clear.",
      links: [
        { label: "Open Earn Yield", href: "https://www.syraa.fun/earn?track=yield" },
        { label: "Invest wallet", href: "https://www.syraa.fun/wallet?wallet=invest" },
      ],
    },
  ],
);
