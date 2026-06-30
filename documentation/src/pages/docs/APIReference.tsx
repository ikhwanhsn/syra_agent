import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { DocPageHeader } from "@/components/docs/DocPageHeader";
import { DocSection } from "@/components/docs/DocSection";
import { Callout } from "@/components/docs/Callout";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { apiDocs } from "@/data/apiDocs";
import { ArrowRight, ExternalLink, Zap, HeartPulse, FlaskConical } from "lucide-react";
import { SYRA_PLAYGROUND_URL, SYRA_WEB_LABEL } from "@/content/syraUrls";

const BASE_URL = "https://api.syraa.fun";

const API_CATEGORIES: { title: string; description: string; slugs: string[] }[] = [
  {
    title: "Overview & Standards",
    description: "x402 flow, health checks, brain, and core standards",
    slugs: ["x402-api-standard", "health", "mpp-health", "brain", "preview-dashboard", "x-api", "x-analyzer"],
  },
  {
    title: "News & Sentiment",
    description: "Headlines, sentiment scores, and digest feeds",
    slugs: ["news", "sentiment", "trending-headline", "sundown-digest"],
  },
  {
    title: "Research & Discovery",
    description: "EXA search, crawl, browser automation, analytics",
    slugs: ["exa-search", "crawl", "browser-use", "analytics-summary"],
  },
  {
    title: "Trading & Events",
    description: "Signals, events, arbitrage, and indicators",
    slugs: ["signal", "event", "arbitrage", "indicator"],
  },
  {
    title: "AI / OpenRouter",
    description: "Chat, image, and video generation via OpenRouter",
    slugs: ["chat-completions", "images-generations", "videos-generations"],
  },
  {
    title: "Market Intelligence",
    description: "Equity, assets board, CoinGecko scout, Bitcoin hub",
    slugs: ["spcx", "equity", "coingecko-scout", "assets-board", "assets-detail", "bitcoin-hub"],
  },
  {
    title: "pump.fun",
    description: "Trending, movers, analyzer, and scout",
    slugs: ["pumpfun-trending", "pumpfun-movers", "pumpfun-analyzer", "pumpfun-scout"],
  },
  {
    title: "RPC & Infrastructure",
    description: "Quicknode Solana and Base RPC",
    slugs: ["quicknode"],
  },
  {
    title: "Partner: Nansen",
    description: "Smart money and token god mode",
    slugs: ["smart-money", "token-god-mode", "nansen-endpoints"],
  },
  {
    title: "Partner: Jupiter",
    description: "Trending, swap quotes, pump.fun agents",
    slugs: ["trending-jupiter", "jupiter-quote", "pumpfun-agents-swap"],
  },
  {
    title: "Partner: Squid Router",
    description: "Cross-chain routes and status",
    slugs: ["squid-route", "squid-status"],
  },
  {
    title: "Partner: RISE",
    description: "RISE partner endpoints",
    slugs: ["rise"],
  },
  {
    title: "Partner: Purch Vault",
    description: "Purch Vault API",
    slugs: ["purch-vault"],
  },
  {
    title: "Partner: Agent-only tools",
    description: "StableCrypto, StableSocial, StableEnrich, and partners",
    slugs: ["agent-tools-market-data", "agent-tools-social-data", "agent-tools-enrichment-data", "agent-tools-partners"],
  },
  {
    title: "8004 Agent Registry",
    description: "Trustless agent registry, stats, and search",
    slugs: ["8004", "8004-stats", "8004-leaderboard", "8004-agents-search"],
  },
];

const QUICK_LINKS = [
  {
    icon: Zap,
    label: "x402 Payment Flow",
    href: "/docs/api/x402-api-standard",
    description: "Wire format and signing",
  },
  {
    icon: HeartPulse,
    label: "API Health",
    href: "/docs/api/health",
    description: "Gateway status check",
  },
  {
    icon: FlaskConical,
    label: "API Playground",
    href: SYRA_PLAYGROUND_URL,
    description: `${SYRA_WEB_LABEL}/playground`,
    external: true,
  },
];

const tocItems = [
  { id: "quick-start", title: "Quick Start", level: 2 },
  { id: "overview", title: "Overview", level: 2 },
  { id: "base-url", title: "Base URL", level: 2 },
  { id: "authentication", title: "Authentication", level: 2 },
  { id: "categories", title: "API Categories", level: 2 },
  { id: "payment-flow", title: "Payment Flow", level: 2 },
  { id: "errors", title: "Error Handling", level: 2 },
];

