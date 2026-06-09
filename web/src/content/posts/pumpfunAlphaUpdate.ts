import { Brain, Flame, Target, TrendingUp, Wrench } from "lucide-react";
import type { PostUpdate } from "./types";

/**
 * Ship log: Pump.fun alpha agents (radar, scout, utility scout) with hourly DB snapshots.
 */
export const PUMPFUN_ALPHA_POST: PostUpdate = {
  meta: {
    updateNumber: 4,
    id: "pumpfun-alpha-agents",
    title: "Pump.fun Alpha Agents",
    published: "June 2026",
    tagline: "Alpha/beta radar, learning scout, and utility scout on hourly snapshots",
    shareCopyVideo: `SHIP LOG · Syra just shipped three Pump.fun alpha agents.

Alpha/Beta Play Radar flags runners pumping now and aligned beta plays. Alpha Scout learns from past alphas to predict new ones. Utility Scout surfaces tech projects, not meme-only tickers.

→ Hourly MongoDB snapshots (no spam rescans)
→ GET /brief and /trend serve DB only
→ Schedulers + 1h client cache on /alpha

Three agents. One refresh cadence. Frontend reads saved intel.

Full breakdown in the video ↓`,
    shareCopyPhoto: `MAJOR SHIP · Pump.fun intelligence just got three dedicated agents.

Radar: alpha running hard + beta aligned plays.
Scout: memory of past alphas → predicted runners.
Utility Scout: product/API/infra narratives only.

All refresh every ~1 hour, saved to DB. UI reads snapshots, not live pump.fun on every page load.

Try it at syraa.fun/alpha`,
  },
  slides: [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-tagline-stack",
      label: "Cover",
      eyebrow: "Ship log",
      title: "Pump.fun Alpha Agents",
      subtitle: "Three specialized agents on Syra Alpha: play radar, learning scout, and utility scout. Hourly DB snapshots, calm frontend reads.",
      badge: "Radar · Scout · Utility",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-highlight-line",
      label: "Context",
      kicker: "Why this matters",
      headline: "Pump.fun moves faster than manual tabs.",
      body: "Meme runners, beta followers, and real utility projects all need different lenses. Hitting live feeds on every page view burns API quota and spams LLM calls. Syra now runs dedicated agents on a shared 1-hour cadence and serves the dashboard from MongoDB.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-numbered-cards",
      label: "Shipped",
      kicker: "What we built",
      headline: "Three agents, one refresh clock",
      body: "Each agent has its own scoring pipeline and LLM narrative, but all share PUMPFUN_AGENTS_REFRESH_MS (default 1 hour). Schedulers skip ticks when snapshots are still fresh.",
      highlights: [
        "Alpha / Beta Play Radar: hot tape + aligned follower plays",
        "Alpha Scout: past alpha memory → learned-fit predictions",
        "Utility Scout: tech keywords, links, ecosystem registry picks",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-arrow-chain",
      label: "Flow",
      kicker: "How it works",
      headline: "Compute once, read many",
      steps: [
        {
          step: "01",
          title: "Scheduler tick",
          description: "Every ~1h the API runs discovery, scoring, and optional LLM validation when the Mongo snapshot is stale.",
        },
        {
          step: "02",
          title: "Save snapshot",
          description: "Radar stores per period/mode. Scouts store brief payloads under pumpfun-*-scout:latest IDs.",
        },
        {
          step: "03",
          title: "GET only",
          description: "Frontend and agent tools call /brief or /trend. No on-demand pump.fun fetch for public reads.",
        },
        {
          step: "04",
          title: "Client cache",
          description: "React Query staleTime matches the hour. Refresh button re-reads DB, not a forced agent rerun.",
        },
      ],
    },
    {
      id: "features",
      kind: "cards",
      layout: "cards-mosaic",
      label: "Features",
      kicker: "Under the hood",
      headline: "Specialized scoring per lane",
      cards: [
        {
          title: "Play Radar",
          subtitle: "Alpha + Beta",
          detail: "pumpScore for hot tape, alignmentScore for narrative overlap and MC gap vs alpha leaders.",
          accent: "gold",
        },
        {
          title: "Alpha Scout",
          subtitle: "Learning",
          detail: "Records past alpha flags, builds keyword/MC profile, surfaces learned-fit candidates.",
          accent: "gold",
        },
        {
          title: "Utility Scout",
          subtitle: "Tech only",
          detail: "Utility score from metadata + meme penalties. Ecosystem picks from 8004 and x402 registries.",
        },
        {
          title: "Anti-spam",
          subtitle: "1h gate",
          detail: "POST /run respects freshness unless ?force=true. Schedulers skip in-flight duplicate ticks.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-orbit",
      label: "Product",
      kicker: "Where you'll see it",
      headline: "Live on Syra Alpha",
      items: [
        {
          icon: TrendingUp,
          title: "Play Radar tab",
          description: "/alpha?tab=pumpfun · today/week/month lenses from saved trend snapshots.",
          href: "https://www.syraa.fun/alpha?tab=pumpfun",
        },
        {
          icon: Brain,
          title: "Alpha Scout tab",
          description: "Predicted alphas + learned patterns from past runner memory.",
          href: "https://www.syraa.fun/alpha?tab=scout",
        },
        {
          icon: Wrench,
          title: "Utility Scout tab",
          description: "Pump.fun utility picks and ecosystem infra radar, not hype-only memes.",
          href: "https://www.syraa.fun/alpha?tab=utility",
        },
        {
          icon: Flame,
          title: "Alpha runners",
          description: "Current tape leaders the scout uses as context, not duplicate predictions.",
        },
        {
          icon: Target,
          title: "Experiment feed",
          description: "Paper-trading experiment reads experiment-mode snapshots on the same hourly cadence.",
          href: "https://www.syraa.fun/pumpfun-experiment",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-counter-row",
      label: "Impact",
      kicker: "For operators",
      headline: "Intel without feed spam",
      stats: [
        { value: "3", label: "Dedicated agents" },
        { value: "1h", label: "Shared refresh" },
        { value: "DB", label: "Public reads" },
      ],
      narrative:
        "Tune PUMPFUN_AGENTS_REFRESH_MS if you need a slower cadence in production. Frontend shows savedAt and next scan time so users know the snapshot age.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-banner",
      label: "Try it",
      headline: "Open Syra Alpha today.",
      subline: "Radar, Scout, and Utility tabs are live. Agent tools: pumpfun-alpha-scout and pumpfun-utility-scout brief endpoints.",
      links: [
        { label: "Alpha dashboard", value: "syraa.fun/alpha", href: "https://www.syraa.fun/alpha" },
        { label: "Alpha Scout API", value: "/agent/pumpfun-alpha-scout/brief", href: "https://api.syraa.fun/agent/pumpfun-alpha-scout/brief" },
        { label: "Utility Scout API", value: "/agent/pumpfun-utility-scout/brief", href: "https://api.syraa.fun/agent/pumpfun-utility-scout/brief" },
      ],
    },
  ],
};
