import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const AGENT_URL = "https://agent.syraa.fun";

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
      <div className="mb-8">
        <div className="text-sm text-primary font-medium mb-2">Syra Agent</div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">How It Works</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          A short walkthrough: open the agent, see what you can ask for, then request a trading signal. The same flow applies to news, sentiment, research, and more.
        </p>
      </div>

      <section id="overview" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Overview</h2>
        <p className="text-muted-foreground mb-4">
          Using the Syra Agent is conversational: you type what you want, and the agent either answers from context or calls a backend tool (e.g. signal, news, research) and formats the result for you. There are no commands to learn—natural language is enough. The three steps below focus on getting your first <strong className="text-foreground">trading signal</strong>; once you're comfortable, you can ask for news, sentiment, X search, memecoin screens, and other tools in the same way.
        </p>
      </section>

      <section id="step-1" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Step 1: Open the Agent</h2>
        <ol className="list-decimal pl-6 space-y-2 text-muted-foreground mb-4">
          <li>Go to <a href={AGENT_URL} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">agent.syraa.fun</a> in your browser.</li>
          <li>You'll see a chat interface. Type any message in the input at the bottom and press send.</li>
          <li>If you're new, try <em>"What can you do?"</em> to see a summary of capabilities. To go straight to a signal, try <em>"Get me a signal for Bitcoin."</em></li>
        </ol>
        <p className="text-muted-foreground mb-4">
          The agent replies in the same thread. For general questions it answers from its knowledge; when you ask for data (signals, news, research), it selects the right API tool, calls it, and then explains the results in plain language. You can connect a wallet later when you're ready to use paid tools—the agent will prompt you if a request requires payment.
        </p>
        <div className="p-4 rounded-lg border border-border bg-muted/30 text-sm text-muted-foreground">
          <strong className="text-foreground">Tip:</strong> You don't need to phrase requests in a special way. &quot;Signal for BTC&quot;, &quot;Bitcoin signal&quot;, and &quot;Give me analysis for Bitcoin&quot; all work. The agent interprets intent and picks the right tool.
        </div>
      </section>

      <section id="step-2" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Step 2: Explore Available Tokens</h2>
        <p className="text-muted-foreground mb-4">
          Before requesting a signal, it helps to know which assets the agent supports. Ask <em>"List supported tokens"</em> or <em>"What tokens can you analyze?"</em> The agent will return a list of symbols (e.g. BTC, ETH, SOL) that you can request signals for. This step is optional but useful so you know exactly what to ask for in Step 3.
        </p>
        <CodeBlock plain code={listOutput} language="text" showLineNumbers={false} />
        <p className="text-muted-foreground mt-4">
          You can use either the full name (e.g. Bitcoin, Ethereum) or the ticker (BTC, ETH) when asking for a signal. For a full list of everything the agent can do—not just tokens—see the <Link to="/docs/agent/agent-catalog" className="text-primary hover:underline">Agent Catalog</Link>.
        </p>
      </section>

      <section id="step-3" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Step 3: Request a Trading Signal</h2>
        <p className="text-muted-foreground mb-4">
          Ask for a signal by naming the token. For example: <em>"Signal for Bitcoin"</em>, <em>"Get me analysis for SOL"</em>, or <em>"ETH signal."</em> The agent will call the signal tool for that asset and return a structured analysis. <strong className="text-foreground">A connected wallet with sufficient balance is required</strong> for this step—the agent will prompt you to connect or top up if needed.
        </p>
        <CodeBlock plain code={'You: "Signal for bitcoin"\n\nAgent: [Returns analysis including price, RSI, MACD, levels, action plan, risk/reward]'} language="text" showLineNumbers={false} />
        <p className="text-muted-foreground mt-4 mb-4">A typical signal response includes:</p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-4">
          <li>Current price and 24h change</li>
          <li>RSI, MACD, and Moving Averages</li>
          <li>Support and resistance levels</li>
          <li>Action plan (suggested entry, targets, stop loss)</li>
          <li>Risk/reward ratio and confidence level</li>
        </ul>
        <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 text-sm text-muted-foreground">
          Syra doesn't just give signals—it explains <strong className="text-foreground">why</strong> each trade setup is suggested, so you can align the output with your own strategy and risk tolerance.
        </div>
      </section>

      <section id="under-the-hood" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">What Happens Under the Hood</h2>
        <p className="text-muted-foreground mb-4">
          When you send a message, the agent:
        </p>
        <ol className="list-decimal pl-6 space-y-2 text-muted-foreground mb-4">
          <li><strong className="text-foreground">Interprets your intent</strong> — It decides whether you're asking for a signal, news, sentiment, research, or something else.</li>
          <li><strong className="text-foreground">Selects a tool</strong> — If your request needs live data, it picks the right API (e.g. signal, news, x-search) and any parameters (e.g. token, ticker).</li>
          <li><strong className="text-foreground">Calls the API</strong> — For paid tools, your wallet is charged a small per-call fee; the agent checks balance before calling.</li>
          <li><strong className="text-foreground">Formats the response</strong> — The raw data is turned into a clear, readable answer with context and reasoning.</li>
        </ol>
        <p className="text-muted-foreground">
          You only see the final answer—no need to think about tools or APIs unless you want to explore the full list in the <Link to="/docs/agent/agent-catalog" className="text-primary hover:underline">Agent Catalog</Link>.
        </p>
      </section>

      <section id="beyond-signals" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Beyond Signals</h2>
        <p className="text-muted-foreground mb-4">
          The same chat flow works for all agent capabilities. After you're comfortable with signals, try:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
          <li><em>&quot;Latest crypto news&quot;</em> or <em>&quot;News about ETH&quot;</em> — Headlines and updates.</li>
          <li><em>&quot;What's the market sentiment?&quot;</em> — Sentiment analysis.</li>
          <li><em>&quot;Run deep research on [topic]&quot;</em> — Structured research reports.</li>
          <li><em>&quot;Trending on Jupiter&quot;</em> or <em>&quot;Memecoins with fastest holder growth&quot;</em> — Discovery and memecoin screens.</li>
        </ul>
        <p className="text-muted-foreground">
          Each of these uses a specific tool under the hood; the agent chooses the right one from your message. For a complete list of tools, prices, and example prompts, see <Link to="/docs/agent/agent-catalog" className="text-primary hover:underline">Agent Catalog</Link> and <Link to="/docs/agent/features" className="text-primary hover:underline">Agent Features</Link>.
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
          <Link to="/docs/agent/features">Next: Agent Features →</Link>
        </Button>
        <Button variant="ghost" size="lg" className="w-full sm:min-w-[12rem] sm:w-auto justify-center" asChild>
          <Link to="/docs/agent/getting-started">← Getting Started</Link>
        </Button>
      </div>
    </DocsLayout>
  );
}
