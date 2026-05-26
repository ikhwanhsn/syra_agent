import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getToolsByCategory, formatPrice } from "@/data/agentToolsCatalog";
import { ArrowRight, ExternalLink } from "lucide-react";

const AGENT_URL = "https://agent.syraa.fun";
const STABLECRYPTO_LLMS = "https://stablecrypto.dev/llms.txt";
const STABLECRYPTO_BASE = "https://stablecrypto.dev";

const tocItems = [
  { id: "overview", title: "Overview", level: 2 },
  { id: "how-it-works", title: "How it works in chat", level: 2 },
  { id: "stablecrypto-tools", title: "StableCrypto tools", level: 2 },
  { id: "params", title: "Parameters & examples", level: 2 },
  { id: "paysh", title: "pay.sh gateway", level: 2 },
  { id: "routing", title: "When the agent picks what", level: 2 },
  { id: "api-integration", title: "API integration", level: 2 },
  { id: "pricing", title: "Pricing & wallet", level: 2 },
  { id: "related-guides", title: "Related guides", level: 2 },
];

const stablecryptoParamRows = [
  {
    toolId: "stablecrypto-coingecko-price",
    required: "ids",
    optional: "vs_currencies (default usd)",
    example: '{ "ids": "bitcoin,ethereum" }',
  },
  {
    toolId: "stablecrypto-coingecko-global",
    required: "—",
    optional: "—",
    example: "{}",
  },
  {
    toolId: "stablecrypto-coingecko-trending",
    required: "—",
    optional: "—",
    example: "{}",
  },
  {
    toolId: "stablecrypto-coingecko-markets",
    required: "—",
    optional: "ids, vs_currency, order, per_page, page",
    example: '{ "vs_currency": "usd", "per_page": "20" }',
  },
  {
    toolId: "stablecrypto-coingecko-ohlc",
    required: "id",
    optional: "vs_currency, days",
    example: '{ "id": "bitcoin", "days": "7" }',
  },
  {
    toolId: "stablecrypto-defillama-protocols",
    required: "—",
    optional: "—",
    example: "{}",
  },
  {
    toolId: "stablecrypto-defillama-chains",
    required: "—",
    optional: "—",
    example: "{}",
  },
  {
    toolId: "stablecrypto-defillama-tvl",
    required: "protocol",
    optional: "—",
    example: '{ "protocol": "aave" }',
  },
  {
    toolId: "stablecrypto-defillama-coins-prices",
    required: "coins",
    optional: "—",
    example: '{ "coins": "coingecko:ethereum" }',
  },
  {
    toolId: "stablecrypto-defillama-yields-pools",
    required: "—",
    optional: "—",
    example: "{}",
  },
];

