import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { CodeBlock } from "@/components/docs/CodeBlock";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getToolsByCategory, formatPrice } from "@/data/agentToolsCatalog";
import { ExternalLink } from "lucide-react";

const STABLEENRICH_LLMS = "https://stableenrich.dev/llms.txt";
const STABLEENRICH_BASE = "https://stableenrich.dev";

const tocItems = [
  { id: "overview", title: "Overview", level: 2 },
  { id: "tools", title: "StableEnrich tools", level: 2 },
  { id: "workflows", title: "Common workflows", level: 2 },
  { id: "api-integration", title: "API integration", level: 2 },
  { id: "pricing", title: "Pricing", level: 2 },
  { id: "related-guides", title: "Related guides", level: 2 },
];

export default function AgentEnrichmentData() {
  const { enrichmentData } = getToolsByCategory();

  return (
    <DocsLayout toc={tocItems}>
      <div className="mb-8">
        <div className="text-sm text-primary font-medium mb-2">Syra Agent</div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Enrichment & research (StableEnrich)</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          People search, web scrape, maps, and news via{" "}
          <a
            href={STABLEENRICH_BASE}
            className="text-primary hover:underline inline-flex items-center gap-1"
            target="_blank"
            rel="noopener noreferrer"
          >
            StableEnrich
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          . The agent wallet pays x402 per call; Syra runs nineteen curated{" "}
          <code className="text-sm bg-muted px-1 rounded">stableenrich-*</code> tools in chat and{" "}
          <code className="text-sm bg-muted px-1 rounded">POST /agent/tools/call</code>.
        </p>
      </div>

      <section id="overview" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Overview</h2>
        <p className="text-muted-foreground mb-4">
          StableEnrich bundles Exa, Firecrawl, Apollo, Google Maps, Reddit, Serper, Hunter, Minerva, and Cloudflare
          Browser Rendering behind one x402 origin. Most calls are synchronous POST/GET;{" "}
          <code className="text-sm bg-muted px-1 rounded">stableenrich-cloudflare-crawl</code> uses an async pattern
          (paid POST → SIWX poll), similar to StableSocial.
        </p>
        <p className="text-muted-foreground">
          Full API reference:{" "}
          <a href={STABLEENRICH_LLMS} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
            stableenrich.dev/llms.txt
          </a>
          . Syra still offers built-in <code className="text-sm bg-muted px-1 rounded">exa-search</code> and{" "}
          <code className="text-sm bg-muted px-1 rounded">website-crawl</code> for general use; use StableEnrich when you
          need Apollo, Firecrawl, people-category Exa, or other providers on that origin.
        </p>
      </section>

      <section id="tools" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">StableEnrich tools</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tool ID</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrichmentData.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-sm">{t.id}</TableCell>
                <TableCell className="text-muted-foreground">{t.description}</TableCell>
                <TableCell className="text-right whitespace-nowrap">{formatPrice(t.priceUsd)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section id="workflows" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Common workflows</h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>
            <strong className="text-foreground">Scrape one page</strong> —{" "}
            <code className="text-sm bg-muted px-1 rounded">stableenrich-firecrawl-scrape</code> with{" "}
            <code className="text-sm bg-muted px-1 rounded">url</code>
          </li>
          <li>
            <strong className="text-foreground">Find people / LinkedIn</strong> —{" "}
            <code className="text-sm bg-muted px-1 rounded">stableenrich-exa-search</code> with{" "}
            <code className="text-sm bg-muted px-1 rounded">category=people</code>, then Apollo search/enrich
          </li>
          <li>
            <strong className="text-foreground">B2B leads</strong> —{" "}
            <code className="text-sm bg-muted px-1 rounded">stableenrich-apollo-org-search</code> →{" "}
            <code className="text-sm bg-muted px-1 rounded">stableenrich-apollo-people-search</code> →{" "}
            <code className="text-sm bg-muted px-1 rounded">stableenrich-apollo-people-enrich</code>
          </li>
          <li>
            <strong className="text-foreground">Reddit research</strong> —{" "}
            <code className="text-sm bg-muted px-1 rounded">stableenrich-reddit-search</code> then{" "}
            <code className="text-sm bg-muted px-1 rounded">stableenrich-reddit-post-comments</code> for full threads
          </li>
          <li>
            <strong className="text-foreground">Multi-page crawl</strong> —{" "}
            <code className="text-sm bg-muted px-1 rounded">stableenrich-cloudflare-crawl</code> (async, 30–120s typical)
          </li>
        </ul>
      </section>

      <section id="api-integration" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">API integration</h2>
        <CodeBlock
          language="json"
          code={`{
  "anonymousId": "<session-id>",
  "toolId": "stableenrich-firecrawl-scrape",
  "params": { "url": "https://example.com/about" }
}`}
        />
        <p className="text-muted-foreground mt-4">
          <Link to="/docs/api/agent-tools-enrichment-data" className="text-primary hover:underline">
            API reference: Agent tools — StableEnrich
          </Link>
        </p>
      </section>

      <section id="pricing" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Pricing</h2>
        <p className="text-muted-foreground">
          Each tool charges upstream StableEnrich pricing plus 20% (from $0.0024 for Exa contents to $0.12 for Cloudflare crawl).
          See the table above and{" "}
          <a href={STABLEENRICH_LLMS} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
            llms.txt pricing summary
          </a>
          . Optional env: <code className="text-sm bg-muted px-1 rounded">STABLEENRICH_API_BASE_URL</code>,{" "}
          <code className="text-sm bg-muted px-1 rounded">STABLEENRICH_CF_POLL_INTERVAL_MS</code>,{" "}
          <code className="text-sm bg-muted px-1 rounded">STABLEENRICH_CF_POLL_MAX_ATTEMPTS</code>.
        </p>
      </section>

      <section id="related-guides" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Related agent guides</h2>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>
            <Link to="/docs/agent/market-data" className="text-primary hover:underline">
              Market data (StableCrypto)
            </Link>
          </li>
          <li>
            <Link to="/docs/agent/social-data" className="text-primary hover:underline">
              Social data (StableSocial)
            </Link>
          </li>
          <li>
            <Link to="/docs/api/agent-tools-enrichment-data" className="text-primary hover:underline">
              API: Agent tools — StableEnrich
            </Link>
          </li>
        </ul>
      </section>
    </DocsLayout>
  );
}
