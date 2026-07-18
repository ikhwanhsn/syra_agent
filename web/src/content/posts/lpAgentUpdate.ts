import { Bot, Droplets, FlaskConical, Shield, TrendingUp } from "lucide-react";
import type { PostUpdate } from "./types";

/**
 * Ship log: Syra LP agent system (sim lab + live Meteora DLMM).
 * Update this file (or swap ACTIVE_POST in index.ts) when publishing the next build update.
 * Slide copy: avoid em dashes; use commas, periods, or colons instead.
 * Give each slide a unique `layout` from layouts.ts (see validatePostUpdate).
 * Left-aligned templates use PostSlideContent in PostSlideTemplates — do not split kicker/title/body across separate columns.
 */
export const LP_AGENT_POST: PostUpdate = {
  meta: {
    updateNumber: 1,
    id: "lp-agent-system",
    title: "LP Agent System",
    published: "June 2026",
    tagline: "Autonomous Meteora DLMM agents with sim lab and live deployment",
    shareCopyVideo: `SHIP LOG · Syra LP agents just leveled up.

78 evolving strategies compete on live Meteora pool data with zero capital at risk. When a leader proves out, your real agent deploys SOL on the same economics model: DLMM bins, fee yield, IL budget, and Jupiter sidecar sweeps.

→ Unified sim + real economics (lpEconomicsModel)
→ Meteora DLMM open, hold, claim, close on-chain
→ Mirror agent follows the sim leader into real pool screen
→ Jupiter referral fees on sidecar swaps (when configured)

Practice in the lab. Flip on your agent when you are ready. Earn trading fees, not subscriptions.

Full breakdown in the video ↓`,
    shareCopyPhoto: `SHIP LOG · Syra LP agents run sim and live on one economics stack.

The lab screens Meteora pools, scores 78 strategies, and evolves winners daily. Your real agent uses the same fee/IL math, wider OOR floors, and profit gates before it opens the next position.

Sim leaderboard → mirror agent → Meteora DLMM → Jupiter sidecar sweep.

Non-custodial. Policy-gated. Built for operators who want fee yield, not manual LP babysitting.

Try the lab → syraa.fun/lp-experiment`,
  },
  slides: [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-split",
      label: "Cover",
      eyebrow: "Ship log",
      title: "LP Agent System",
      subtitle: "Autonomous Meteora DLMM agents: sim lab competition, then live SOL deployment when you are ready.",
      badge: "Meteora DLMM · Sim + Live",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-centered",
      label: "Context",
      kicker: "Why this matters",
      headline: "Manual LP is a full-time job.",
      body: "Meteora DLMM pools move fast. Fee yield, impermanent loss, and out-of-range exits need constant attention. Syra LP agents screen pools, size positions, and manage exits so you can deploy capital without babysitting bins.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-checklist",
      label: "Shipped",
      kicker: "What we built",
      headline: "One economics stack for sim and live",
      body: "Sim agents and your real LP agent now share lpEconomicsModel: bin geometry, hold/OOR floors, fee yield vs IL budget, and realistic tx costs. What wins in the lab is what the live agent evaluates on-chain.",
      highlights: [
        "78 strategies: 20 static roster + daily evo spawns + real mirror",
        "Meteora DLMM executor with claim-before-close and OOR guards",
        "Jupiter sidecar swaps for idle token sweeps and rebalancing",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-pipeline",
      label: "Flow",
      kicker: "How it works",
      headline: "From paper to production",
      steps: [
        {
          step: "01",
          title: "Screen Meteora pools",
          description: "Live pool data: fee/TVL, organic score, smart money, risk/reward, and volume freshness.",
        },
        {
          step: "02",
          title: "Compete in the sim lab",
          description: "Strategies open paper positions, evolve daily from leaders, and climb the leaderboard with no SOL at risk.",
        },
        {
          step: "03",
          title: "Enable your real agent",
          description: "Fund your LP wallet, accept risk terms, and toggle live mode. Policy engine and profit gates apply before each open.",
        },
        {
          step: "04",
          title: "Earn and sweep",
          description: "Agent opens DLMM bins, collects fees, exits on strategy rules, and sweeps via Jupiter sidecar when needed.",
        },
      ],
    },
    {
      id: "features",
      kind: "cards",
      layout: "cards-grid",
      label: "Features",
      kicker: "Under the hood",
      headline: "Built for fee yield, not churn",
      cards: [
        {
          title: "Real mirror",
          subtitle: "Strategy 98",
          detail: "Sim agent follows the PnL leader and the same real pool screen your live agent uses.",
          accent: "gold",
        },
        {
          title: "Hold guards",
          subtitle: "45m min · 90m OOR",
          detail: "Production-tuned floors so positions collect fees before out-of-range exits fire.",
          accent: "gold",
        },
        {
          title: "Profit gate",
          subtitle: "52% win · 6+ closes",
          detail: "Live opens pause until the leader strategy clears minimum decided win rate.",
        },
        {
          title: "Jupiter fees",
          subtitle: "Sidecar only",
          detail: "Optional platform fee on sidecar swaps when referral token accounts exist. Opens never blocked.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-tiles",
      label: "Product",
      kicker: "Where you'll see it",
      headline: "Live across the Syra dashboard",
      items: [
        {
          icon: FlaskConical,
          title: "LP experiment lab",
          description: "Leaderboard, cohort stats, and strategy profiles. Watch 78 agents compete on live Meteora data.",
          href: "https://www.syraa.fun/lp-experiment",
        },
        {
          icon: Droplets,
          title: "Your LP agent",
          description: "Enable live mode, fund treasury, track open positions, PnL, and Solscan tx links.",
          href: "https://www.syraa.fun/lp-experiment#real-agent",
        },
        {
          icon: TrendingUp,
          title: "Dashboard overview",
          description: "LP analytics panel and treasury allocation chart alongside chat and trading agents.",
          href: "https://www.syraa.fun/overview",
        },
        {
          icon: Shield,
          title: "Policy engine",
          description: "Tx simulation, spend limits, and explicit approvals before any on-chain LP action.",
        },
        {
          icon: Bot,
          title: "Dedicated LP wallet",
          description: "Separate agent wallet for LP capital. Fund from your connected wallet in Settings.",
          href: "https://www.syraa.fun/settings",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-stats",
      label: "Impact",
      kicker: "For operators",
      headline: "Sim first. Deploy when convinced.",
      stats: [
        { value: "78", label: "Evolving LP strategies" },
        { value: "DLMM", label: "Meteora on-chain execution" },
        { value: "1", label: "Shared economics model" },
      ],
      narrative:
        "Run the lab until a strategy earns your trust, then flip live with the same signals and exit rules. Non-custodial keys, auditable positions, and fee yield from pools Syra already screens for quality.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-minimal",
      label: "Try it",
      headline: "Open the LP lab today.",
      subline: "Watch strategies compete, fund your agent wallet, and enable live mode when you are ready to earn Meteora fees.",
      links: [
        { label: "LP experiment", value: "syraa.fun/lp-experiment", href: "https://www.syraa.fun/lp-experiment" },
        { label: "Dashboard", value: "syraa.fun/overview", href: "https://www.syraa.fun/overview" },
        { label: "Settings", value: "Fund LP wallet", href: "https://www.syraa.fun/settings" },
      ],
    },
  ],
};
