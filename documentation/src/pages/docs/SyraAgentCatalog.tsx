import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AGENT_TOOLS_CATALOG,
  getToolsByCategory,
  formatPrice,
} from "@/data/agentToolsCatalog";
import { ArrowRight } from "lucide-react";

const AGENT_URL = "https://agent.syraa.fun";

const tocItems = [
  { id: "overview", title: "Overview", level: 2 },
  { id: "core-tools", title: "Core tools", level: 2 },
  { id: "market-data-tools", title: "Market data (StableCrypto)", level: 2 },
  { id: "social-data-tools", title: "Social data (StableSocial)", level: 2 },
  { id: "enrichment-data-tools", title: "Enrichment (StableEnrich)", level: 2 },
  { id: "partner-tools", title: "Partner tools", level: 2 },
  { id: "memecoin-tools", title: "Memecoin tools", level: 2 },
  { id: "how-to-use", title: "How to use", level: 2 },
];

function ToolTable({
  tools,
  id,
}: {
  tools: typeof AGENT_TOOLS_CATALOG;
  id: string;
}) {
  return (
    <div id={id} className="mb-10 scroll-mt-24">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Tool</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-[80px] text-right">Price</TableHead>
            <TableHead className="min-w-[200px]">Example prompt</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tools.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="font-medium text-foreground">{t.name}</TableCell>
              <TableCell className="text-muted-foreground">{t.description}</TableCell>
              <TableCell className="text-right text-muted-foreground whitespace-nowrap">
                {formatPrice(t.priceUsd)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                <em className="text-foreground/90 not-italic">"{t.examplePrompt}"</em>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function SyraAgentCatalog() {
  const { core, marketData, socialData, enrichmentData, partner, memecoin } = getToolsByCategory();

  return (
    <DocsLayout toc={tocItems}>
      <div className="mb-8">
        <div className="text-sm text-primary font-medium mb-2">Syra Agent</div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Agent catalog</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Document which tools the Syra Agent can use and how to use them. Each tool is available at{" "}
          <a href={AGENT_URL} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
            agent.syraa.fun
          </a>{" "}
          — just ask in natural language; the agent picks the right tool and pays per use when you have a connected wallet.
          Binance (correlation &amp; spot), Giza, Bankr, Neynar, and SIWA run <strong className="text-foreground">only</strong> through these agent tools (no public Syra URLs for them). See also the{" "}
          <Link to="/docs/api/agent-tools-partners" className="text-primary hover:underline">
            API doc for agent-only partner tools
          </Link>
          .
        </p>
      </div>

      <section id="overview" className="mb-10 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Overview</h2>
        <p className="text-muted-foreground mb-4">
          The Syra Agent exposes a set of <strong className="text-foreground">{AGENT_TOOLS_CATALOG.length} tools</strong> backed by the x402 API. Each tool has a name, description, a small per-call price in USD, and example prompts that typically trigger it. You can use the agent without memorizing tool names: describe what you want (e.g. &quot;Signal for Bitcoin&quot;, &quot;Latest news&quot;, &quot;TikTok profile for nike&quot;, &quot;Scrape this URL with Firecrawl&quot;) and the agent will select the appropriate tool. Curated x402 provider tools include <strong className="text-foreground">stablecrypto-*</strong> (10), <strong className="text-foreground">stablesocial-*</strong> (11), and <strong className="text-foreground">stableenrich-*</strong> (19).
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Core tools</h2>
        <p className="text-muted-foreground mb-4">
          Core tools for news, signals, sentiment, research, discovery, X search, KOL data, and digests.
        </p>
        <ToolTable tools={core} id="core-tools" />
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Market data (StableCrypto)</h2>
        <p className="text-muted-foreground mb-4">
          Live CoinGecko and DefiLlama data via{" "}
          <a
            href="https://stablecrypto.dev"
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            StableCrypto
          </a>{" "}
          (~$0.01/call, agent wallet x402). Includes curated{" "}
          <code className="text-sm bg-muted px-1 rounded">stablecrypto-*</code> tools and pay.sh catalog tools for the
          full API surface. See{" "}
          <Link to="/docs/agent/market-data" className="text-primary hover:underline">
            Market data guide
          </Link>{" "}
          for parameters, routing, and API examples.
        </p>
        <ToolTable tools={marketData} id="market-data-tools" />
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Social data (StableSocial)</h2>
        <p className="text-muted-foreground mb-4">
          TikTok, Instagram, Facebook, and Reddit via{" "}
          <a
            href="https://stablesocial.dev"
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            StableSocial
          </a>{" "}
          (~$0.06/trigger, async job + SIWX poll). See{" "}
          <Link to="/docs/agent/social-data" className="text-primary hover:underline">
            Social data guide
          </Link>
          .
        </p>
        <ToolTable tools={socialData} id="social-data-tools" />
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Enrichment (StableEnrich)</h2>
        <p className="text-muted-foreground mb-4">
          Exa, Firecrawl, Apollo, Google Maps, Reddit, Serper, Hunter, Minerva via{" "}
          <a
            href="https://stableenrich.dev"
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            StableEnrich
          </a>{" "}
          (per-endpoint x402 pricing). See{" "}
          <Link to="/docs/agent/enrichment-data" className="text-primary hover:underline">
            Enrichment guide
          </Link>
          .
        </p>
        <ToolTable tools={enrichmentData} id="enrichment-data-tools" />
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Partner tools</h2>
        <p className="text-muted-foreground mb-4">
          Partner-backed tools: Nansen, Jupiter, Squid Router, Purch Vault, 8004 / 8004scan, plus{" "}
          <strong className="text-foreground">Binance, Giza, Bankr, Neynar, and SIWA</strong> (those five are agent-executed only on Syra—use{" "}
          <Link to="/docs/api/agent-tools-partners" className="text-primary hover:underline">
            POST /agent/tools/call
          </Link>{" "}
          or chat at agent.syraa.fun).
        </p>
        <ToolTable tools={partner} id="partner-tools" />
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Memecoin tools</h2>
        <p className="text-muted-foreground mb-4">
          Memecoin screens (e.g. fastest holder growth, smart money mentions, organic traction).
        </p>
        <ToolTable tools={memecoin} id="memecoin-tools" />
      </section>

      <section id="how-to-use" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">How to use</h2>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>Open the <a href={AGENT_URL} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Syra Agent</a> and type your request in plain language.</li>
          <li>Use the <strong className="text-foreground">example prompts</strong> in the tables above as inspiration (e.g. &quot;Signal for Bitcoin&quot;, &quot;BTC price right now&quot;, &quot;Global market cap&quot;, &quot;Trending on Jupiter&quot;).</li>
          <li>For paid tools, connect a wallet so the agent can pay per call; prices are listed in USD per request.</li>
          <li>Check-status is a minimal-cost health check; most other tools use the standard per-call pricing shown.</li>
          <li>
            Integrations can call <strong className="text-foreground">GET /agent/tools</strong> and{" "}
            <strong className="text-foreground">POST /agent/tools/call</strong> on the Syra API with the user&apos;s{" "}
            <code className="text-sm bg-muted px-1 rounded">anonymousId</code> — API docs:{" "}
            <Link to="/docs/api/agent-tools-market-data" className="text-primary hover:underline">StableCrypto</Link>,{" "}
            <Link to="/docs/api/agent-tools-social-data" className="text-primary hover:underline">StableSocial</Link>,{" "}
            <Link to="/docs/api/agent-tools-enrichment-data" className="text-primary hover:underline">StableEnrich</Link>,{" "}
            <Link to="/docs/api/agent-tools-partners" className="text-primary hover:underline">partners</Link>.
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
          <Link to="/docs/agent/getting-started">← Getting Started</Link>
        </Button>
      </div>
    </DocsLayout>
  );
}
