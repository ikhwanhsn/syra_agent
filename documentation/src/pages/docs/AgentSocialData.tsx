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
      <DocPageHeader
        eyebrow="Syra Agent"
        title="Social data (StableSocial)"
        description={
          <>
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
            (~$0.06 per trigger). The server pays x402 from the agent wallet, polls the job with SIWX, and returns
            finished data to chat or <code className="text-sm bg-muted px-1 rounded">POST /agent/tools/call</code>.
          </>
        }
      />

      <DocSection id="overview" title="Overview" prose>
        <p>
          Eleven curated <code>stablesocial-*</code> tools wrap the most common StableSocial routes. Each tool maps to a
          POST on <code>stablesocial.dev</code> (profile, posts, search, subreddit). Full API reference:{" "}
          <a href={STABLESOCIAL_LLMS} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
            stablesocial.dev/llms.txt
          </a>
          .
        </p>
        <p>
          For routes not yet wrapped as tools, use{" "}
          <Link to="/docs/agent/market-data" className="text-primary hover:underline">
            pay.sh
          </Link>{" "}
          with FQN <code>merit-systems/stablesocial/social-data</code> (you handle trigger + SIWX poll yourself).
        </p>
      </DocSection>

      <DocSection id="async-flow" title="Async two-step flow" prose>
        <ol>
          <li>
            <strong>POST trigger (paid)</strong> — Agent wallet pays ~$0.06 USDC via x402. Response:{" "}
            <code>{`{ "token": "eyJ..." }`}</code> (HTTP 202).
          </li>
          <li>
            <strong>GET /api/jobs?token=… (free, SIWX)</strong> — Same wallet signs Sign-In-With-X; poll until{" "}
            <code>status: finished</code>. Syra does this automatically for <code>stablesocial-*</code> tools.
          </li>
        </ol>
        <p>
          Jobs usually finish in 5–60 seconds. Token expires after 30 minutes. Polling with a different wallet than the
          payer returns 403.
        </p>
      </DocSection>

      <DocSection id="tools" title="StableSocial tools">
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
              {socialData.map((t) => (
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

      <DocSection id="params" title="Parameters">
        <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6 leading-7">
          <li>
            <code className="text-sm bg-muted px-1 rounded">handle</code> — TikTok / Instagram / Facebook username (no @)
          </li>
          <li>
            <code className="text-sm bg-muted px-1 rounded">keyword</code> or{" "}
            <code className="text-sm bg-muted px-1 rounded">q</code> — search queries
          </li>
          <li>
            <code className="text-sm bg-muted px-1 rounded">subreddit</code> — Reddit community (without{" "}
            <code className="text-sm bg-muted px-1 rounded">r/</code>)
          </li>
          <li>
            <code className="text-sm bg-muted px-1 rounded">post_id</code> — Reddit post id
          </li>
          <li>
            <code className="text-sm bg-muted px-1 rounded">body</code> — optional JSON string passthrough for advanced
            fields
          </li>
        </ul>
        <div className="not-prose">
          <CodeBlock
            language="json"
            code={`{
  "anonymousId": "<session-id>",
  "toolId": "stablesocial-tiktok-profile",
  "params": { "handle": "tiktok" }
}`}
          />
        </div>
      </DocSection>

      <DocSection id="api-integration" title="API integration" prose>
        <p>
          Same endpoints as other agent tools: list via <code>GET /agent/tools</code>, call via{" "}
          <code>POST /agent/tools/call</code>, or natural language on <code>POST /agent/chat/completion</code>.
        </p>
        <p>
          See{" "}
          <Link to="/docs/api/agent-tools-social-data" className="text-primary hover:underline">
            API reference: Agent tools — StableSocial
          </Link>
          .
        </p>
      </DocSection>

      <DocSection id="pricing" title="Pricing & wallet" prose>
        <p>
          Each <code>stablesocial-*</code> call charges ~${socialData[0]?.priceUsd.toFixed(2) ?? "0.06"} from the agent
          USDC balance (upstream StableSocial trigger). SIWX polling is free. Optional env:{" "}
          <code>STABLESOCIAL_API_BASE_URL</code>, <code>STABLESOCIAL_POLL_INTERVAL_MS</code>,{" "}
          <code>STABLESOCIAL_POLL_MAX_ATTEMPTS</code>.
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
      </DocSection>
    </DocsLayout>
  );
}
