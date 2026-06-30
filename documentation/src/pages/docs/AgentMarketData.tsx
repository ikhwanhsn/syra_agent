import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { DocPageHeader } from "@/components/docs/DocPageHeader";
import { DocSection } from "@/components/docs/DocSection";
import { Callout } from "@/components/docs/Callout";
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

import { SYRA_AGENT_URL } from "@/content/syraUrls";
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
      <DocPageHeader
        eyebrow="Syra Agent"
        title="Market data (StableCrypto)"
        description={
          <>
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
            <a href={SYRA_AGENT_URL} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              syraa.fun
            </a>{" "}
            or call tools programmatically.
          </>
        }
      />

      <DocSection id="overview" title="Overview" prose>
        <p>
          <strong>StableCrypto</strong> is a micropayment API gateway (
          <a href={STABLECRYPTO_LLMS} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
            llms.txt
          </a>
          ) that exposes CoinGecko market data, DefiLlama TVL/yields, Alchemy blockchain data, and Etherscan explorer
          endpoints. Every upstream call is <strong>POST</strong> and costs about <strong>$0.01 USDC</strong> via
          x402/MPP (Solana, Base, or Tempo).
        </p>
        <p>Syra integrates StableCrypto in two ways:</p>
        <ul>
          <li>
            <strong>Curated agent tools</strong> (<code>stablecrypto-*</code>) — ten first-class tools with simple params
            (ids, protocol, etc.) for chat and <code>POST /agent/tools/call</code>.
          </li>
          <li>
            <strong>pay.sh catalog</strong> (<code>paysh-discover</code>, <code>paysh-endpoints</code>,{" "}
            <code>paysh-call</code>) — generic gateway to the full StableCrypto OpenAPI surface and ~75 other x402
            providers.
          </li>
        </ul>
        <p>
          Both paths work in <strong>agent chat completion</strong> and the <strong>tools API</strong>. The agent wallet
          pays StableCrypto upstream; you are not billed on Syra-hosted x402 routes for these calls.
        </p>
      </DocSection>

      <DocSection id="how-it-works" title="How it works in chat" prose>
        <ol>
          <li>You send a natural-language message (e.g. &quot;What&apos;s the Bitcoin price?&quot;).</li>
          <li>
            The agent&apos;s tool router selects a tool — for major-coin spot price it prefers{" "}
            <code>stablecrypto-coingecko-price</code> over the Syra <code>signal</code> tool when you only need a live
            quote.
          </li>
          <li>
            The server calls <code>https://stablecrypto.dev</code> with POST + x402; your agent USDC balance is debited
            (~$0.01 per call).
          </li>
          <li>The LLM summarizes the JSON response in plain language.</li>
        </ol>
        <Callout variant="tip" title="Example prompts">
          &quot;Global crypto market cap&quot;, &quot;BTC and ETH price&quot;, &quot;CoinGecko trending&quot;,
          &quot;DefiLlama TVL for aave&quot;, &quot;Top DeFi protocols by TVL&quot;.
        </Callout>
      </DocSection>

      <DocSection
        id="stablecrypto-tools"
        title="StableCrypto tools"
        description="Each row is a registered Syra agent tool. Upstream path is always under https://stablecrypto.dev."
      >
        <div className="not-prose overflow-x-auto">
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
        </div>
        <p className="text-muted-foreground mt-4 text-sm leading-7">
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
      </DocSection>

      <DocSection id="params" title="Parameters & examples">
        <p className="text-muted-foreground leading-7 mb-4">
          Chat and <code className="text-sm bg-muted px-1 rounded">POST /agent/tools/call</code> use flat string params.
          The server builds the StableCrypto POST JSON body. You can also pass a full payload with{" "}
          <code className="text-sm bg-muted px-1 rounded">body</code> as a JSON string (advanced).
        </p>
        <div className="not-prose overflow-x-auto mb-4">
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
        </div>
        <p className="text-muted-foreground leading-7 mb-4">
          <strong className="text-foreground">CoinGecko ids</strong> are lowercase slugs:{" "}
          <code className="text-sm bg-muted px-1 rounded">bitcoin</code>,{" "}
          <code className="text-sm bg-muted px-1 rounded">ethereum</code>,{" "}
          <code className="text-sm bg-muted px-1 rounded">solana</code> — not tickers BTC/ETH/SOL in the API body (the
          agent maps those for you in chat).
        </p>
        <div className="not-prose">
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
        </div>
      </DocSection>

      <DocSection id="paysh" title="pay.sh gateway">
        <p className="text-muted-foreground leading-7 mb-4">
          For endpoints not wrapped as <code className="text-sm bg-muted px-1 rounded">stablecrypto-*</code> tools, use
          the pay.sh trio. Discovery and endpoint listing are <strong className="text-foreground">free</strong>;{" "}
          <code className="text-sm bg-muted px-1 rounded">paysh-call</code> charges at least the provider&apos;s{" "}
          <code className="text-sm bg-muted px-1 rounded">min_price_usd</code> (StableCrypto: ~$0.01).
        </p>
        <div className="not-prose overflow-x-auto mb-6">
          <Table>
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
        </div>
        <p className="text-muted-foreground leading-7 mb-4">
          <strong className="text-foreground">StableCrypto FQN</strong> on pay.sh:{" "}
          <code className="text-sm bg-muted px-1 rounded">merit-systems/stablecrypto/market-data</code>
        </p>
        <div className="not-prose">
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
        </div>
        <p className="text-muted-foreground mt-4 text-sm leading-7">
          Flow: <code className="text-sm bg-muted px-1 rounded">paysh-discover</code> with{" "}
          <code className="text-sm bg-muted px-1 rounded">q=stablecrypto</code> →{" "}
          <code className="text-sm bg-muted px-1 rounded">paysh-endpoints</code> with the fqn →{" "}
          <code className="text-sm bg-muted px-1 rounded">paysh-call</code> with path + body from OpenAPI.
        </p>
      </DocSection>

      <DocSection id="routing" title="When the agent picks what" prose>
        <ul>
          <li>
            <strong>Major coin spot price / global market / CoinGecko trending / DefiLlama TVL</strong> →{" "}
            <code>stablecrypto-*</code> tools.
          </li>
          <li>
            <strong>Full technical trading signal</strong> (RSI, MACD, levels, action plan) → Syra <code>signal</code> tool
            (Binance/CoinGecko OHLC + Syra engine).
          </li>
          <li>
            <strong>Solana token by mint</strong> (price, security, OHLCV, holders) → <code>birdeye-*</code> tools
            (requires contract address).
          </li>
          <li>
            <strong>Any other StableCrypto route</strong> (e.g. Alchemy portfolio, Etherscan gas) →{" "}
            <code>paysh-call</code> with the StableCrypto FQN.
          </li>
        </ul>
      </DocSection>

      <DocSection id="api-integration" title="API integration" prose>
        <p>
          Programmatic access uses the same tool IDs as chat. See{" "}
          <Link to="/docs/api/agent-tools-market-data" className="text-primary hover:underline">
            API: Agent market data tools
          </Link>{" "}
          for <code>GET /agent/tools</code> and <code>POST /agent/tools/call</code>.
        </p>
        <p>
          Server-side env (optional): <code>STABLECRYPTO_API_BASE_URL</code> defaults to{" "}
          <code>https://stablecrypto.dev</code>. pay.sh catalog refresh uses <code>PAYSH_CATALOG_URL</code> /{" "}
          <code>PAYSH_SKILLS_BASE_URL</code> if you override gateways.
        </p>
      </DocSection>

      <DocSection id="pricing" title="Pricing & wallet" prose>
        <p>
          Each <code>stablecrypto-*</code> call is billed at <strong>{formatPrice(0.01)}</strong> from your agent wallet
          (display price may reflect production markup in the UI). SYRA holders may receive treasury-paid tool execution
          per Syra policy — same as other agent tools.
        </p>
        <p>
          If balance is insufficient, the tool is skipped in chat and the assistant explains that you need to deposit
          USDC to the agent wallet. No charge is applied when required params are missing.
        </p>
      </DocSection>

      <DocSection id="related-guides" title="Related agent guides" prose>
        <ul>
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
      </DocSection>

      <div className="flex flex-col sm:flex-row flex-wrap gap-3 not-prose">
        <Button variant="primary" size="lg" asChild>
          <a href={SYRA_AGENT_URL} target="_blank" rel="noopener noreferrer">
            Open Syra Agent
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link to="/docs/agent/agent-catalog">Agent Catalog</Link>
        </Button>
        <Button variant="ghost" size="lg" asChild>
          <Link to="/docs/agent/features">← Agent Features</Link>
        </Button>
      </div>
    </DocsLayout>
  );
}
