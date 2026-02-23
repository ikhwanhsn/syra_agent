import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { apiDocs } from "@/data/apiDocs";
import { ArrowRight, ExternalLink } from "lucide-react";

const BASE_URL = "https://api.syraa.fun/v2";

// Group slugs by category for the overview (matches Sidebar structure)
const API_CATEGORIES: { title: string; slugs: string[] }[] = [
  {
    title: "Overview & Standards",
    slugs: ["x402-api-standard", "check-status"],
  },
  {
    title: "News & Sentiment",
    slugs: ["news", "sentiment", "trending-headline", "sundown-digest"],
  },
  {
    title: "Research & Discovery",
    slugs: ["browse", "research", "x-search", "exa-search", "gems"],
  },
  {
    title: "Trading & Events",
    slugs: ["signal", "event"],
  },
  {
    title: "KOL & Influencers",
    slugs: ["kol", "crypto-kol"],
  },
  {
    title: "Partner: Nansen",
    slugs: ["smart-money", "token-god-mode", "nansen-endpoints"],
  },
  {
    title: "Partner: DexScreener & Jupiter",
    slugs: ["dexscreener", "trending-jupiter"],
  },
  {
    title: "Partner: Rugcheck",
    slugs: ["token-report", "token-statistic", "token-risk-alerts"],
  },
  {
    title: "Partner: Bubblemaps & Binance",
    slugs: ["bubblemaps-maps", "binance-correlation"],
  },
  {
    title: "Partner: Workfun",
    slugs: ["pump"],
  },
  {
    title: "Partner: CoinGecko",
    slugs: ["coingecko-onchain"],
  },
  {
    title: "Memecoin",
    slugs: [
      "memecoin-fastest-holder-growth",
      "memecoin-most-mentioned-smart-money-x",
      "memecoin-accumulating-before-cex-rumors",
      "memecoin-strong-narrative-low-market-cap",
      "memecoin-by-experienced-devs",
      "memecoin-unusual-whale-behavior",
      "memecoin-trending-on-x-not-dex",
      "memecoin-organic-traction",
      "memecoin-surviving-market-dumps",
    ],
  },
];

const tocItems = [
  { id: "overview", title: "Overview", level: 2 },
  { id: "base-url", title: "Base URL", level: 2 },
  { id: "authentication", title: "Authentication (x402)", level: 2 },
  { id: "all-endpoints", title: "All v2 Endpoints", level: 2 },
  ...API_CATEGORIES.map((c) => ({ id: `cat-${c.slugs[0]}`, title: c.title, level: 3 })),
  { id: "payment-flow", title: "Payment Flow", level: 2 },
  { id: "errors", title: "Error Handling", level: 2 },
];

