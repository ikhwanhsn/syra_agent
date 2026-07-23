import { Droplets, ExternalLink, Shield, Wallet, Zap } from "lucide-react";
import { defineVideoUpdate } from "./videoDeck";

/**
 * Ship log: LP Auto live on Earn Yield — deposit SOL, earn Meteora fees.
 * User-facing only: no eng internals, settlement retries, or adapter talk.
 */
export const LP_EARN_YIELD_POST = defineVideoUpdate(
  {
    updateNumber: 35,
    id: "lp-earn-yield",
    title: "LP Auto on Earn",
    published: "July 2026",
    tagline:
      "Deposit SOL into your LP agent wallet. Syra runs Meteora DLMM fee farming for you — non-custodial, capped beta.",
    shareCopyVideo: `SHIP LOG · LP Auto is live on Earn.

Deposit SOL into your LP agent wallet.
Syra opens and manages Meteora DLMM positions.
You keep the fees (minus a performance fee on net gains).

→ Non-custodial — your agent wallet
→ Beta caps 1–5 SOL
→ Lab track record: ~90% win rate on resolved real positions

Past results are not a guarantee.

Start → syraa.fun/earn?track=yield

Full breakdown in the video ↓`,
    shareCopyPhoto: `SHIP LOG · Deposit SOL. Earn LP fees.

LP Auto is live on syraa.fun/earn?track=yield

→ Fund your LP agent wallet
→ Agent farms Meteora fees
→ You stay non-custodial

Beta: 1–5 SOL. Past lab results ≠ future returns.`,
  },
  [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-brand-lockup",
      label: "Cover",
      eyebrow: "Ship log",
      title: "LP Auto on Earn",
      subtitle:
        "Deposit SOL. Your agent farms Meteora DLMM fees. You keep the yield — Syra takes a cut only on net gains.",
      badge: "Earn · Non-custodial · Beta",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-large-type",
      label: "Context",
      kicker: "Why this matters",
      headline: "Most people never LP because managing ranges is a full-time job.",
      body: "Meteora DLMM fees are real, but opening, watching, and closing positions is work. LP Auto puts that loop on your agent wallet so you can deposit and let the strategy run.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-compact",
      label: "Shipped",
      kicker: "What you get",
      headline: "One Yield tab. One LP product ready for beta.",
      body: "Connect, enable LP Auto, fund the LP wallet, and the agent opens fee-farming positions within your deposit cap.",
      highlights: [
        "Earn → Yield tab with live lab stats",
        "Non-custodial LP agent wallet",
        "Beta deposit cap 1–5 SOL",
        "10% performance fee on net-positive PnL only",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-numbered",
      label: "Flow",
      kicker: "How it works",
      headline: "Four steps. Then it runs.",
      steps: [
        {
          step: "01",
          title: "Connect & sign in",
          description: "Open Earn → Yield on syraa.fun.",
        },
        {
          step: "02",
          title: "Enable LP Auto",
          description: "Pick a max deposit within the beta cap.",
        },
        {
          step: "03",
          title: "Fund LP wallet",
          description: "Send SOL to /wallet?wallet=lp.",
        },
        {
          step: "04",
          title: "Earn fees",
          description: "Agent opens and manages Meteora positions.",
        },
      ],
    },
    {
      id: "features",
      kind: "cards",
      layout: "cards-row",
      label: "Features",
      kicker: "Built for depositors",
      headline: "Clear rules. No custody theater.",
      cards: [
        {
          title: "Your wallet",
          subtitle: "Non-custodial",
          detail: "Funds sit in your LP agent wallet. You can pause or stop anytime.",
          accent: "gold",
        },
        {
          title: "Capped beta",
          subtitle: "1–5 SOL",
          detail: "Start small while we prove public deposits under live traffic.",
          accent: "gold",
        },
        {
          title: "Fee share",
          subtitle: "10% on gains",
          detail: "Performance fee only on net-positive realized PnL — not on deposits.",
        },
        {
          title: "Safety pause",
          subtitle: "Auto-gated",
          detail: "New deposits pause if strategy health slips. Open positions still managed.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-tiles",
      label: "Surfaces",
      kicker: "Where to go",
      headline: "Everything you need in three clicks",
      items: [
        {
          icon: Droplets,
          title: "Earn Yield",
          description: "Enable LP Auto",
          href: "https://www.syraa.fun/earn?track=yield",
        },
        {
          icon: Wallet,
          title: "LP wallet",
          description: "Deposit SOL",
          href: "https://www.syraa.fun/wallet?wallet=lp",
        },
        {
          icon: Shield,
          title: "Disclosures",
          description: "Risks on the Yield tab",
          href: "https://www.syraa.fun/earn?track=yield",
        },
        {
          icon: Zap,
          title: "Stats",
          description: "Live win rate & PnL",
          href: "https://www.syraa.fun/earn?track=yield",
        },
        {
          icon: ExternalLink,
          title: "Docs",
          description: "Earn overview",
          href: "https://docs.syraa.fun",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-stats",
      label: "Impact",
      kicker: "Lab track record",
      headline: "Proven on real money before public beta.",
      stats: [
        { value: "~90%", label: "Resolved win rate" },
        { value: "+12 SOL", label: "Lab net PnL" },
        { value: "1–5", label: "SOL beta cap" },
      ],
      narrative:
        "Numbers are from Syra lab real positions — not a promise. You can lose capital from IL, fees, and bad exits. Start with the beta cap.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-links",
      label: "CTA",
      kicker: "Next step",
      headline: "Fund the LP wallet. Let the agent farm.",
      body: "Open Earn → Yield, enable LP Auto, deposit 1–5 SOL. Pause anytime.",
      links: [
        { label: "Open Earn Yield", href: "https://www.syraa.fun/earn?track=yield" },
        { label: "Fund LP wallet", href: "https://www.syraa.fun/wallet?wallet=lp" },
      ],
    },
  ],
);
