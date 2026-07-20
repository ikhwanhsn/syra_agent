import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { DocPageHeader } from "@/components/docs/DocPageHeader";
import { DocSection } from "@/components/docs/DocSection";
import { Callout } from "@/components/docs/Callout";
import { Button } from "@/components/ui/button";
import {
  SYRA_HIGHLIGHT,
  SYRA_LIVE_CAPABILITIES,
  SYRA_MISSION,
  SYRA_PILLARS,
  SYRA_TAGLINE,
} from "@/content/syraBrand";
import { SYRA_AGENT_URL, SYRA_MARKETPLACE_URL, SYRA_WEB_LABEL } from "@/content/syraUrls";
import { ArrowRight, Bot, Package, Zap } from "lucide-react";

const tocItems = [
  { id: "quick-start", title: "Quick Start", level: 2 },
  { id: "what-is-syra", title: "What Is Syra?", level: 2 },
  { id: "platform-roadmap", title: "Platform roadmap", level: 2 },
  { id: "why-syra", title: "Why Syra?", level: 2 },
];

export default function Welcome() {
  return (
    <DocsLayout toc={tocItems}>
      <DocPageHeader
        eyebrow="Welcome"
        title="Welcome to Syra"
        description={
          <>
            <strong className="text-foreground">Syra</strong> — {SYRA_TAGLINE.toLowerCase()} on Solana.
            Install MCP or the SDK, settle USDC on HTTP 402, call crypto intelligence.
          </>
        }
      />

      <div className="docs-prose mb-8">
        <p>{SYRA_MISSION}</p>
      </div>

      <Callout variant="tip" title="First paid call">
        {SYRA_HIGHLIGHT}
      </Callout>

      <DocSection id="quick-start" title="Quick Start">
        <div className="grid sm:grid-cols-3 gap-4 not-prose">
          <div className="rounded-lg border border-border/60 p-5 bg-muted/20">
            <h3 className="font-semibold flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-primary" />
              MCP
            </h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              One line in Cursor or Claude — auto-pay on x402 when a payer key is set.
            </p>
            <Button size="sm" variant="outline" asChild>
              <Link to="/docs/build/mcp">
                Install MCP <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <div className="rounded-lg border border-border/60 p-5 bg-muted/20">
            <h3 className="font-semibold flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-primary" />
              SDK
            </h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              <code className="text-xs">createSyraPaidClient</code> handles 402 → pay → retry in app code.
            </p>
            <Button size="sm" variant="outline" asChild>
              <Link to="/docs/build/sdk">
                Install SDK <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <div className="rounded-lg border border-border/60 p-5 bg-muted/20">
            <h3 className="font-semibold flex items-center gap-2 mb-2">
              <Bot className="h-5 w-5 text-primary" />
              Marketplace
            </h3>
            <ol className="list-decimal pl-5 space-y-1 text-sm text-muted-foreground mb-4 leading-relaxed">
              <li>
                Open{" "}
                <a
                  href={SYRA_MARKETPLACE_URL}
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  API marketplace
                </a>
              </li>
              <li>Pick a route and settle USDC on 402</li>
            </ol>
            <Button size="sm" variant="outline" asChild>
              <Link to="/docs/api-reference">
                API docs <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </DocSection>

      <DocSection id="what-is-syra" title="What Is Syra?" prose>
        <p>
          Syra is <strong>pay-per-call crypto intelligence for agents</strong>. Most agents can reason and call tools,
          but they still hit vendor API keys and human billing walls. Syra closes that gap on <strong>Solana</strong>{" "}
          with x402 micropayments, MCP, and a typed SDK.
        </p>
        <p>What builders do today:</p>
        <ul>
          {SYRA_LIVE_CAPABILITIES.map((cap) => (
            <li key={cap.title}>
              <strong>{cap.title}</strong> — {cap.description}
            </li>
          ))}
        </ul>
      </DocSection>

      <DocSection id="platform-roadmap" title="Platform roadmap" prose>
        <p>
          Earn, Treasury, Invest, Spend, and Grow are API modules on the same rails (discover via{" "}
          <code>GET /pillars</code>). <strong>Spend (x402)</strong> is the live growth wedge — the other modules are
          platform roadmap, not the public GTM thesis.
        </p>
        <ul>
          {SYRA_PILLARS.map((p) => (
            <li key={p.title}>
              <strong>{p.title}</strong> — {p.description}
            </li>
          ))}
        </ul>
      </DocSection>

      <DocSection id="why-syra" title="Why Syra?" prose>
        <ul>
          <li>Pay per call — USDC via x402; no per-vendor API keys or monthly plans</li>
          <li>MCP + SDK first — install in Cursor/Claude or wire typed clients in minutes</li>
          <li>Crypto intelligence agents reuse — news, sentiment, signals, smart money, risk</li>
          <li>Live product: marketplace, API gateway, and agent reference client since 2025</li>
          <li>Non-custodial by design — operators keep keys; Syra settles paid routes</li>
        </ul>
      </DocSection>

      <div className="flex flex-col sm:flex-row flex-wrap gap-3 not-prose">
        <Button variant="primary" size="lg" asChild>
          <Link to="/docs/build/mcp">
            Install MCP
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link to="/docs/build/sdk">Install SDK</Link>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <a href={SYRA_AGENT_URL} target="_blank" rel="noopener noreferrer">
            Open {SYRA_WEB_LABEL}
          </a>
        </Button>
      </div>
    </DocsLayout>
  );
}
