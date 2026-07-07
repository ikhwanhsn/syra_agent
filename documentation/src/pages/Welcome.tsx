import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { DocPageHeader } from "@/components/docs/DocPageHeader";
import { DocSection } from "@/components/docs/DocSection";
import { Callout } from "@/components/docs/Callout";
import { Button } from "@/components/ui/button";
import { SYRA_AGENT_CAPABILITIES, SYRA_HIGHLIGHT, SYRA_MISSION, SYRA_TAGLINE } from "@/content/syraBrand";
import { SYRA_AGENT_URL, SYRA_MARKETPLACE_URL, SYRA_WEB_LABEL } from "@/content/syraUrls";
import { ArrowRight, Bot, Zap } from "lucide-react";

const tocItems = [
  { id: "what-is-syra", title: "What Is Syra?", level: 2 },
  { id: "quick-start", title: "Quick Start", level: 2 },
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
          </>
        }
      />

      <div className="docs-prose mb-8">
        <p>{SYRA_MISSION}</p>
      </div>

      <Callout variant="tip" title="Machine money infrastructure">
        {SYRA_HIGHLIGHT}
      </Callout>

      <DocSection id="what-is-syra" title="What Is Syra?" prose>
        <p>
          Syra provides <strong>machine money infrastructure</strong> for autonomous AI agents. Most agents can reason
          and automate tasks, but they lack native financial infrastructure to earn, manage, invest, or spend capital
          onchain without humans in the loop.
        </p>
        <p>
          Syra closes that gap on <strong>Solana</strong> — agents hold assets, run treasuries, participate in DeFi,
          and coordinate value in real time.
        </p>
        <p>What agents can do with Syra:</p>
        <ul>
          {SYRA_AGENT_CAPABILITIES.map((cap) => (
            <li key={cap.title}>
              <strong>{cap.title}</strong> — {cap.description}
            </li>
          ))}
        </ul>
      </DocSection>

      <DocSection id="quick-start" title="Quick Start">
        <div className="grid sm:grid-cols-2 gap-4 not-prose">
          <div className="rounded-lg border border-border/60 p-5 bg-muted/20">
            <h3 className="font-semibold flex items-center gap-2 mb-2">
              <Bot className="h-5 w-5 text-primary" />
              Use Syra
            </h3>
            <ol className="list-decimal pl-5 space-y-1 text-sm text-muted-foreground mb-4 leading-relaxed">
              <li>
                Open{" "}
                <a href={SYRA_AGENT_URL} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                  {SYRA_WEB_LABEL}
                </a>
              </li>
              <li>Connect a wallet when you need paid tools or onchain actions</li>
              <li>Ask in plain English — research, signals, DeFi, or agent workflows</li>
            </ol>
            <Button size="sm" variant="outline" asChild>
              <Link to="/docs/agent/getting-started">
                Agent docs <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <div className="rounded-lg border border-border/60 p-5 bg-muted/20">
            <h3 className="font-semibold flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-primary" />
              Build with the API
            </h3>
            <ol className="list-decimal pl-5 space-y-1 text-sm text-muted-foreground mb-4 leading-relaxed">
              <li>Read the API overview and x402 payment flow</li>
              <li>Pick an endpoint from the catalog</li>
              <li>
                Test in the{" "}
                <a href={SYRA_MARKETPLACE_URL} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                  API marketplace
                </a>
              </li>
            </ol>
            <Button size="sm" variant="outline" asChild>
              <Link to="/docs/api-reference">
                API docs <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </DocSection>

      <DocSection id="why-syra" title="Why Syra?" prose>
        <ul>
          <li>Built for the machine economy — economic autonomy, not another chatbot</li>
          <li>Solana-native: real-time settlement and composable DeFi for agents at scale</li>
          <li>Live product: web agent, API gateway, and ecosystem integrations since 2025</li>
          <li>x402-native payments so agents discover and pay for tools without human billing ops</li>
          <li>Non-custodial by design — operators keep keys; Syra coordinates intelligence and flows</li>
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
          <Link to="/docs/agent/getting-started">Agent Docs</Link>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link to="/docs/api-reference">API Reference</Link>
        </Button>
      </div>
    </DocsLayout>
  );
}
