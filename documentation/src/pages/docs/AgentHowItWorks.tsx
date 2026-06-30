import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { DocPageHeader } from "@/components/docs/DocPageHeader";
import { DocSection } from "@/components/docs/DocSection";
import { Callout } from "@/components/docs/Callout";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

import { SYRA_AGENT_URL } from "@/content/syraUrls";

const listOutput = `📜 Available Token Signals
- Bitcoin (BTC)
- Ethereum (ETH)
- Solana (SOL)
- BNB (BNB)
- XRP (XRP)
- Cardano (ADA)
- Dogecoin (DOGE)
... View all supported tokens`;

const tocItems = [
  { id: "overview", title: "Overview", level: 2 },
  { id: "step-1", title: "Step 1: Open the Agent", level: 2 },
  { id: "step-2", title: "Step 2: Explore Tokens", level: 2 },
  { id: "step-3", title: "Step 3: Request a Signal", level: 2 },
  { id: "under-the-hood", title: "What Happens Under the Hood", level: 2 },
  { id: "beyond-signals", title: "Beyond Signals", level: 2 },
];

export default function AgentHowItWorks() {
  return (
    <DocsLayout toc={tocItems}>
      <DocPageHeader
        eyebrow="Syra Agent"
        title="How It Works"
        description="A short walkthrough: open the agent, see what you can ask for, then request a trading signal. The same flow applies to news, sentiment, research, and more."
      />

      <DocSection id="overview" title="Overview" prose>
        <p>
          Using the Syra Agent is conversational: you type what you want, and the agent either answers from context or
          calls a backend tool (e.g. signal, news, research) and formats the result for you. There are no commands to
          learn—natural language is enough. The three steps below focus on getting your first{" "}
          <strong>trading signal</strong>; once you&apos;re comfortable, you can ask for news, sentiment, X search,
          memecoin screens, and other tools in the same way.
        </p>
      </DocSection>

      <DocSection id="step-1" title="Step 1: Open the Agent" prose>
        <ol>
          <li>
            Go to{" "}
            <a href={SYRA_AGENT_URL} target="_blank" rel="noopener noreferrer">
              syraa.fun
            </a>{" "}
            in your browser.
          </li>
          <li>You&apos;ll see a chat interface. Type any message in the input at the bottom and press send.</li>
          <li>
            If you&apos;re new, try <em>&quot;What can you do?&quot;</em> to see a summary of capabilities. To go
            straight to a signal, try <em>&quot;Get me a signal for Bitcoin.&quot;</em>
          </li>
        </ol>
        <p>
          The agent replies in the same thread. For general questions it answers from its knowledge; when you ask for
          data (signals, news, research), it selects the right API tool, calls it, and then explains the results in plain
          language. You can connect a wallet later when you&apos;re ready to use paid tools—the agent will prompt you if
          a request requires payment.
        </p>
        <Callout variant="tip" title="Natural language works">
          You don&apos;t need to phrase requests in a special way. &quot;Signal for BTC&quot;, &quot;Bitcoin
          signal&quot;, and &quot;Give me analysis for Bitcoin&quot; all work. The agent interprets intent and picks the
          right tool.
        </Callout>
      </DocSection>

      <DocSection id="step-2" title="Step 2: Explore Available Tokens">
        <p className="text-muted-foreground leading-7 mb-4">
          Before requesting a signal, it helps to know which assets the agent supports. Ask{" "}
          <em>&quot;List supported tokens&quot;</em> or <em>&quot;What tokens can you analyze?&quot;</em> The agent will
          return a list of symbols (e.g. BTC, ETH, SOL) that you can request signals for. This step is optional but
          useful so you know exactly what to ask for in Step 3.
        </p>
        <div className="not-prose">
          <CodeBlock plain code={listOutput} language="text" showLineNumbers={false} />
        </div>
        <p className="text-muted-foreground leading-7 mt-4">
          You can use either the full name (e.g. Bitcoin, Ethereum) or the ticker (BTC, ETH) when asking for a signal. For
          a full list of everything the agent can do—not just tokens—see the{" "}
          <Link to="/docs/agent/agent-catalog" className="text-primary hover:underline">
            Agent Catalog
          </Link>
          .
        </p>
      </DocSection>

      <DocSection id="step-3" title="Step 3: Request a Trading Signal">
        <p className="text-muted-foreground leading-7 mb-4">
          Ask for a signal by naming the token. For example: <em>&quot;Signal for Bitcoin&quot;</em>,{" "}
          <em>&quot;Get me analysis for SOL&quot;</em>, or <em>&quot;ETH signal.&quot;</em> The agent will call the
          signal tool for that asset and return a structured analysis.{" "}
          <strong className="text-foreground">A connected wallet with sufficient balance is required</strong> for this
          step—the agent will prompt you to connect or top up if needed.
        </p>
        <div className="not-prose mb-4">
          <CodeBlock
            plain
            code={'You: "Signal for bitcoin"\n\nAgent: [Returns analysis including price, RSI, MACD, levels, action plan, risk/reward]'}
            language="text"
            showLineNumbers={false}
          />
        </div>
        <p className="text-muted-foreground leading-7 mb-4">A typical signal response includes:</p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-4 leading-7">
          <li>Current price and 24h change</li>
          <li>RSI, MACD, and Moving Averages</li>
          <li>Support and resistance levels</li>
          <li>Action plan (suggested entry, targets, stop loss)</li>
          <li>Risk/reward ratio and confidence level</li>
        </ul>
        <Callout variant="note" title="Transparent reasoning">
          Syra doesn&apos;t just give signals—it explains <strong>why</strong> each trade setup is suggested, so you can
          align the output with your own strategy and risk tolerance.
        </Callout>
      </DocSection>

      <DocSection id="under-the-hood" title="What Happens Under the Hood" prose>
        <p>When you send a message, the agent:</p>
        <ol>
          <li>
            <strong>Interprets your intent</strong> — It decides whether you&apos;re asking for a signal, news,
            sentiment, research, or something else.
          </li>
          <li>
            <strong>Selects a tool</strong> — If your request needs live data, it picks the right API (e.g. signal,
            news, x-search) and any parameters (e.g. token, ticker).
          </li>
          <li>
            <strong>Calls the API</strong> — For paid tools, your wallet is charged a small per-call fee; the agent
            checks balance before calling.
          </li>
          <li>
            <strong>Formats the response</strong> — The raw data is turned into a clear, readable answer with context and
            reasoning.
          </li>
        </ol>
        <p>
          You only see the final answer—no need to think about tools or APIs unless you want to explore the full list in
          the{" "}
          <Link to="/docs/agent/agent-catalog" className="text-primary hover:underline">
            Agent Catalog
          </Link>
          .
        </p>
      </DocSection>

      <DocSection id="beyond-signals" title="Beyond Signals" prose>
        <p>The same chat flow works for all agent capabilities. After you&apos;re comfortable with signals, try:</p>
        <ul>
          <li>
            <em>&quot;What is the Bitcoin price?&quot;</em> or <em>&quot;Global crypto market cap&quot;</em> — Live data
            via StableCrypto (CoinGecko/DefiLlama).
          </li>
          <li>
            <em>&quot;TikTok profile for nike&quot;</em> or <em>&quot;Top posts on r/solana&quot;</em> — Social profiles
            and feeds via StableSocial.
          </li>
          <li>
            <em>&quot;Scrape https://example.com&quot;</em> or <em>&quot;Apollo search engineers at Stripe&quot;</em> —
            Web scrape and B2B enrichment via StableEnrich.
          </li>
          <li>
            <em>&quot;Latest crypto news&quot;</em> or <em>&quot;News about ETH&quot;</em> — Headlines and updates.
          </li>
          <li>
            <em>&quot;What&apos;s the market sentiment?&quot;</em> — Sentiment analysis.
          </li>
          <li>
            <em>&quot;Run deep research on [topic]&quot;</em> — Structured research reports.
          </li>
          <li>
            <em>&quot;Trending on Jupiter&quot;</em> or <em>&quot;Memecoins with fastest holder growth&quot;</em> —
            Discovery and memecoin screens.
          </li>
        </ul>
        <p>
          Each of these uses a specific tool under the hood; the agent chooses the right one from your message. Provider
          guides:{" "}
          <Link to="/docs/agent/market-data" className="text-primary hover:underline">
            StableCrypto (market data)
          </Link>
          ,{" "}
          <Link to="/docs/agent/social-data" className="text-primary hover:underline">
            StableSocial (social)
          </Link>
          ,{" "}
          <Link to="/docs/agent/enrichment-data" className="text-primary hover:underline">
            StableEnrich (enrichment)
          </Link>
          . For a complete list of tools, prices, and example prompts, see{" "}
          <Link to="/docs/agent/agent-catalog" className="text-primary hover:underline">
            Agent Catalog
          </Link>{" "}
          and{" "}
          <Link to="/docs/agent/features" className="text-primary hover:underline">
            Agent Features
          </Link>
          .
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
          <Link to="/docs/agent/features">Next: Agent Features</Link>
        </Button>
        <Button variant="ghost" size="lg" asChild>
          <Link to="/docs/agent/getting-started">← Getting Started</Link>
        </Button>
      </div>
    </DocsLayout>
  );
}
