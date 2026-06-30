import { DocsLayout } from "@/components/docs/DocsLayout";
import { DocPageHeader } from "@/components/docs/DocPageHeader";
import { DocSection } from "@/components/docs/DocSection";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

type QuarterStatus = "Shipped" | "In Progress" | "Planned";

/** Dated release notes — append when you ship meaningful user-facing changes */
const changelogEntries: { period: string; items: string[] }[] = [
  {
    period: "June 2026",
    items: [
      "OpenRouter x402 APIs: POST /chat/completions, /images/generations, /videos/generations with curated model allowlists and dynamic per-request pricing",
      "Free GET */models endpoints for chat, image, and video allowlists with live upstream rates",
      "New x402 discovery routes: pump.fun suite (trending, movers, analyzer, scout), CoinGecko scout, SPCX/equity intelligence, assets board & detail, Bitcoin hub, technical indicators, Jupiter swap quote, MPP health",
      "Documentation site synced with web playground catalog and expanded agent tools catalog (246 tools)",
    ],
  },
  {
    period: "March 2026",
    items: [
      "Syra Agent: StableCrypto market data (10 curated stablecrypto-* tools + pay.sh catalog in chat and POST /agent/tools/call)",
      "Syra Agent: StableSocial social data (11 stablesocial-* tools — TikTok, Instagram, Facebook, Reddit via x402 + SIWX poll)",
      "Syra Agent: StableEnrich enrichment (19 stableenrich-* tools — Exa, Firecrawl, Apollo, Maps, Reddit, Serper, Hunter, Minerva, Cloudflare crawl)",
      "Trading agent experiment: API, run model, and UI for strategy experiments and OKX-oriented signal analysis",
      "Signal pipeline: source-aware technical signals and validation improvements",
      "x402 API refactor and API playground reliability fixes",
    ],
  },
  {
    period: "February 2026",
    items: [
      "MPP (Machine Payments Protocol) support across paid API flows",
      "Tempo network integration for payments",
      "KuCoin venue support for trading signals",
      "Purch Vault x402-backed marketplace paths",
      "Expanded Binance-aligned market data for signals",
    ],
  },
  {
    period: "January 2026",
    items: [
      "OKX integration for signals and market data",
      "Kraken CLI and venue coverage improvements",
      "Syra Brain single-call intelligence API",
      "8004 agent standard integration, 8004scan alignment, and agent marketplace groundwork",
      "Heylol and expanded X (Twitter) tooling for the agent",
    ],
  },
];

/** Items already shipped / finished in the system — update as you ship */
const completed = [
  "Syra token ($SYRA) launch on Solana (Pump.fun)",
  "Documentation site and API reference (docs.syraa.fun)",
  "x402 API standard and payment flow (incl. MPP and Tempo where applicable)",
  "Syra Agent at syraa.fun with trading signals, wallet, and supported tokens",
  "x402 Agent integration and agent discovery (x402scan)",
  "Sentiment, news, Syra Brain, EXA search, crawl, Browser Use, and core intelligence APIs live",
  "Multi-venue trading signals (Binance, OKX, Kraken, KuCoin, Coinbase, and additional sources)",
  "Trading experiment API and dashboard for strategy runs and analysis",
  "8004 agent integration, marketplace, and partner/agent-only tools (Nansen, Jupiter, Squid, etc.)",
];

