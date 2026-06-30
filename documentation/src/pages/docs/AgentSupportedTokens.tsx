import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { DocPageHeader } from "@/components/docs/DocPageHeader";
import { DocSection } from "@/components/docs/DocSection";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

import { SYRA_AGENT_URL } from "@/content/syraUrls";

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
      <DocPageHeader
        eyebrow="Syra Agent"
        title="Supported Tokens"
        description="Which tokens the agent can analyze and provide trading signals for, and how to request them."
      />

      <DocSection id="overview" title="Overview" prose>
        <p>
          The Syra Agent&apos;s <strong>trading signal</strong> feature works for a defined set of cryptocurrencies.
          Signals are built from <strong>public spot OHLC</strong> on a supported exchange; the API{" "}
          <strong>defaults to Binance</strong> unless you or the agent pass another{" "}
          <code>source</code>. These are typically major and liquid assets (e.g. BTC, ETH, SOL, BNB, XRP, ADA, DOGE) so
          that the analysis—price, indicators, levels, action plan—is based on reliable data. Other agent features
          (news, sentiment, research, memecoin screens, partner tools) are not limited to this token list; supported
          tokens here refer specifically to <em>signal</em> requests.
        </p>
      </DocSection>

      <DocSection id="supported-tokens" title="Which Tokens Are Supported">
        <p className="text-muted-foreground leading-7 mb-4">
          The agent supports major cryptocurrencies including Bitcoin (BTC), Ethereum (ETH), Solana (SOL), BNB (BNB),
          XRP (XRP), Cardano (ADA), Dogecoin (DOGE), and others. The exact list can change as new assets are added; the
          agent always has the current list and can return it when you ask.
        </p>
        <pre className="not-prose p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground overflow-x-auto font-mono whitespace-pre">
          {exampleTokens}
        </pre>
        <p className="text-muted-foreground leading-7 mt-4">
          If you request a signal for an unsupported token, the agent will typically suggest supported alternatives or
          explain that signals are available only for the listed assets. For a <strong className="text-foreground">live
          spot price only</strong> (no full TA), ask e.g. &quot;Bitcoin price&quot; — the agent uses StableCrypto
          CoinGecko tools, which accept any CoinGecko id, not only this signal list. For discovery beyond this set (e.g.
          memecoins, trending on Jupiter), use the other tools in{" "}
          <Link to="/docs/agent/features" className="text-primary hover:underline">
            Agent Features
          </Link>
          ,{" "}
          <Link to="/docs/agent/market-data" className="text-primary hover:underline">
            Market data
          </Link>
          , and the{" "}
          <Link to="/docs/agent/agent-catalog" className="text-primary hover:underline">
            Agent Catalog
          </Link>
          .
        </p>
      </DocSection>

      <DocSection id="how-to-ask" title="How to Ask for a Signal" prose>
        <p>
          You can use either the <strong>full name</strong> or the <strong>ticker</strong> when asking for a signal. The
          agent understands common variations, for example:
        </p>
        <ul>
          <li>
            <em>&quot;Signal for Bitcoin&quot;</em> or <em>&quot;Signal for BTC&quot;</em>
          </li>
          <li>
            <em>&quot;Get me a signal for Ethereum&quot;</em> or <em>&quot;ETH signal&quot;</em>
          </li>
          <li>
            <em>&quot;Analysis for Solana&quot;</em> or <em>&quot;SOL analysis&quot;</em>
          </li>
        </ul>
        <p>
          No special syntax is required—natural language is enough. A connected wallet with sufficient balance is
          needed for the agent to call the signal tool; if your balance is low or you haven&apos;t connected, the agent
          will prompt you.
        </p>
      </DocSection>

      <DocSection id="what-you-get" title="What You Get in a Signal" prose>
        <p>For each supported token you request, the agent returns a structured analysis that typically includes:</p>
        <ul>
          <li>Current price and 24h change</li>
          <li>Technical indicators (e.g. RSI, MACD, moving averages)</li>
          <li>Support and resistance levels</li>
          <li>Suggested action plan: entry, targets, stop loss</li>
          <li>Risk/reward ratio and confidence level</li>
          <li>Brief reasoning so you can align the setup with your own strategy</li>
        </ul>
        <p>
          Syra is built for research and education; use this output as input to your decisions, not as automatic trading
          advice. See{" "}
          <Link to="/docs/agent/trading-guidance" className="text-primary hover:underline">
            Trading Guidance
          </Link>{" "}
          for how to use the agent responsibly.
        </p>
      </DocSection>

      <DocSection id="latest-list" title="Getting the Latest List" prose>
        <p>
          The canonical way to see which tokens are currently supported for signals is to ask the agent. Open{" "}
          <a href={SYRA_AGENT_URL} target="_blank" rel="noopener noreferrer">
            syraa.fun
          </a>{" "}
          and type <em>&quot;List supported tokens&quot;</em> or <em>&quot;What tokens can you analyze?&quot;</em> The
          agent will return the up-to-date list. No wallet is required for this query—only for actually requesting a
          signal.
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
          <Link to="/docs/agent/trading-guidance">Next: Trading Guidance</Link>
        </Button>
        <Button variant="ghost" size="lg" asChild>
          <Link to="/docs/agent/getting-started">← Getting Started</Link>
        </Button>
      </div>
    </DocsLayout>
  );
}
