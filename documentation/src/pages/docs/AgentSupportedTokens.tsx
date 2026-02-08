import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const AGENT_URL = "https://agent.syraa.fun";

const tocItems = [
  { id: "overview", title: "Overview", level: 2 },
  { id: "supported-tokens", title: "Which Tokens Are Supported", level: 2 },
  { id: "how-to-ask", title: "How to Ask for a Signal", level: 2 },
  { id: "what-you-get", title: "What You Get in a Signal", level: 2 },
  { id: "latest-list", title: "Getting the Latest List", level: 2 },
];

const exampleTokens = `Bitcoin (BTC)     Ethereum (ETH)   Solana (SOL)
BNB (BNB)        XRP (XRP)        Cardano (ADA)
Dogecoin (DOGE)  ... and more`;

export default function AgentSupportedTokens() {
  return (
    <DocsLayout toc={tocItems}>
      <div className="mb-8">
        <div className="text-sm text-primary font-medium mb-2">Syra Agent</div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Supported Tokens</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Which tokens the agent can analyze and provide trading signals for, and how to request them.
        </p>
      </div>

      <section id="overview" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Overview</h2>
        <p className="text-muted-foreground mb-4">
          The Syra Agent's <strong className="text-foreground">trading signal</strong> feature works for a defined set of cryptocurrencies. These are typically major and liquid assets (e.g. BTC, ETH, SOL, BNB, XRP, ADA, DOGE) so that the analysis—price, indicators, levels, action plan—is based on reliable, real-time data. Other agent features (news, sentiment, research, memecoin screens, partner tools) are not limited to this token list; supported tokens here refer specifically to <em>signal</em> requests.
        </p>
      </section>

      <section id="supported-tokens" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Which Tokens Are Supported</h2>
        <p className="text-muted-foreground mb-4">
          The agent supports major cryptocurrencies including Bitcoin (BTC), Ethereum (ETH), Solana (SOL), BNB (BNB), XRP (XRP), Cardano (ADA), Dogecoin (DOGE), and others. The exact list can change as new assets are added; the agent always has the current list and can return it when you ask.
        </p>
        <pre className="p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground overflow-x-auto font-mono whitespace-pre">
          {exampleTokens}
        </pre>
        <p className="text-muted-foreground mt-4">
          If you request a signal for an unsupported token, the agent will typically suggest supported alternatives or explain that signals are available only for the listed assets. For discovery beyond this set (e.g. memecoins, trending on Jupiter), use the other tools described in <Link to="/docs/agent/features" className="text-primary hover:underline">Agent Features</Link> and the <Link to="/docs/agent/agent-catalog" className="text-primary hover:underline">Agent Catalog</Link>.
        </p>
      </section>

      <section id="how-to-ask" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">How to Ask for a Signal</h2>
        <p className="text-muted-foreground mb-4">
          You can use either the <strong className="text-foreground">full name</strong> or the <strong className="text-foreground">ticker</strong> when asking for a signal. The agent understands common variations, for example:
        </p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-4">
          <li><em>&quot;Signal for Bitcoin&quot;</em> or <em>&quot;Signal for BTC&quot;</em></li>
          <li><em>&quot;Get me a signal for Ethereum&quot;</em> or <em>&quot;ETH signal&quot;</em></li>
          <li><em>&quot;Analysis for Solana&quot;</em> or <em>&quot;SOL analysis&quot;</em></li>
        </ul>
        <p className="text-muted-foreground">
          No special syntax is required—natural language is enough. A connected wallet with sufficient balance is needed for the agent to call the signal tool; if your balance is low or you haven't connected, the agent will prompt you.
        </p>
      </section>

      <section id="what-you-get" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">What You Get in a Signal</h2>
        <p className="text-muted-foreground mb-4">
          For each supported token you request, the agent returns a structured analysis that typically includes:
        </p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-4">
          <li>Current price and 24h change</li>
          <li>Technical indicators (e.g. RSI, MACD, moving averages)</li>
          <li>Support and resistance levels</li>
          <li>Suggested action plan: entry, targets, stop loss</li>
          <li>Risk/reward ratio and confidence level</li>
          <li>Brief reasoning so you can align the setup with your own strategy</li>
        </ul>
        <p className="text-muted-foreground">
          Syra is built for research and education; use this output as input to your decisions, not as automatic trading advice. See <Link to="/docs/agent/trading-guidance" className="text-primary hover:underline">Trading Guidance</Link> for how to use the agent responsibly.
        </p>
      </section>

      <section id="latest-list" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Getting the Latest List</h2>
        <p className="text-muted-foreground mb-4">
          The canonical way to see which tokens are currently supported for signals is to ask the agent. Open <a href={AGENT_URL} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">agent.syraa.fun</a> and type <em>&quot;List supported tokens&quot;</em> or <em>&quot;What tokens can you analyze?&quot;</em> The agent will return the up-to-date list. No wallet is required for this query—only for actually requesting a signal.
        </p>
      </section>

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
        <Button variant="primary" size="lg" className="w-full sm:min-w-[12rem] sm:w-auto justify-center" asChild>
          <a href={AGENT_URL} target="_blank" rel="noopener noreferrer">
            Open Syra Agent
            <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
          </a>
        </Button>
        <Button variant="outline" size="lg" className="w-full sm:min-w-[12rem] sm:w-auto justify-center" asChild>
          <Link to="/docs/agent/trading-guidance">Next: Trading Guidance →</Link>
        </Button>
        <Button variant="ghost" size="lg" className="w-full sm:min-w-[12rem] sm:w-auto justify-center" asChild>
          <Link to="/docs/agent/getting-started">← Getting Started</Link>
        </Button>
      </div>
    </DocsLayout>
  );
}
