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

const STABLESOCIAL_LLMS = "https://stablesocial.dev/llms.txt";
const STABLESOCIAL_BASE = "https://stablesocial.dev";

const tocItems = [
  { id: "overview", title: "Overview", level: 2 },
  { id: "async-flow", title: "Async two-step flow", level: 2 },
  { id: "tools", title: "StableSocial tools", level: 2 },
  { id: "params", title: "Parameters", level: 2 },
  { id: "api-integration", title: "API integration", level: 2 },
  { id: "pricing", title: "Pricing & wallet", level: 2 },
  { id: "related-guides", title: "Related guides", level: 2 },
];

export default function AgentSocialData() {
  const { socialData } = getToolsByCategory();

  return (
    <DocsLayout toc={tocItems}>
      <div className="mb-8">
        <div className="text-sm text-primary font-medium mb-2">Syra Agent</div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Social data (StableSocial)</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Syra Agent can fetch TikTok, Instagram, Facebook, and Reddit data through{" "}
          <a
            href={STABLESOCIAL_BASE}
            className="text-primary hover:underline inline-flex items-center gap-1"
            target="_blank"
            rel="noopener noreferrer"
          >
            StableSocial
            <ExternalLink className="h-3.5 w-3.5" />
          </a>{" "}
          (~$0.06 per trigger). The server pays x402 from the agent wallet, polls the job with SIWX, and returns finished
          data to chat or <code className="text-sm bg-muted px-1 rounded">POST /agent/tools/call</code>.
        </p>
      </div>

      <section id="overview" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Overview</h2>
        <p className="text-muted-foreground mb-4">
          Eleven curated <code className="text-sm bg-muted px-1 rounded">stablesocial-*</code> tools wrap the most common
          StableSocial routes. Each tool maps to a POST on{" "}
          <code className="text-sm bg-muted px-1 rounded">stablesocial.dev</code> (profile, posts, search, subreddit).
          Full API reference:{" "}
          <a href={STABLESOCIAL_LLMS} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
            stablesocial.dev/llms.txt
          </a>
          .
        </p>
        <p className="text-muted-foreground">
          For routes not yet wrapped as tools, use{" "}
          <Link to="/docs/agent/market-data" className="text-primary hover:underline">
            pay.sh
          </Link>{" "}
          with FQN <code className="text-sm bg-muted px-1 rounded">merit-systems/stablesocial/social-data</code> (you
          handle trigger + SIWX poll yourself).
        </p>
      </section>

      <section id="async-flow" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Async two-step flow</h2>
        <ol className="list-decimal list-inside space-y-2 text-muted-foreground mb-4">
          <li>
            <strong className="text-foreground">POST trigger (paid)</strong> — Agent wallet pays ~$0.06 USDC via x402.
            Response: <code className="text-sm bg-muted px-1 rounded">{"{ \"token\": \"eyJ...\" }"}</code> (HTTP 202).
          </li>
          <li>
            <strong className="text-foreground">GET /api/jobs?token=… (free, SIWX)</strong> — Same wallet signs
            Sign-In-With-X; poll until <code className="text-sm bg-muted px-1 rounded">status: finished</code>. Syra does
            this automatically for <code className="text-sm bg-muted px-1 rounded">stablesocial-*</code> tools.
          </li>
        </ol>
        <p className="text-muted-foreground text-sm">
          Jobs usually finish in 5–60 seconds. Token expires after 30 minutes. Polling with a different wallet than the
          payer returns 403.
        </p>
      </section>

      <section id="tools" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">StableSocial tools</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tool ID</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {socialData.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-sm">{t.id}</TableCell>
                <TableCell className="text-muted-foreground">{t.description}</TableCell>
                <TableCell className="text-right whitespace-nowrap">{formatPrice(t.priceUsd)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section id="params" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Parameters</h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li>
            <code className="text-sm bg-muted px-1 rounded">handle</code> — TikTok / Instagram / Facebook username (no @)
          </li>
          <li>
            <code className="text-sm bg-muted px-1 rounded">keyword</code> or <code className="text-sm bg-muted px-1 rounded">q</code> — search queries
          </li>
          <li>
            <code className="text-sm bg-muted px-1 rounded">subreddit</code> — Reddit community (without <code className="text-sm bg-muted px-1 rounded">r/</code>)
          </li>
          <li>
            <code className="text-sm bg-muted px-1 rounded">post_id</code> — Reddit post id
          </li>
          <li>
            <code className="text-sm bg-muted px-1 rounded">body</code> — optional JSON string passthrough for advanced fields
          </li>
        </ul>
        <CodeBlock
          language="json"
          code={`{
  "anonymousId": "<session-id>",
  "toolId": "stablesocial-tiktok-profile",
  "params": { "handle": "tiktok" }
}`}
        />
      </section>

      <section id="api-integration" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">API integration</h2>
        <p className="text-muted-foreground mb-4">
          Same endpoints as other agent tools: list via <code className="text-sm bg-muted px-1 rounded">GET /agent/tools</code>,
          call via <code className="text-sm bg-muted px-1 rounded">POST /agent/tools/call</code>, or natural language on{" "}
          <code className="text-sm bg-muted px-1 rounded">POST /agent/chat/completion</code>.
        </p>
        <p className="text-muted-foreground">
          See{" "}
          <Link to="/docs/api/agent-tools-social-data" className="text-primary hover:underline">
            API reference: Agent tools — StableSocial
          </Link>
          .
        </p>
      </section>

      <section id="pricing" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Pricing & wallet</h2>
        <p className="text-muted-foreground">
          Each <code className="text-sm bg-muted px-1 rounded">stablesocial-*</code> call charges ~$
          {socialData[0]?.priceUsd.toFixed(2) ?? "0.06"} from the agent USDC balance (upstream StableSocial trigger).
          SIWX polling is free. Optional env: <code className="text-sm bg-muted px-1 rounded">STABLESOCIAL_API_BASE_URL</code>,{" "}
          <code className="text-sm bg-muted px-1 rounded">STABLESOCIAL_POLL_INTERVAL_MS</code>,{" "}
          <code className="text-sm bg-muted px-1 rounded">STABLESOCIAL_POLL_MAX_ATTEMPTS</code>.
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
            <Link to="/docs/agent/enrichment-data" className="text-primary hover:underline">
              Enrichment (StableEnrich)
            </Link>
          </li>
          <li>
            <Link to="/docs/api/agent-tools-social-data" className="text-primary hover:underline">
              API: Agent tools — StableSocial
            </Link>
          </li>
        </ul>
      </section>
    </DocsLayout>
  );
}
