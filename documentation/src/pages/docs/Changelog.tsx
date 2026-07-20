import { DocsLayout } from "@/components/docs/DocsLayout";
import { DocPageHeader } from "@/components/docs/DocPageHeader";
import { DocSection } from "@/components/docs/DocSection";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

type QuarterStatus = "Shipped" | "In Progress" | "Planned";

/** Dated release notes — append when you ship meaningful user-facing changes */
const changelogEntries: { period: string; items: string[] }[] = [
  {
    period: "July 2026",
    items: [
      "API Marketplace rebrand: /marketplace replaces /playground (legacy URLs redirect); Browse / Integrate / Custom in navbar dropdown",
      "Per-API marketplace detail pages with OpenAPI descriptions, usage snippets, and copyable agent manifest JSON",
      "New x402 data-provider routes: DexScreener pairs, GeckoTerminal pools, DefiLlama TVL, RugCheck report, Pyth Hermes prices ($0.001–$0.005/call)",
      "Marketplace catalog tiers: Syra Core vs Partners (external data providers and partner gateways grouped by brand)",
    ],
  },
  {
    period: "June 2026",
    items: [
      "OpenRouter x402 APIs: POST /chat/completions, /images/generations, /videos/generations with curated model allowlists and dynamic per-request pricing",
      "Free GET */models endpoints for chat, image, and video allowlists with live upstream rates",
      "New x402 discovery routes: pump.fun suite (trending, movers, analyzer, scout), CoinGecko scout, SPCX/equity intelligence, assets board & detail, Bitcoin hub, technical indicators, Jupiter swap quote, MPP health",
      "Documentation site synced with web marketplace catalog and expanded agent tools catalog (246 tools)",
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
  "x402 pay-per-call Spend rail — MCP, SDK, marketplace (Earn / Treasury / Invest / Grow as platform modules)",
  "Documentation site and API reference (docs.syraa.fun)",
  "x402 API standard and payment flow (incl. MPP and Tempo where applicable)",
  "API Marketplace at syraa.fun/marketplace — Core vs Partners catalog, detail pages, SDK/MCP integrate",
  "Data-provider x402 routes: DexScreener, GeckoTerminal, DefiLlama, RugCheck, Pyth Hermes",
  "Syra Agent at syraa.fun with wallet, policy caps, and 200+ tool integrations",
  "x402 discovery — x402scan, /.well-known/x402, OpenAPI, MCP (@syra-ai/mcp-server), SDK (@syra-ai/sdk)",
  "Sentiment, news, Syra Brain, web search, crawl, Browser Use, and core intelligence APIs live",
  "Multi-venue trading signals (Binance, OKX, Kraken, KuCoin, Coinbase, and additional sources)",
  "8004 agent integration and partner gateways (Nansen, Jupiter, Squid, OpenRouter, RISE, Purch Vault, …)",
];

const roadmapByQuarter: {
  quarter: string;
  status: QuarterStatus;
  items: string[];
}[] = [
  {
    quarter: "2025 — H1 2026",
    status: "Shipped",
    items: [
      "x402 Spend rail — 200+ paid routes, SDK, MCP, x402scan discovery",
      "API Marketplace — browse, detail pages, Core vs Partners, agent manifests",
      "Treasury — agent wallets, billing dashboard, policy-gated execution",
      "Invest proof surfaces — Giza, Meteora LP, Jupiter, RISE, trading experiments",
      "Earn groundwork — S3 Labs, Purch Vault x402, 8004 agent registry",
      "Grow intelligence — assets board, dossier, Syra Brain, equity/SPCX context",
    ],
  },
  {
    quarter: "Q3 2026",
    status: "In Progress",
    items: [
      "Spend — expand Partners catalog; staking-linked x402 discounts",
      "Treasury — fiat onramp (MoonPay/Privy); richer per-tool policy caps",
      "Invest — deeper LP/swap paths with pre-trade risk context",
      "Earn — KOL attribution and skill marketplace listings",
      "Grow — portfolio recommendations + public metrics transparency",
    ],
  },
  {
    quarter: "Q4 2026",
    status: "Planned",
    items: [
      "Spend — enterprise white-label gateway; x402 Intelligence Grant Program",
      "Treasury — multi-agent treasury rooms and audit exports",
      "Invest — backtesting API and multi-strategy optimization (analysis-first)",
      "Earn — agent performance leaderboard and revenue-share templates",
      "Grow — explainable AI endpoints; compliance-aware intelligence modules",
    ],
  },
  {
    quarter: "2027",
    status: "Planned",
    items: [
      "Agent collaboration protocols with shared treasury",
      "Cross-agent learning flywheel and improved default policies",
      "Traditional markets context (forex, commodities, tokenized equities)",
      "Scale to 1,000+ autonomous agents on the Syra rail",
      "x402 revenue → $SYRA buyback for community airdrops and grants",
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
        description="Pay-per-call x402 for agents — what we've shipped and what's next. Spend is live GTM; Earn, Treasury, Invest, and Grow are platform roadmap."
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
