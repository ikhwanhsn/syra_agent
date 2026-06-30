import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { DocPageHeader } from "@/components/docs/DocPageHeader";
import { DocSection } from "@/components/docs/DocSection";
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

import { SYRA_AGENT_URL } from "@/content/syraUrls";

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

function ToolTable({ tools }: { tools: typeof AGENT_TOOLS_CATALOG }) {
  return (
    <div className="not-prose overflow-x-auto">
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
                <em className="text-foreground/90 not-italic">&quot;{t.examplePrompt}&quot;</em>
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
      <DocPageHeader
        eyebrow="Syra Agent"
        title="Agent catalog"
        description={
          <>
            Document which tools the Syra Agent can use and how to use them. Each tool is available at{" "}
            <a href={SYRA_AGENT_URL} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              syraa.fun
            </a>{" "}
            — just ask in natural language; the agent picks the right tool and pays per use when you have a connected
            wallet. Binance (correlation &amp; spot), Giza, Bankr, Neynar, and SIWA run{" "}
            <strong className="text-foreground">only</strong> through these agent tools (no public Syra URLs for them).
            See also the{" "}
            <Link to="/docs/api/agent-tools-partners" className="text-primary hover:underline">
              API doc for agent-only partner tools
            </Link>
            .
          </>
        }
      />

      <DocSection id="overview" title="Overview" prose>
        <p>
          The Syra Agent exposes a set of <strong>{AGENT_TOOLS_CATALOG.length} tools</strong> backed by the x402 API.
          Each tool has a name, description, a small per-call price in USD, and example prompts that typically trigger
          it. You can use the agent without memorizing tool names: describe what you want (e.g. &quot;Signal for
          Bitcoin&quot;, &quot;Latest news&quot;, &quot;TikTok profile for nike&quot;, &quot;Scrape this URL with
          Firecrawl&quot;) and the agent will select the appropriate tool. Curated x402 provider tools include{" "}
          <strong>stablecrypto-*</strong> (10), <strong>stablesocial-*</strong> (11), and{" "}
          <strong>stableenrich-*</strong> (19).
        </p>
      </DocSection>

      <DocSection
        id="core-tools"
        title="Core tools"
        description="Core tools for news, signals, sentiment, research, discovery, X search, KOL data, and digests."
      >
        <ToolTable tools={core} />
      </DocSection>

      <DocSection
        id="market-data-tools"
        title="Market data (StableCrypto)"
        description={
          <>
            Live CoinGecko and DefiLlama data via{" "}
            <a
              href="https://stablecrypto.dev"
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              StableCrypto
            </a>{" "}
            (~$0.01/call, agent wallet x402). Includes curated <code>stablecrypto-*</code> tools and pay.sh catalog
            tools for the full API surface. See{" "}
            <Link to="/docs/agent/market-data" className="text-primary hover:underline">
              Market data guide
            </Link>{" "}
            for parameters, routing, and API examples.
          </>
        }
      >
        <ToolTable tools={marketData} />
      </DocSection>

      <DocSection
        id="social-data-tools"
        title="Social data (StableSocial)"
        description={
          <>
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
          </>
        }
      >
        <ToolTable tools={socialData} />
      </DocSection>

      <DocSection
        id="enrichment-data-tools"
        title="Enrichment (StableEnrich)"
        description={
          <>
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
          </>
        }
      >
        <ToolTable tools={enrichmentData} />
      </DocSection>

      <DocSection
        id="partner-tools"
        title="Partner tools"
        description={
          <>
            Partner-backed tools: Nansen, Jupiter, Squid Router, Purch Vault, 8004 / 8004scan, plus{" "}
            <strong>Binance, Giza, Bankr, Neynar, and SIWA</strong> (those five are agent-executed only on Syra—use{" "}
            <Link to="/docs/api/agent-tools-partners" className="text-primary hover:underline">
              POST /agent/tools/call
            </Link>{" "}
            or chat at syraa.fun).
          </>
        }
      >
        <ToolTable tools={partner} />
      </DocSection>

      <DocSection
        id="memecoin-tools"
        title="Memecoin tools"
        description="Memecoin screens (e.g. fastest holder growth, smart money mentions, organic traction)."
      >
        <ToolTable tools={memecoin} />
      </DocSection>

      <DocSection id="how-to-use" title="How to use" prose>
        <ul>
          <li>
            Open the{" "}
            <a href={SYRA_AGENT_URL} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              Syra Agent
            </a>{" "}
            and type your request in plain language.
          </li>
          <li>
            Use the <strong>example prompts</strong> in the tables above as inspiration (e.g. &quot;Signal for
            Bitcoin&quot;, &quot;BTC price right now&quot;, &quot;Global market cap&quot;, &quot;Trending on
            Jupiter&quot;).
          </li>
          <li>For paid tools, connect a wallet so the agent can pay per call; prices are listed in USD per request.</li>
          <li>Check-status is a minimal-cost health check; most other tools use the standard per-call pricing shown.</li>
          <li>
            Integrations can call <strong>GET /agent/tools</strong> and <strong>POST /agent/tools/call</strong> on the
            Syra API with the user&apos;s <code>anonymousId</code> — API docs:{" "}
            <Link to="/docs/api/agent-tools-market-data" className="text-primary hover:underline">
              StableCrypto
            </Link>
            ,{" "}
            <Link to="/docs/api/agent-tools-social-data" className="text-primary hover:underline">
              StableSocial
            </Link>
            ,{" "}
            <Link to="/docs/api/agent-tools-enrichment-data" className="text-primary hover:underline">
              StableEnrich
            </Link>
            ,{" "}
            <Link to="/docs/api/agent-tools-partners" className="text-primary hover:underline">
              partners
            </Link>
            .
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
          <Link to="/docs/agent/getting-started">← Getting Started</Link>
        </Button>
      </div>
    </DocsLayout>
  );
}