export default function APIReference() {
  return (
    <DocsLayout toc={tocItems}>
      <div className="mb-8">
        <div className="text-sm text-primary font-medium mb-2">API Reference</div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">v2 API Overview</h1>
        <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
          Syra x402 v2 API reference. All endpoints use the x402 payment protocol for research, sentiment, signals, news, memecoin screens, and partner data.
        </p>
      </div>

      <section id="overview" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Overview</h2>
        <p className="text-muted-foreground mb-4">
          Every paid API uses the <code className="text-sm font-mono bg-muted px-1 rounded">/v2</code> path prefix.
          On first request without payment you receive <strong>402 Payment Required</strong> with payment instructions; after completing payment you retry with the payment proof to receive data.
        </p>
      </section>

      <section id="base-url" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Base URL</h2>
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 text-sm font-mono mb-2">
            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">BASE URL</span>
            <span className="text-muted-foreground">{BASE_URL}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            All v2 API requests should be made to this base URL. The API uses JSON for requests and responses.
          </p>
        </div>
        <a
          href="https://playground.syraa.fun"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          Try the API Playground — playground.syraa.fun
        </a>
      </section>

      <section id="authentication" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Authentication (x402)</h2>
        <p className="text-muted-foreground mb-4">
          This API uses the <strong>x402 payment protocol</strong>. There is no API key; you pay per request. On first request without payment you get a 402 response with payment instructions. After completing payment, retry the same request with the payment proof in headers to receive the data.
        </p>
        <CodeBlock
          plain
          code={`# First request returns 402 with payment instructions
curl "${BASE_URL}/news?ticker=BTC"

# After payment, retry with payment proof in headers
curl "${BASE_URL}/news?ticker=BTC" \\
  -H "PAYMENT-SIGNATURE: ..." \\
  -H "PAYMENT-TOKEN: ..."`}
          language="bash"
        />
      </section>

      <section id="all-endpoints" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-6">All v2 Endpoints</h2>
        <p className="text-muted-foreground mb-6">
          Each endpoint has full documentation (parameters, examples, payment flow). Click the endpoint name to open its doc page.
        </p>

        <div className="space-y-10">
          {API_CATEGORIES.map((category) => {
            const docs = category.slugs
              .map((slug) => ({ slug, doc: apiDocs[slug] }))
              .filter(({ doc }) => doc);
            if (docs.length === 0) return null;

            return (
              <div
                key={category.title}
                id={`cat-${category.slugs[0]}`}
                className="scroll-mt-24"
              >
                <h3 className="text-lg font-semibold mb-4 text-foreground">{category.title}</h3>
                <div className="rounded-lg border border-border overflow-hidden overflow-x-auto overflow-x-auto-touch">
                  <table className="w-full text-sm min-w-[520px]">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left p-2 sm:p-3 font-medium">Endpoint</th>
                        <th className="text-left p-2 sm:p-3 font-medium">Path</th>
                        <th className="text-left p-2 sm:p-3 font-medium">Methods</th>
                        <th className="text-left p-2 sm:p-3 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      {docs.map(({ slug, doc }) => (
                        <tr
                          key={slug}
                          className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                        >
                          <td className="p-2 sm:p-3">
                            <Link
                              to={`/docs/api/${slug}`}
                              className="font-medium text-primary hover:underline flex items-center gap-1"
                            >
                              {doc.title}
                              <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                            </Link>
                          </td>
                          <td className="p-2 sm:p-3 font-mono text-xs whitespace-nowrap">{doc.endpoints[0]?.path ?? ""}</td>
                          <td className="p-2 sm:p-3 whitespace-nowrap">
                            {[...new Set(doc.endpoints.map((e) => e.method))].join(", ")}
                          </td>
                          <td className="p-2 sm:p-3 max-w-md">{doc.overview}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section id="payment-flow" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Payment Flow</h2>
        <ol className="list-decimal pl-6 space-y-2 text-muted-foreground mb-4">
          <li>Initial request returns <strong>402 Payment Required</strong> with payment instructions.</li>
          <li>Complete payment (process payment header, submit via specified method, receive payment proof/token).</li>
          <li>Retry the same request with payment proof in headers to receive the data.</li>
        </ol>
        <p className="text-sm font-medium text-foreground mb-2">Example 402 response</p>
        <CodeBlock
          plain
          code={`{
  "error": "Payment Required",
  "price": 0.01,
  "currency": "USD",
  "paymentInstructions": {
    "method": "x402",
    "details": "..."
  }
}`}
          language="json"
        />
      </section>

      <section id="errors" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Error Handling</h2>
        <p className="text-muted-foreground mb-6">
          The API uses standard HTTP status codes. For payment-related behavior:
        </p>
        <div className="overflow-x-auto overflow-x-auto-touch mb-6">
          <table className="w-full text-sm min-w-[200px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 sm:py-3 pr-2 sm:pr-4 font-medium">Code</th>
                <th className="text-left py-2 sm:py-3 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border">
                <td className="py-3 pr-4 font-mono">200</td>
                <td className="py-3">Success — data returned</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-3 pr-4 font-mono">402</td>
                <td className="py-3">Payment Required — complete payment first, then retry with proof</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-mono">5xx</td>
                <td className="py-3">Server error — retry later</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex justify-end pt-8 mt-8 border-t border-border">
        <Link
          to="/docs/api/check-status"
          className="group inline-flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
        >
          Check Status API
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </DocsLayout>
  );
}