export default function APIReference() {
  return (
    <DocsLayout toc={tocItems} wide>
      <DocPageHeader
        eyebrow="API Reference"
        title="x402 API Overview"
        description={
          <>
            Syra x402 API reference. Paid routes use the x402 payment protocol. Preview and dashboard helpers are free
            for trusted origins — see{" "}
            <Link to="/docs/api/preview-dashboard" className="text-primary hover:underline">
              Preview & Dashboard
            </Link>
            .
          </>
        }
        wide
      />

      <section id="quick-start" className="mb-12 scroll-mt-24 not-prose">
        <div className="grid sm:grid-cols-3 gap-3">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            const inner = (
              <>
                <Icon className="h-5 w-5 text-primary mb-2" />
                <p className="font-medium text-foreground">{link.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{link.description}</p>
              </>
            );
            return link.external ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-border/60 p-4 hover:border-primary/40 hover:bg-muted/30 transition-colors"
              >
                {inner}
              </a>
            ) : (
              <Link
                key={link.label}
                to={link.href}
                className="rounded-lg border border-border/60 p-4 hover:border-primary/40 hover:bg-muted/30 transition-colors"
              >
                {inner}
              </Link>
            );
          })}
        </div>
      </section>

      <DocSection id="overview" title="Overview" prose>
        <p>
          Paid endpoints use unversioned paths (e.g. <code>/news</code>, <code>/signal</code>). On first request without
          payment you receive <strong>402 Payment Required</strong> with payment instructions; after completing payment
          you retry with the payment proof to receive data.
        </p>
      </DocSection>

      <DocSection id="base-url" title="Base URL">
        <div className="rounded-lg border border-border/60 p-4 bg-muted/20 not-prose">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Base URL</p>
          <code className="text-sm font-mono">{BASE_URL}</code>
          <p className="text-sm text-muted-foreground mt-2">
            All API requests should be made to this base URL. The API uses JSON for requests and responses.
          </p>
        </div>
        <a
          href={SYRA_PLAYGROUND_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10 transition-colors not-prose"
        >
          <ExternalLink className="h-4 w-4" />
          Try the API Playground
        </a>
      </DocSection>

      <DocSection id="authentication" title="Authentication (x402)" prose>
        <Callout variant="important" title="Paid routes require x402">
          <p>
            The first request without an <code>X-PAYMENT</code> header returns <strong>HTTP 402</strong> with an{" "}
            <code>accepts</code> array. Replay with <code>X-PAYMENT</code> set to a signed payload from any x402 client.
          </p>
        </Callout>
        <p>
          Preview and dashboard routes (<code>/dashboard-summary</code>, <code>/preview/*</code>, <code>/health</code>) do
          not use x402 and are free for trusted browser origins.
        </p>
        <CodeBlock
          plain
          tabs={[
            {
              label: "curl",
              code: `# 1. First request returns 402
curl -i "${BASE_URL}/news?ticker=BTC"

# 2. Retry with X-PAYMENT header
curl -i "${BASE_URL}/news?ticker=BTC" \\
  -H "X-PAYMENT: <base64url-encoded signed payload>"`,
              language: "bash",
            },
          ]}
        />
      </DocSection>

      <section id="categories" className="mb-12 scroll-mt-24">
        <h2 className="docs-display text-2xl font-semibold tracking-tight mb-2">API Categories</h2>
        <p className="text-muted-foreground mb-6 leading-7">
          Browse by category or use the sidebar filter to find a specific endpoint.
        </p>
        <div className="grid sm:grid-cols-2 gap-3 not-prose">
          {API_CATEGORIES.map((category) => {
            const firstSlug = category.slugs.find((s) => apiDocs[s]);
            if (!firstSlug) return null;
            return (
              <Link
                key={category.title}
                to={`/docs/api/${firstSlug}`}
                className="group rounded-lg border border-border/60 p-4 hover:border-primary/40 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {category.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{category.description}</p>
                    <p className="text-xs text-muted-foreground/80 mt-2">
                      {category.slugs.filter((s) => apiDocs[s]).length} endpoints
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <DocSection id="payment-flow" title="Payment Flow" prose>
        <ol>
          <li>
            Make the request without payment. The API responds <strong>402</strong> with an <code>accepts</code> array
            describing supported networks and USDC price.
          </li>
          <li>Pick one offer and use an x402 client to build, sign, and encode a payment payload.</li>
          <li>
            Replay with <code>X-PAYMENT</code>. The API verifies, settles, and returns 200 with{" "}
            <code>X-PAYMENT-RESPONSE</code>.
          </li>
        </ol>
        <p>
          <Link to="/docs/api/x402-api-standard" className="text-primary hover:underline">
            Full x402 Payment Flow documentation →
          </Link>
        </p>
      </DocSection>

      <DocSection id="errors" title="Error Handling" prose>
        <div className="not-prose overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-2.5 font-medium">Code</th>
                <th className="text-left px-4 py-2.5 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/40">
                <td className="px-4 py-2.5 font-mono">200</td>
                <td className="px-4 py-2.5 text-muted-foreground">Success — data returned</td>
              </tr>
              <tr className="border-b border-border/40">
                <td className="px-4 py-2.5 font-mono">402</td>
                <td className="px-4 py-2.5 text-muted-foreground">Payment Required — complete payment, then retry</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono">5xx</td>
                <td className="px-4 py-2.5 text-muted-foreground">Server error — retry later</td>
              </tr>
            </tbody>
          </table>
        </div>
      </DocSection>
    </DocsLayout>
  );
}
