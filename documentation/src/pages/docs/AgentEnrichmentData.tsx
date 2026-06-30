import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { DocPageHeader } from "@/components/docs/DocPageHeader";
import { DocSection } from "@/components/docs/DocSection";
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
      <DocPageHeader
        eyebrow="Syra Agent"
        title="Enrichment & research (StableEnrich)"
        description={
          <>
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
          </>
        }
      />

      <DocSection id="overview" title="Overview" prose>
        <p>
          StableEnrich bundles Exa, Firecrawl, Apollo, Google Maps, Reddit, Serper, Hunter, Minerva, and Cloudflare
          Browser Rendering behind one x402 origin. Most calls are synchronous POST/GET;{" "}
          <code>stableenrich-cloudflare-crawl</code> uses an async pattern (paid POST → SIWX poll), similar to
          StableSocial.
        </p>
        <p>
          Full API reference:{" "}
          <a href={STABLEENRICH_LLMS} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
            stableenrich.dev/llms.txt
          </a>
          . Syra still offers built-in <code>exa-search</code> and <code>website-crawl</code> for general use; use
          StableEnrich when you need Apollo, Firecrawl, people-category Exa, or other providers on that origin.
        </p>
      </DocSection>

      <DocSection id="tools" title="StableEnrich tools">
        <div className="not-prose overflow-x-auto">
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
        </div>
      </DocSection>

      <DocSection id="workflows" title="Common workflows" prose>
        <ul>
          <li>
            <strong>Scrape one page</strong> — <code>stableenrich-firecrawl-scrape</code> with <code>url</code>
          </li>
          <li>
            <strong>Find people / LinkedIn</strong> — <code>stableenrich-exa-search</code> with{" "}
            <code>category=people</code>, then Apollo search/enrich
          </li>
          <li>
            <strong>B2B leads</strong> — <code>stableenrich-apollo-org-search</code> →{" "}
            <code>stableenrich-apollo-people-search</code> → <code>stableenrich-apollo-people-enrich</code>
          </li>
          <li>
            <strong>Reddit research</strong> — <code>stableenrich-reddit-search</code> then{" "}
            <code>stableenrich-reddit-post-comments</code> for full threads
          </li>
          <li>
            <strong>Multi-page crawl</strong> — <code>stableenrich-cloudflare-crawl</code> (async, 30–120s typical)
          </li>
        </ul>
      </DocSection>

      <DocSection id="api-integration" title="API integration">
        <div className="not-prose">
          <CodeBlock
            language="json"
            code={`{
  "anonymousId": "<session-id>",
  "toolId": "stableenrich-firecrawl-scrape",
  "params": { "url": "https://example.com/about" }
}`}
          />
        </div>
        <p className="text-muted-foreground mt-4 leading-7">
          <Link to="/docs/api/agent-tools-enrichment-data" className="text-primary hover:underline">
            API reference: Agent tools — StableEnrich
          </Link>
        </p>
      </DocSection>

      <DocSection id="pricing" title="Pricing" prose>
        <p>
          Each tool charges upstream StableEnrich pricing plus 20% (from $0.0024 for Exa contents to $0.12 for
          Cloudflare crawl). See the table above and{" "}
          <a href={STABLEENRICH_LLMS} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
            llms.txt pricing summary
          </a>
          . Optional env: <code>STABLEENRICH_API_BASE_URL</code>, <code>STABLEENRICH_CF_POLL_INTERVAL_MS</code>,{" "}
          <code>STABLEENRICH_CF_POLL_MAX_ATTEMPTS</code>.
        </p>
      </DocSection>

      <DocSection id="related-guides" title="Related agent guides" prose>
        <ul>
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
      </DocSection>
    </DocsLayout>
  );
}
