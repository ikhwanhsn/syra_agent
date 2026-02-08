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
  const { core, partner, memecoin } = getToolsByCategory();

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
        </p>
      </div>

      <section id="overview" className="mb-10 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Overview</h2>
        <p className="text-muted-foreground mb-4">
          The Syra Agent exposes a set of <strong className="text-foreground">{AGENT_TOOLS_CATALOG.length} tools</strong> backed by the x402 API. Each tool has a name, description, a small per-call price in USD, and example prompts that typically trigger it. You can use the agent without memorizing tool names: describe what you want (e.g. &quot;Signal for Bitcoin&quot;, &quot;Latest news&quot;, &quot;Market sentiment&quot;) and the agent will select the appropriate tool.
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
        <h2 className="text-2xl font-semibold mb-4">Partner tools</h2>
        <p className="text-muted-foreground mb-4">
          Tools powered by partners: Nansen, DexScreener, Jupiter, Rugcheck, Bubblemaps, Binance, Workfun.
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
          <li>Use the <strong className="text-foreground">example prompts</strong> in the tables above as inspiration (e.g. &quot;Signal for Bitcoin&quot;, &quot;Trending on Jupiter&quot;).</li>
          <li>For paid tools, connect a wallet so the agent can pay per call; prices are listed in USD per request.</li>
          <li>Check-status is a minimal-cost health check; most other tools use the standard per-call pricing shown.</li>
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
