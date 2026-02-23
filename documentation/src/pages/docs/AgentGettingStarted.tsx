import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const AGENT_URL = "https://agent.syraa.fun";

const tocItems = [
  { id: "what-is-syra-agent", title: "What is the Syra Agent?", level: 2 },
  { id: "what-you-need", title: "What You'll Need", level: 2 },
  { id: "key-benefits", title: "Key Benefits", level: 2 },
  { id: "free-vs-paid", title: "Free vs Paid Usage", level: 2 },
  { id: "quick-start", title: "Quick Start", level: 2 },
  { id: "next-steps", title: "Next Steps", level: 2 },
];

export default function AgentGettingStarted() {
  return (
    <DocsLayout toc={tocItems}>
      <div className="mb-8">
        <div className="text-sm text-primary font-medium mb-2">Syra Agent</div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Getting Started</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Welcome to the <strong className="text-foreground">Syra AI Agent</strong> at{" "}
          <a href={AGENT_URL} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
            agent.syraa.fun
          </a>
          . Chat with the agent to get market analysis, trading signals, and research-driven insights in one place.
        </p>
      </div>

      <section id="what-is-syra-agent" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">What is the Syra Agent?</h2>
        <p className="text-muted-foreground mb-4">
          The Syra Agent is an AI-powered assistant built for traders, analysts, and builders. It combines natural-language chat with on-demand access to real-time data: trading signals, crypto news, market sentiment, deep research, X (Twitter) search, memecoin screens, and partner tools (e.g. Nansen—calling the real Nansen API with your agent wallet—DexScreener, Jupiter). You ask in plain English; the agent chooses the right tool and returns structured, actionable insights.
        </p>
        <p className="text-muted-foreground">
          Syra is designed to <strong className="text-foreground">enhance your decision-making</strong>, not replace it. Use the agent to understand context, levels, and narratives—then apply your own strategy and risk management.
        </p>
      </section>

      <section id="what-you-need" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">What You'll Need</h2>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>A modern browser (Chrome, Firefox, Safari, or Edge)</li>
          <li>Access to <a href={AGENT_URL} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">agent.syraa.fun</a></li>
          <li>An internet connection</li>
          <li>(Optional) A connected wallet for paid tools (signals, news, research, etc.)—see <a href="#free-vs-paid" className="text-primary hover:underline">Free vs Paid Usage</a> below</li>
          <li>(Optional) Familiarity with trading basics (RSI, MACD, price action) to get the most from signals</li>
        </ul>
      </section>

      <section id="key-benefits" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Key Benefits</h2>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li><strong className="text-foreground">One place for everything</strong> — Signals, news, sentiment, research, and discovery in a single chat.</li>
          <li><strong className="text-foreground">Natural language</strong> — No commands to memorize; describe what you want (e.g. &quot;Signal for Bitcoin&quot;, &quot;Latest ETH news&quot;).</li>
          <li><strong className="text-foreground">Pay per use</strong> — You only pay when the agent calls a paid tool; each call has a small, transparent cost in USD.</li>
          <li><strong className="text-foreground">Transparent reasoning</strong> — The agent explains how it reached its conclusions and what data it used.</li>
        </ul>
      </section>

      <section id="free-vs-paid" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Free vs Paid Usage</h2>
        <p className="text-muted-foreground mb-4">
          You can open the agent and chat without connecting a wallet. General conversation and guidance are free. When you ask for <strong className="text-foreground">data that requires the API</strong>—such as a trading signal, news, sentiment, research, or memecoin screens—the agent will use a paid tool. For those calls to succeed, you need to connect a wallet and have sufficient balance; the agent will prompt you when needed.
        </p>
        <p className="text-muted-foreground">
          Prices are listed in the <Link to="/docs/agent/agent-catalog" className="text-primary hover:underline">Agent Catalog</Link> (e.g. per signal, per news request). Check your balance in the agent UI before requesting paid features.
        </p>
      </section>

      <section id="quick-start" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Quick Start</h2>
        <p className="text-muted-foreground mb-4">
          Open <a href={AGENT_URL} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">agent.syraa.fun</a>, type a message, and hit send. Try:
        </p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-4">
          <li><em>&quot;What can you do?&quot;</em> — See a summary of the agent&apos;s capabilities.</li>
          <li><em>&quot;List supported tokens&quot;</em> — See which assets you can get signals for.</li>
          <li><em>&quot;Signal for Bitcoin&quot;</em> or <em>&quot;Get me a signal for SOL&quot;</em> — Request a full analysis (requires wallet).</li>
          <li><em>&quot;Latest crypto news&quot;</em> or <em>&quot;News about ETH&quot;</em> — Get recent headlines (requires wallet).</li>
        </ul>
        <p className="text-muted-foreground">
          For a full walkthrough, see <Link to="/docs/agent/how-it-works" className="text-primary hover:underline">How It Works</Link>.
        </p>
      </section>

      <section id="next-steps" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Next Steps</h2>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li><Link to="/docs/agent/how-it-works" className="text-primary hover:underline">How It Works</Link> — Step-by-step: open the agent, explore tokens, request a signal.</li>
          <li><Link to="/docs/agent/features" className="text-primary hover:underline">Agent Features</Link> — Trading signals, news, sentiment, research, and more.</li>
          <li><Link to="/docs/agent/agent-catalog" className="text-primary hover:underline">Agent Catalog</Link> — Full list of tools with names, descriptions, prices, and example prompts.</li>
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
          <Link to="/docs/agent/how-it-works">Next: How It Works →</Link>
        </Button>
        <Button variant="ghost" size="lg" className="w-full sm:min-w-[12rem] sm:w-auto justify-center" asChild>
          <Link to="/docs/welcome">Back to Welcome</Link>
        </Button>
      </div>
    </DocsLayout>
  );
}
