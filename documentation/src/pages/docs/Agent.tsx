import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const AGENT_URL = "https://agent.syraa.fun";

/** Map route path segment to section id for scroll-into-view */
const pathToSectionId: Record<string, string> = {
  "getting-started": "what-you-need",
  "how-it-works": "step-1",
  "features": "features",
  "supported-tokens": "supported-tokens",
  "trading-guidance": "trading-guidance",
};

const tocItems = [
  { id: "what-you-need", title: "What You'll Need", level: 2 },
  { id: "step-1", title: "Step 1: Open the Agent", level: 2 },
  { id: "step-2", title: "Step 2: Explore Tokens", level: 2 },
  { id: "step-3", title: "Step 3: Request a Signal", level: 2 },
  { id: "features", title: "Agent Features", level: 2 },
  { id: "supported-tokens", title: "Supported Tokens", level: 2 },
  { id: "trading-guidance", title: "Trading Guidance", level: 2 },
];

const listOutput = `📜 Available Token Signals
- Bitcoin (BTC)
- Ethereum (ETH)
- Solana (SOL)
- BNB (BNB)
- XRP (XRP)
- Cardano (ADA)
- Dogecoin (DOGE)
... View all supported tokens`;

export default function Agent() {
  const { pathname } = useLocation();

  useEffect(() => {
    const slug = pathname.replace(/^\/docs\/agent\/?/, "") || "getting-started";
    const sectionId = pathToSectionId[slug];
    if (!sectionId) return;
    const el = document.getElementById(sectionId);
    if (el) {
      const timer = requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return () => cancelAnimationFrame(timer);
    }
  }, [pathname]);

  return (
    <DocsLayout toc={tocItems}>
      <div className="mb-8">
        <div className="text-sm text-primary font-medium mb-2">Syra Agent</div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">⚙️ Getting Started</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Welcome to the <strong className="text-foreground">Syra AI Agent</strong> at{" "}
          <a href={AGENT_URL} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
            agent.syraa.fun
          </a>
          . Chat with the agent to get market analysis, trading signals, and research-driven insights in one place.
        </p>
      </div>

      <section id="what-you-need" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">What You'll Need</h2>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>A modern browser (Chrome, Firefox, Safari, or Edge)</li>
          <li>Access to <a href={AGENT_URL} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">agent.syraa.fun</a></li>
          <li>An internet connection</li>
          <li>(Optional) Familiarity with trading basics (RSI, MACD, price action)</li>
        </ul>
      </section>

      <section id="step-1" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Step 1: Open the Agent</h2>
        <ol className="list-decimal pl-6 space-y-2 text-muted-foreground mb-4">
          <li>Go to <a href={AGENT_URL} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">agent.syraa.fun</a>.</li>
          <li>Start a conversation in the chat interface.</li>
          <li>Ask for help, e.g. <em>“What can you do?”</em> or <em>“Get me a signal for Bitcoin.”</em></li>
        </ol>
        <p className="text-sm text-muted-foreground">The agent responds with structured analysis and explains the reasoning behind each insight.</p>
      </section>

      <section id="step-2" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Step 2: Explore Available Tokens</h2>
        <p className="text-muted-foreground mb-4">Ask the agent which tokens are supported, e.g. <em>“List supported tokens”</em> or <em>“What tokens can you analyze?”</em></p>
        <CodeBlock plain code={listOutput} language="text" showLineNumbers={false} />
      </section>

      <section id="step-3" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Step 3: Request a Trading Signal</h2>
        <p className="text-muted-foreground mb-4">Ask for a signal by naming the token, e.g. <em>“Signal for Bitcoin”</em> or <em>“Get me analysis for SOL.”</em></p>
        <CodeBlock plain code={'You: "Signal for bitcoin"\n\nAgent: [Returns analysis including price, RSI, MACD, levels, action plan, risk/reward]'} language="text" showLineNumbers={false} />
        <p className="text-muted-foreground mt-4 mb-4">The agent returns a complete analysis including:</p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-4">
          <li>Current price and 24h change</li>
          <li>RSI, MACD, and Moving Averages</li>
          <li>Support and resistance levels</li>
          <li>Action plan (entry, targets, stop loss)</li>
          <li>Risk/reward ratio and confidence level</li>
        </ul>
        <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 text-sm text-muted-foreground">
          Syra doesn't just give signals — it explains why each trade setup is suggested.
        </div>
      </section>

      <section id="features" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Agent Features</h2>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-4">
          <li><strong className="text-foreground">Trading signals</strong> — Request analysis for supported tokens with one message.</li>
          <li><strong className="text-foreground">News & sentiment</strong> — Ask for token-related news and narrative context.</li>
          <li><strong className="text-foreground">Research summaries</strong> — Get structured market and trend overviews.</li>
          <li><strong className="text-foreground">Conversational</strong> — Natural language; no commands to memorize.</li>
        </ul>
      </section>

      <section id="supported-tokens" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Supported Tokens</h2>
        <p className="text-muted-foreground mb-4">
          The agent supports major cryptocurrencies including BTC, ETH, SOL, BNB, XRP, ADA, DOGE, and more. Ask <em>“List supported tokens”</em> on the agent for the latest list.
        </p>
      </section>

      <section id="trading-guidance" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Trading Guidance</h2>
        <p className="text-muted-foreground mb-4">
          Syra is built for <strong className="text-foreground">research and education</strong>, not as a substitute for your own judgment. Use the agent to understand market context, indicators, and scenarios — and always consider risk, position size, and your own strategy before acting.
        </p>
      </section>

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
        <Button variant="primary" size="lg" className="w-full sm:w-auto justify-center" asChild>
          <a href={AGENT_URL} target="_blank" rel="noopener noreferrer">
            Open Syra Agent
            <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
          </a>
        </Button>
        <Button variant="outline" className="w-full sm:w-auto justify-center" asChild>
          <Link to="/docs/welcome">Back to Welcome</Link>
        </Button>
      </div>
    </DocsLayout>
  );
}