const roadmapByQuarter: {
  quarter: string;
  status: QuarterStatus;
  items: string[];
}[] = [
  {
    quarter: "Q4 2025",
    status: "Shipped",
    items: [
      "Sentiment Analysis API with x402 payment integration",
      "Risk Scoring API for trade evaluation",
      "Whale Tracker API for on-chain smart money movements",
      "News Aggregator API with credibility scoring",
      "Launch on x402scan directory for agent discovery",
      "Onboard first 10-20 autonomous agents",
    ],
  },
  {
    quarter: "Q1 2026",
    status: "In Progress",
    items: [
      "Market Regime Detection API (trending/ranging states)",
      "Correlation Matrix API for 500+ tokens",
      "Exit Timing Signals API",
      "Liquidation Prediction API",
      "$SYRA staking for API discounts (10K tokens = 25% off)",
      "x402-linked $SYRA buyback program (tokens held for community airdrops)",
    ],
  },
  {
    quarter: "Q2 2026",
    status: "Planned",
    items: [
      "Custom Model Training API (agents upload strategy docs)",
      "Historical Backtesting API",
      "Agent Reputation Scoring system",
      "Multi-chain expansion (Base, Arbitrum, Polygon)",
      "White-label intelligence API for enterprises",
      "Cross-agent learning network (data flywheel)",
    ],
  },
  {
    quarter: "Q3 2026",
    status: "Planned",
    items: [
      "Compliance-aware Intelligence APIs",
      "Multi-strategy Portfolio Optimization API",
      "Explainable AI decision endpoints",
      "Institutional hedge fund tier with custom SLAs",
      "Vertical expansion: sports betting & prediction markets",
      "Public agent performance leaderboard",
    ],
  },
  {
    quarter: "Q4 2026",
    status: "Planned",
    items: [
      "Advanced ML models with self-improving feedback loops",
      "Traditional markets expansion (forex, commodities, equities)",
      "Agent collaboration protocols",
      "x402 Intelligence Grant Program",
      "Scale to 1,000+ autonomous agents",
    ],
  },
];

const tocItems = [
  { id: "recent-updates", title: "Recent updates", level: 2 },
  { id: "finished", title: "What we've finished", level: 2 },
  { id: "roadmap", title: "Roadmap", level: 2 },
];

export default function Changelog() {
  return (
    <DocsLayout toc={tocItems}>
      <DocPageHeader
        eyebrow="Resources"
        title="Changelog & Roadmap"
        description="What we've shipped and what's coming next."
      />

      <DocSection
        id="recent-updates"
        title="Recent updates"
        description="Highlights from recent releases (newest first)."
      >
        <div className="not-prose space-y-0">
          {changelogEntries.map((block, index) => (
            <div
              key={block.period}
              className="relative pl-8 pb-10 border-l-2 border-border/60 last:pb-0"
            >
              <div className="absolute left-0 top-1 -translate-x-1/2 w-3 h-3 rounded-full bg-primary ring-4 ring-background" />
              <Badge variant="outline" className="mb-3 text-xs font-medium">
                {block.period}
              </Badge>
              <ul className="space-y-2">
                {block.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
                    <span className="text-primary mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              {index < changelogEntries.length - 1 && (
                <div className="mt-6 h-px bg-border/40 ml-0" aria-hidden />
              )}
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection
        id="finished"
        title="What we've finished"
        description="Shipped and live in the system."
      >
        <div className="not-prose rounded-lg border border-border/60 bg-muted/20 p-4">
          <ul className="space-y-2">
            {completed.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </DocSection>

      <DocSection
        id="roadmap"
        title="Roadmap"
        description="2025–2027 Syra Roadmap — scaling machine money infrastructure for autonomous agents on Solana."
      >
        <div className="not-prose space-y-0">
          {roadmapByQuarter.map((q) => (
            <div key={q.quarter} className="relative pl-8 pb-10 border-l-2 border-border/60 last:pb-0">
              <div className="absolute left-0 top-1 -translate-x-1/2 w-3 h-3 rounded-full bg-primary ring-4 ring-background" />
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <Badge variant="outline" className="text-xs font-medium">
                  {q.quarter}
                </Badge>
                <Badge
                  variant={
                    q.status === "In Progress"
                      ? "default"
                      : q.status === "Shipped"
                        ? "secondary"
                        : "outline"
                  }
                  className="text-xs"
                >
                  {q.status}
                </Badge>
              </div>
              <ul className="space-y-1.5">
                {q.items.map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2 leading-relaxed">
                    <span className="text-primary mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DocSection>
    </DocsLayout>
  );
}