export default function AgentMarketData() {
  const { marketData } = getToolsByCategory();
  const stablecryptoTools = marketData.filter((t) => t.id.startsWith("stablecrypto-"));
  const payshTools = marketData.filter((t) => t.id.startsWith("paysh-"));

  return (
    <DocsLayout toc={tocItems}>
      <div className="mb-8">
        <div className="text-sm text-primary font-medium mb-2">Syra Agent</div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Market data (StableCrypto)</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          The Syra Agent can fetch live CoinGecko and DefiLlama data through{" "}
          <a
            href={STABLECRYPTO_BASE}
            className="text-primary hover:underline inline-flex items-center gap-1"
            target="_blank"
            rel="noopener noreferrer"
          >
            StableCrypto
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          — paid per request via x402 from your agent wallet. Ask in chat at{" "}
          <a href={AGENT_URL} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
            agent.syraa.fun
          </a>{" "}
          or call tools programmatically.
        </p>
      </div>

      <section id="overview" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Overview</h2>
        <p className="text-muted-foreground mb-4">
          <strong className="text-foreground">StableCrypto</strong> is a micropayment API gateway (
          <a href={STABLECRYPTO_LLMS} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
            llms.txt
          </a>
          ) that exposes CoinGecko market data, DefiLlama TVL/yields, Alchemy blockchain data, and Etherscan explorer
          endpoints. Every upstream call is <strong className="text-foreground">POST</strong> and costs about{" "}
          <strong className="text-foreground">$0.01 USDC</strong> via x402/MPP (Solana, Base, or Tempo).
        </p>
        <p className="text-muted-foreground mb-4">
          Syra integrates StableCrypto in two ways:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
          <li>
            <strong className="text-foreground">Curated agent tools</strong> (<code className="text-sm bg-muted px-1 rounded">stablecrypto-*</code>
            ) — ten first-class tools with simple params (ids, protocol, etc.) for chat and{" "}
            <code className="text-sm bg-muted px-1 rounded">POST /agent/tools/call</code>.
          </li>
          <li>
            <strong className="text-foreground">pay.sh catalog</strong> (<code className="text-sm bg-muted px-1 rounded">paysh-discover</code>,{" "}
            <code className="text-sm bg-muted px-1 rounded">paysh-endpoints</code>,{" "}
            <code className="text-sm bg-muted px-1 rounded">paysh-call</code>) — generic gateway to the full StableCrypto
            OpenAPI surface and ~75 other x402 providers.
          </li>
        </ul>
        <p className="text-muted-foreground">
          Both paths work in <strong className="text-foreground">agent chat completion</strong> and the{" "}
          <strong className="text-foreground">tools API</strong>. The agent wallet pays StableCrypto upstream; you are not
          billed on Syra-hosted x402 routes for these calls.
        </p>
      </section>

      <section id="how-it-works" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">How it works in chat</h2>
        <ol className="list-decimal pl-6 space-y-2 text-muted-foreground mb-4">
          <li>You send a natural-language message (e.g. &quot;What&apos;s the Bitcoin price?&quot;).</li>
          <li>
            The agent&apos;s tool router selects a tool — for major-coin spot price it prefers{" "}
            <code className="text-sm bg-muted px-1 rounded">stablecrypto-coingecko-price</code> over the Syra{" "}
            <code className="text-sm bg-muted px-1 rounded">signal</code> tool when you only need a live quote.
          </li>
          <li>
            The server calls <code className="text-sm bg-muted px-1 rounded">https://stablecrypto.dev</code> with POST +
            x402; your agent USDC balance is debited (~$0.01 per call).
          </li>
          <li>The LLM summarizes the JSON response in plain language.</li>
        </ol>
        <div className="p-4 rounded-lg border border-border bg-muted/30 text-sm text-muted-foreground">
          <strong className="text-foreground">Example prompts:</strong> &quot;Global crypto market cap&quot;, &quot;BTC and
          ETH price&quot;, &quot;CoinGecko trending&quot;, &quot;DefiLlama TVL for aave&quot;, &quot;Top DeFi protocols by
          TVL&quot;.
        </div>
      </section>

      <section id="stablecrypto-tools" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">StableCrypto tools</h2>
        <p className="text-muted-foreground mb-4">
          Each row is a registered Syra agent tool. Upstream path is always under{" "}
          <code className="text-sm bg-muted px-1 rounded">{STABLECRYPTO_BASE}</code>.
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Tool ID</TableHead>
              <TableHead>Upstream path</TableHead>
              <TableHead className="w-[80px] text-right">Price</TableHead>
              <TableHead>Example prompt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stablecryptoTools.map((t) => {
              const upstream = stablecryptoParamRows.find((r) => r.toolId === t.id);
              const path = upstream
                ? t.id.replace("stablecrypto-coingecko-", "/api/coingecko/").replace("stablecrypto-defillama-", "/api/defillama/")
                : "";
              const displayPath =
                t.id === "stablecrypto-coingecko-price"
                  ? "/api/coingecko/price"
                  : t.id === "stablecrypto-coingecko-global"
                    ? "/api/coingecko/global"
                    : t.id === "stablecrypto-coingecko-trending"
                      ? "/api/coingecko/trending"
                      : t.id === "stablecrypto-coingecko-markets"
                        ? "/api/coingecko/markets"
                        : t.id === "stablecrypto-coingecko-ohlc"
                          ? "/api/coingecko/ohlc"
                          : t.id === "stablecrypto-defillama-protocols"
                            ? "/api/defillama/protocols"
                            : t.id === "stablecrypto-defillama-chains"
                              ? "/api/defillama/chains"
                              : t.id === "stablecrypto-defillama-tvl"
                                ? "/api/defillama/tvl"
                                : t.id === "stablecrypto-defillama-coins-prices"
                                  ? "/api/defillama/coins/prices"
                                  : t.id === "stablecrypto-defillama-yields-pools"
                                    ? "/api/defillama/yields/pools"
                                    : path;
              return (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs text-foreground">{t.id}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{displayPath}</TableCell>
                  <TableCell className="text-right text-muted-foreground whitespace-nowrap">
                    {formatPrice(t.priceUsd)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <em className="text-foreground/90 not-italic">&quot;{t.examplePrompt.split(" / ")[0]}&quot;</em>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <p className="text-muted-foreground mt-4 text-sm">
          Additional StableCrypto routes (Alchemy, Etherscan, on-chain CoinGecko) are available via{" "}
          <Link to="#paysh" className="text-primary hover:underline">
            pay.sh call
          </Link>{" "}
          — see the{" "}
          <a href={STABLECRYPTO_LLMS} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
            full endpoint list
          </a>
          .
        </p>
      </section>

      <section id="params" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Parameters & examples</h2>
        <p className="text-muted-foreground mb-4">
          Chat and <code className="text-sm bg-muted px-1 rounded">POST /agent/tools/call</code> use flat string params. The
          server builds the StableCrypto POST JSON body. You can also pass a full payload with{" "}
          <code className="text-sm bg-muted px-1 rounded">body</code> as a JSON string (advanced).
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tool ID</TableHead>
              <TableHead>Required</TableHead>
              <TableHead>Optional</TableHead>
              <TableHead>Example params</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stablecryptoParamRows.map((row) => (
              <TableRow key={row.toolId}>
                <TableCell className="font-mono text-xs">{row.toolId}</TableCell>
                <TableCell className="text-muted-foreground">{row.required}</TableCell>
                <TableCell className="text-muted-foreground">{row.optional}</TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.example}</code>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-muted-foreground mt-4 mb-4">
          <strong className="text-foreground">CoinGecko ids</strong> are lowercase slugs:{" "}
          <code className="text-sm bg-muted px-1 rounded">bitcoin</code>,{" "}
          <code className="text-sm bg-muted px-1 rounded">ethereum</code>,{" "}
          <code className="text-sm bg-muted px-1 rounded">solana</code> — not tickers BTC/ETH/SOL in the API body (the agent
          maps those for you in chat).
        </p>
        <CodeBlock
          language="json"
          code={`// POST /agent/tools/call
{
  "anonymousId": "<your-session-id>",
  "toolId": "stablecrypto-coingecko-price",
  "params": {
    "ids": "bitcoin,ethereum",
    "vs_currencies": "usd"
  }
}`}
        />
      </section>

      <section id="paysh" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">pay.sh gateway</h2>
        <p className="text-muted-foreground mb-4">
          For endpoints not wrapped as <code className="text-sm bg-muted px-1 rounded">stablecrypto-*</code> tools, use the
          pay.sh trio. Discovery and endpoint listing are <strong className="text-foreground">free</strong>;{" "}
          <code className="text-sm bg-muted px-1 rounded">paysh-call</code> charges at least the provider&apos;s{" "}
          <code className="text-sm bg-muted px-1 rounded">min_price_usd</code> (StableCrypto: ~$0.01).
        </p>
        <Table className="mb-6">
          <TableHeader>
            <TableRow>
              <TableHead>Tool ID</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payshTools.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-xs">{t.id}</TableCell>
                <TableCell className="text-muted-foreground">{t.description}</TableCell>
                <TableCell className="text-right text-muted-foreground">{formatPrice(t.priceUsd)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-muted-foreground mb-4">
          <strong className="text-foreground">StableCrypto FQN</strong> on pay.sh:{" "}
          <code className="text-sm bg-muted px-1 rounded">merit-systems/stablecrypto/market-data</code>
        </p>
        <CodeBlock
          language="json"
          code={`{
  "anonymousId": "<session-id>",
  "toolId": "paysh-call",
  "params": {
    "fqn": "merit-systems/stablecrypto/market-data",
    "path": "/api/coingecko/global",
    "method": "POST",
    "body": "{}"
  }
}`}
        />
        <p className="text-muted-foreground mt-4 text-sm">
          Flow: <code className="text-sm bg-muted px-1 rounded">paysh-discover</code> with{" "}
          <code className="text-sm bg-muted px-1 rounded">q=stablecrypto</code> →{" "}
          <code className="text-sm bg-muted px-1 rounded">paysh-endpoints</code> with the fqn →{" "}
          <code className="text-sm bg-muted px-1 rounded">paysh-call</code> with path + body from OpenAPI.
        </p>
      </section>

      <section id="routing" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">When the agent picks what</h2>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>
            <strong className="text-foreground">Major coin spot price / global market / CoinGecko trending / DefiLlama
            TVL</strong> → <code className="text-sm bg-muted px-1 rounded">stablecrypto-*</code> tools.
          </li>
          <li>
            <strong className="text-foreground">Full technical trading signal</strong> (RSI, MACD, levels, action plan) →
            Syra <code className="text-sm bg-muted px-1 rounded">signal</code> tool (Binance/CoinGecko OHLC + Syra engine).
          </li>
          <li>
            <strong className="text-foreground">Solana token by mint</strong> (price, security, OHLCV, holders) →{" "}
            <code className="text-sm bg-muted px-1 rounded">birdeye-*</code> tools (requires contract address).
          </li>
          <li>
            <strong className="text-foreground">Any other StableCrypto route</strong> (e.g. Alchemy portfolio, Etherscan
            gas) → <code className="text-sm bg-muted px-1 rounded">paysh-call</code> with the StableCrypto FQN.
          </li>
        </ul>
      </section>

      <section id="api-integration" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">API integration</h2>
        <p className="text-muted-foreground mb-4">
          Programmatic access uses the same tool IDs as chat. See{" "}
          <Link to="/docs/api/agent-tools-market-data" className="text-primary hover:underline">
            API: Agent market data tools
          </Link>{" "}
          for <code className="text-sm bg-muted px-1 rounded">GET /agent/tools</code> and{" "}
          <code className="text-sm bg-muted px-1 rounded">POST /agent/tools/call</code>.
        </p>
        <p className="text-muted-foreground mb-4">
          Server-side env (optional): <code className="text-sm bg-muted px-1 rounded">STABLECRYPTO_API_BASE_URL</code>{" "}
          defaults to <code className="text-sm bg-muted px-1 rounded">https://stablecrypto.dev</code>. pay.sh catalog
          refresh uses <code className="text-sm bg-muted px-1 rounded">PAYSH_CATALOG_URL</code> /{" "}
          <code className="text-sm bg-muted px-1 rounded">PAYSH_SKILLS_BASE_URL</code> if you override gateways.
        </p>
      </section>

      <section id="pricing" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Pricing & wallet</h2>
        <p className="text-muted-foreground mb-4">
          Each <code className="text-sm bg-muted px-1 rounded">stablecrypto-*</code> call is billed at{" "}
          <strong className="text-foreground">{formatPrice(0.01)}</strong> from your agent wallet (display price may
          reflect production markup in the UI). SYRA holders may receive treasury-paid tool execution per Syra policy —
          same as other agent tools.
        </p>
        <p className="text-muted-foreground">
          If balance is insufficient, the tool is skipped in chat and the assistant explains that you need to deposit USDC
          to the agent wallet. No charge is applied when required params are missing.
        </p>
      </section>

      <section id="related-guides" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Related agent guides</h2>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>
            <Link to="/docs/agent/social-data" className="text-primary hover:underline">
              Social data (StableSocial)
            </Link>{" "}
            — TikTok, Instagram, Facebook, Reddit
          </li>
          <li>
            <Link to="/docs/agent/enrichment-data" className="text-primary hover:underline">
              Enrichment (StableEnrich)
            </Link>{" "}
            — Exa, Firecrawl, Apollo, maps, Hunter, Minerva
          </li>
          <li>
            <Link to="/docs/agent/agent-catalog" className="text-primary hover:underline">
              Full agent catalog
            </Link>
          </li>
        </ul>
      </section>

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
        <Button variant="primary" size="lg" className="w-full sm:min-w-[12rem] sm:w-auto justify-center" asChild>
          <a href={AGENT_URL} target="_blank" rel="noopener noreferrer">
            Open Syra Agent
            <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
          </a>
        </Button>
        <Button variant="outline" size="lg" className="w-full sm:min-w-[12rem] sm:w-auto justify-center" asChild>
          <Link to="/docs/agent/agent-catalog">Agent Catalog</Link>
        </Button>
        <Button variant="ghost" size="lg" className="w-full sm:min-w-[12rem] sm:w-auto justify-center" asChild>
          <Link to="/docs/agent/features">← Agent Features</Link>
        </Button>
      </div>
    </DocsLayout>
  );
}
