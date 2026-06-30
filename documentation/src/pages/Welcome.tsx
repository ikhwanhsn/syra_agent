import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { DocPageHeader } from "@/components/docs/DocPageHeader";
import { DocSection } from "@/components/docs/DocSection";
import { Callout } from "@/components/docs/Callout";
import { Button } from "@/components/ui/button";
import {
  SYRA_AGENT_CAPABILITIES,
  SYRA_FLOW_STEPS,
  SYRA_HIGHLIGHT,
  SYRA_MISSION,
  SYRA_PILLARS,
  SYRA_PLATFORMS,
  SYRA_TAGLINE,
  SYRA_VISION,
} from "@/content/syraBrand";
import { SYRA_AGENT_URL, SYRA_PLAYGROUND_URL, SYRA_WEB_LABEL } from "@/content/syraUrls";
import { ArrowRight, MessageCircle, Bot } from "lucide-react";

const tocItems = [
  { id: "what-is-syra", title: "What Is Syra?", level: 2 },
  { id: "where-syra-runs", title: "Where Syra Runs", level: 2 },
  { id: "key-pillars", title: "Core Pillars", level: 2 },
  { id: "how-syra-works", title: "How Syra Works", level: 2 },
  { id: "quick-start", title: "Quick Start Options", level: 2 },
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
        <p>{SYRA_VISION}</p>
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
          Syra closes that gap on <strong>Solana</strong> — the economic layer where agents hold assets, run treasuries,
          participate in DeFi, distribute rewards, and coordinate value in real time.
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

      <DocSection id="where-syra-runs" title="Where Syra Runs">
        <p className="text-muted-foreground mb-4 leading-7">
          Syra ships across multiple surfaces — one stack for operators, builders, and autonomous agents:
        </p>
        <div className="not-prose overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full text-sm min-w-[320px]">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-2.5 font-medium">Platform</th>
                <th className="text-left px-4 py-2.5 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {SYRA_PLATFORMS.map((platform) => (
                <tr key={platform.name} className="border-b border-border/40 last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2.5 whitespace-nowrap font-medium text-foreground">{platform.name}</td>
                  <td className="px-4 py-2.5">
                    {platform.description}
                    {platform.href && platform.linkLabel ? (
                      <>
                        {" "}
                        {platform.href.startsWith("http") ? (
                          <a
                            href={platform.href}
                            className="text-primary hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {platform.linkLabel}
                          </a>
                        ) : (
                          <Link to={platform.href} className="text-primary hover:underline">
                            {platform.linkLabel}
                          </Link>
                        )}
                      </>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocSection>

      <DocSection id="key-pillars" title="Core Pillars">
        <div className="grid sm:grid-cols-2 gap-3 not-prose">
          {SYRA_PILLARS.map((item) => (
            <div key={item.title} className="rounded-lg border border-border/60 p-4 bg-muted/20">
              <p className="font-medium text-foreground mb-1">{item.title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection id="how-syra-works" title="How Syra Works (High-Level Flow)" prose>
        <ol>
          {SYRA_FLOW_STEPS.map((step, index) => (
            <li key={step.step}>
              <strong>
                {index + 1}. {step.step}
              </strong>{" "}
              — {step.description}
            </li>
          ))}
        </ol>
      </DocSection>

      <DocSection id="quick-start" title="Quick Start Options">
        <div className="space-y-4 not-prose">
          <div className="rounded-lg border border-border/60 p-5 bg-muted/20">
            <h3 className="font-semibold flex items-center gap-2 mb-2">
              <Bot className="h-5 w-5 text-primary" />
              Syra Agent
            </h3>
            <ol className="list-decimal pl-5 space-y-1 text-sm text-muted-foreground mb-4 leading-relaxed">
              <li>
                Open{" "}
                <a href={SYRA_AGENT_URL} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                  {SYRA_WEB_LABEL}
                </a>
              </li>
              <li>Connect a wallet when you need paid tools, treasury flows, or onchain actions</li>
              <li>Ask in plain English — research, signals, DeFi context, or agent workflows</li>
            </ol>
            <Button size="sm" variant="outline" asChild>
              <Link to="/docs/agent/getting-started">
                Syra Agent Docs <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <div className="rounded-lg border border-border/60 p-5 bg-muted/20">
            <h3 className="font-semibold flex items-center gap-2 mb-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              x402 Autonomous Agent
            </h3>
            <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
              Syra runs as an autonomous agent on <strong className="text-foreground">x402scan</strong> — automated
              research cycles and payment-native tool pipelines.
            </p>
            <Button size="sm" variant="outline" asChild>
              <Link to="/docs/x402-agent/getting-started">
                x402 Agent Docs <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
        <Callout variant="note" title="Example prompts" className="mt-6">
          <div className="grid sm:grid-cols-2 gap-2 text-sm">
            <div>
              <em>&quot;What can you do?&quot;</em> — Capabilities overview
            </div>
            <div>
              <em>&quot;Signal for bitcoin&quot;</em> — Market context
            </div>
            <div>
              <em>&quot;List supported tokens&quot;</em> — Supported assets
            </div>
            <div>
              <em>&quot;News for BTC&quot;</em> — Headline context
            </div>
          </div>
          <p className="mt-3">
            For pay-per-call AI, try the{" "}
            <a href={SYRA_PLAYGROUND_URL} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              API playground
            </a>{" "}
            or see{" "}
            <Link to="/docs/api/chat-completions" className="text-primary hover:underline">
              OpenRouter x402 APIs
            </Link>
            .
          </p>
        </Callout>
      </DocSection>

      <DocSection id="why-syra" title="Why Syra?" prose>
        <ul>
          <li>Built for the machine economy — economic autonomy, not another chatbot</li>
          <li>Solana-native: real-time settlement and composable DeFi for agents at scale</li>
          <li>Live product: web agent, API gateway, and ecosystem integrations since 2025</li>
          <li>x402-native payments so agents discover and pay for tools without human billing ops</li>
          <li>Non-custodial by design — operators keep keys; Syra coordinates intelligence and flows</li>
        </ul>
        <p>
          The long-term winner in the agent market will be the stack that lets agents{" "}
          <strong>generate, manage, and deploy capital efficiently</strong>.
        </p>
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
