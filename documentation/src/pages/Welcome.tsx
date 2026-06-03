import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
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
      <div className="mb-8">
        <div className="text-sm text-primary font-medium mb-2">Welcome</div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Welcome</h1>
        <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Syra</strong> — {SYRA_TAGLINE.toLowerCase()} on Solana.
        </p>
      </div>

      <p className="text-muted-foreground leading-relaxed mb-4">{SYRA_MISSION}</p>
      <p className="text-muted-foreground leading-relaxed mb-8">{SYRA_VISION}</p>

      <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 mb-10">
        <p className="text-foreground leading-relaxed">{SYRA_HIGHLIGHT}</p>
      </div>

      <section id="what-is-syra" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">What Is Syra?</h2>
        <p className="text-muted-foreground mb-4">
          Syra provides <strong className="text-foreground">machine money infrastructure</strong> for autonomous AI
          agents. Most agents can reason and automate tasks, but they lack native financial infrastructure to earn,
          manage, invest, or spend capital onchain without humans in the loop.
        </p>
        <p className="text-muted-foreground mb-4">
          Syra closes that gap on <strong className="text-foreground">Solana</strong> — the economic layer where agents
          hold assets, run treasuries, participate in DeFi, distribute rewards, and coordinate value in real time.
        </p>
        <p className="text-muted-foreground mb-4">What agents can do with Syra:</p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-6">
          {SYRA_AGENT_CAPABILITIES.map((cap) => (
            <li key={cap.title}>
              <strong className="text-foreground">{cap.title}</strong> — {cap.description}
            </li>
          ))}
        </ul>
      </section>

      <section id="where-syra-runs" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Where Syra Runs</h2>
        <p className="text-muted-foreground mb-4">
          Syra ships across multiple surfaces — one stack for operators, builders, and autonomous agents:
        </p>
        <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[320px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-2 sm:p-3 font-medium">Platform</th>
                <th className="text-left p-2 sm:p-3 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {SYRA_PLATFORMS.map((platform) => (
                <tr key={platform.name} className="border-b border-border/50 last:border-0">
                  <td className="p-2 sm:p-3 whitespace-nowrap font-medium text-foreground">{platform.name}</td>
                  <td className="p-2 sm:p-3">
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
      </section>

      <section id="key-pillars" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Core Pillars</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {SYRA_PILLARS.map((item) => (
            <div key={item.title} className="p-4 rounded-lg border border-border bg-card">
              <div className="font-medium text-foreground mb-1">{item.title}</div>
              <div className="text-sm text-muted-foreground">{item.description}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="how-syra-works" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">How Syra Works (High-Level Flow)</h2>
        <ol className="list-decimal pl-6 space-y-3 text-muted-foreground">
          {SYRA_FLOW_STEPS.map((step, index) => (
            <li key={step.step}>
              <strong className="text-foreground">
                {index + 1}. {step.step}
              </strong>{" "}
              — {step.description}
            </li>
          ))}
        </ol>
      </section>

      <section id="quick-start" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Quick Start Options</h2>
        <div className="space-y-6">
          <div className="p-5 rounded-xl border border-border bg-card">
            <h3 className="font-semibold flex items-center gap-2 mb-2">
              <Bot className="h-5 w-5 text-primary" />
              Syra Agent
            </h3>
            <ol className="list-decimal pl-6 space-y-1 text-muted-foreground text-sm mb-4">
              <li>
                Open{" "}
                <a href="https://agent.syraa.fun" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                  agent.syraa.fun
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
          <div className="p-5 rounded-xl border border-border bg-card">
            <h3 className="font-semibold flex items-center gap-2 mb-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              x402 Autonomous Agent
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Syra runs as an autonomous agent on <strong className="text-foreground">x402scan</strong> — automated
              research cycles, narrative monitoring, and payment-native tool pipelines for machines.
            </p>
            <Button size="sm" variant="outline" asChild>
              <Link to="/docs/x402-agent/getting-started">
                x402 Agent Docs <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
        <div className="mt-6 p-4 rounded-lg border border-primary/20 bg-primary/5">
          <h4 className="font-medium text-foreground mb-2">Example prompts (Syra Agent)</h4>
          <div className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div>
              <em>&quot;What can you do?&quot;</em> — Capabilities overview
            </div>
            <div>
              <em>&quot;Signal for bitcoin&quot;</em> — Market context and technicals
            </div>
            <div>
              <em>&quot;List supported tokens&quot;</em> — Supported assets
            </div>
            <div>
              <em>&quot;News for BTC&quot;</em> — Narrative and headline context
            </div>
          </div>
        </div>
      </section>

      <section id="why-syra" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Why Syra?</h2>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
          <li>Built for the machine economy — economic autonomy, not another chatbot</li>
          <li>Solana-native: real-time settlement and composable DeFi for agents at scale</li>
          <li>Live product: web agent, API gateway, and ecosystem integrations since 2025</li>
          <li>x402-native payments so agents discover and pay for tools without human billing ops</li>
          <li>Non-custodial by design — operators keep keys; Syra coordinates intelligence and flows</li>
        </ul>
        <p className="text-lg text-foreground">
          The long-term winner in the agent market will be the stack that lets agents{" "}
          <strong className="text-primary">generate, manage, and deploy capital efficiently</strong> — not the agent with
          the slickest UI alone.
        </p>
      </section>

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 pt-4">
        <Button variant="primary" size="lg" className="w-full sm:min-w-[12rem] sm:w-auto justify-center" asChild>
          <a href="https://agent.syraa.fun" target="_blank" rel="noopener noreferrer">
            Open Syra Agent
            <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
          </a>
        </Button>
        <Button variant="outline" size="lg" className="w-full sm:min-w-[12rem] sm:w-auto justify-center" asChild>
          <Link to="/docs/agent/getting-started">Agent Docs</Link>
        </Button>
        <Button variant="outline" size="lg" className="w-full sm:min-w-[12rem] sm:w-auto justify-center" asChild>
          <Link to="/docs/api-reference">API Reference</Link>
        </Button>
      </div>
    </DocsLayout>
  );
}
