import { DocsLayout } from "@/components/docs/DocsLayout";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

type QuarterStatus = "Shipped" | "In Progress" | "Planned";

/** Dated release notes — append when you ship meaningful user-facing changes */
const changelogEntries: { period: string; items: string[] }[] = [
  {
    period: "March 2026",
    items: [
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
      "Purch Vault and Messari x402-backed data paths",
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
  "Syra Agent at agent.syraa.fun with trading signals and supported tokens",
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
      "Token buyback & burn program (50% of USDC revenue)",
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
 
 export default function Changelog() {
   return (
     <DocsLayout>
       <div className="mb-8">
         <div className="text-sm text-primary font-medium mb-2">Resources</div>
         <h1 className="text-4xl font-bold tracking-tight mb-4">Changelog & Roadmap</h1>
         <p className="text-xl text-muted-foreground leading-relaxed">
           What we've shipped and what's coming next.
         </p>
       </div>

       <section className="mb-12">
         <h2 className="text-2xl font-semibold mb-2">Recent updates</h2>
         <p className="text-muted-foreground mb-4">
           Highlights from recent releases (newest first).
         </p>
         <div className="space-y-8">
           {changelogEntries.map((block) => (
             <div key={block.period} className="rounded-lg border border-border bg-card/50 p-4">
               <h3 className="text-sm font-semibold text-foreground mb-3">{block.period}</h3>
               <ul className="space-y-2">
                 {block.items.map((item, i) => (
                   <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                     <span className="text-primary mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
                     {item}
                   </li>
                 ))}
               </ul>
             </div>
           ))}
         </div>
       </section>

       {/* What we've finished */}
       <section className="mb-12">
         <h2 className="text-2xl font-semibold mb-2">What we've finished</h2>
         <p className="text-muted-foreground mb-4">
           Shipped and live in the system.
         </p>
         <div className="rounded-lg border border-border bg-card/50 p-4">
           <ul className="space-y-2">
             {completed.map((item, i) => (
               <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                 <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden />
                 {item}
               </li>
             ))}
           </ul>
         </div>
       </section>

       {/* Roadmap — matches /docs/token/roadmap */}
       <section>
         <h2 className="text-2xl font-semibold mb-2">Roadmap</h2>
         <p className="text-muted-foreground mb-6">
           2025–2027 Syra Roadmap — Building AI Trading Intelligence Infrastructure with x402 payments.
         </p>
         <div className="space-y-8">
           {roadmapByQuarter.map((q) => (
             <div key={q.quarter} className="relative pl-6 border-l-2 border-border">
               <div className="absolute left-0 top-0 -translate-x-1/2 w-3 h-3 rounded-full bg-primary" />
               <div className="flex items-center gap-3 mb-3">
                 <span className="text-lg font-semibold">{q.quarter}</span>
                 <Badge
                   variant={
                     q.status === "In Progress"
                       ? "default"
                       : q.status === "Shipped"
                         ? "outline"
                         : "secondary"
                   }
                   className="text-xs"
                 >
                   {q.status}
                 </Badge>
               </div>
               <ul className="space-y-1.5">
                 {q.items.map((item, i) => (
                   <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                     <span className="text-primary mt-1">•</span>
                     {item}
                   </li>
                 ))}
               </ul>
             </div>
           ))}
         </div>
       </section>
     </DocsLayout>
   );
 }