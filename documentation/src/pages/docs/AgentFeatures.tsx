import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const AGENT_URL = "https://agent.syraa.fun";

const tocItems = [
  { id: "overview", title: "Overview", level: 2 },
  { id: "trading-signals", title: "Trading Signals", level: 2 },
  { id: "news-sentiment", title: "News & Sentiment", level: 2 },
  { id: "research-discovery", title: "Research & Discovery", level: 2 },
  { id: "partner-memecoin", title: "Partner & Memecoin Tools", level: 2 },
  { id: "conversational", title: "Conversational Interface", level: 2 },
  { id: "full-list", title: "Full List of Tools", level: 2 },
];

export default function AgentFeatures() {
  return (
    <DocsLayout toc={tocItems}>
      <div className="mb-8">
        <div className="text-sm text-primary font-medium mb-2">Syra Agent</div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Agent Features</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          A concise overview of what the Syra Agent can do: signals, news, sentiment, research, discovery, and more—all through natural-language chat.
        </p>
      </div>

      <section id="overview" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Overview</h2>
        <p className="text-muted-foreground mb-4">
          The Syra Agent exposes dozens of capabilities through a single chat interface. You don't choose tools from a menu—you describe what you want (e.g. &quot;Signal for Bitcoin&quot;, &quot;Latest ETH news&quot;, &quot;Market sentiment&quot;), and the agent selects the right backend tool, calls it, and returns a clear answer. Features are grouped below by category; for the complete list with prices and example prompts, see the <Link to="/docs/agent/agent-catalog" className="text-primary hover:underline">Agent Catalog</Link>.
        </p>
      </section>

      <section id="trading-signals" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Trading Signals</h2>
        <p className="text-muted-foreground mb-4">
          Request a full technical and contextual analysis for supported tokens (e.g. Bitcoin, Ethereum, Solana). Each signal typically includes current price, 24h change, RSI, MACD, moving averages, support and resistance levels, a suggested action plan (entry, targets, stop loss), and risk/reward with confidence. The agent explains the reasoning behind the setup so you can align it with your strategy. See <Link to="/docs/agent/supported-tokens" className="text-primary hover:underline">Supported Tokens</Link> for the list of assets you can request signals for.
        </p>
        <p className="text-muted-foreground">
          <strong className="text-foreground">Example:</strong> <em>&quot;Signal for Bitcoin&quot;</em>, <em>&quot;Get me analysis for SOL&quot;</em>
        </p>
      </section>

      <section id="news-sentiment" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">News & Sentiment</h2>
        <p className="text-muted-foreground mb-4">
          <strong className="text-foreground">Crypto news</strong> — Get the latest headlines and updates. You can ask for general crypto news or narrow by ticker (e.g. BTC, ETH, SOL). <strong className="text-foreground">Sentiment analysis</strong> — Ask for market or token-level sentiment to gauge narrative and mood. Additional features include <strong className="text-foreground">trending headlines</strong> and the <strong className="text-foreground">sundown digest</strong> (daily summary), so you can stay on top of what's moving the market without leaving the chat.
        </p>
        <p className="text-muted-foreground">
          <strong className="text-foreground">Examples:</strong> <em>&quot;Latest crypto news&quot;</em>, <em>&quot;News about ETH&quot;</em>, <em>&quot;What's the market sentiment?&quot;</em>, <em>&quot;Sundown digest&quot;</em>
        </p>
      </section>

      <section id="research-discovery" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Research & Discovery</h2>
        <p className="text-muted-foreground mb-4">
          <strong className="text-foreground">Deep research</strong> — Request structured research reports on topics you care about; the agent runs a research pipeline and returns summarized, actionable insights. <strong className="text-foreground">Browse & gems</strong> — Discovery and curated insights to surface ideas and trends. <strong className="text-foreground">X (Twitter) search</strong> — Search X for crypto and market-related content without leaving the agent. <strong className="text-foreground">KOL data</strong> — Access key opinion leader (KOL) data from X and crypto-specific sources to see what influential accounts are discussing.
        </p>
        <p className="text-muted-foreground">
          <strong className="text-foreground">Examples:</strong> <em>&quot;Run deep research on [topic]&quot;</em>, <em>&quot;Search X for Bitcoin&quot;</em>, <em>&quot;Show me gems&quot;</em>, <em>&quot;Crypto KOL&quot;</em>
        </p>
      </section>

      <section id="partner-memecoin" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Partner & Memecoin Tools</h2>
        <p className="text-muted-foreground mb-4">
          The agent can call partner-powered tools when you ask. These include <strong className="text-foreground">Nansen</strong> (smart money, token god mode, and per-endpoint tools such as address current balance, smart money netflow, TGM holders—the agent calls the real Nansen API at api.nansen.ai with your agent wallet), <strong className="text-foreground">DexScreener</strong>, <strong className="text-foreground">Jupiter</strong> (trending tokens), <strong className="text-foreground">Rugcheck</strong> (token report, token statistic), <strong className="text-foreground">Bubblemaps</strong>, <strong className="text-foreground">Binance correlation</strong>, and <strong className="text-foreground">Workfun (Pump)</strong>. For memecoins, dedicated screens are available—e.g. fastest holder growth, most mentioned by smart money on X, accumulating before CEX rumors, strong narrative low market cap, by experienced devs, unusual whale behavior, trending on X not DEX, organic traction, and surviving market dumps. Ask in natural language and the agent will pick the right screen or partner tool.
        </p>
        <p className="text-muted-foreground">
          <strong className="text-foreground">Examples:</strong> <em>&quot;Smart money data&quot;</em>, <em>&quot;Trending on Jupiter&quot;</em>, <em>&quot;Memecoins with fastest holder growth&quot;</em>, <em>&quot;Token report&quot;</em>
        </p>
      </section>

      <section id="conversational" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Conversational Interface</h2>
        <p className="text-muted-foreground mb-4">
          All features are accessed through natural language. You don't need to memorize commands or tool names—describe your goal and the agent interprets intent, selects the appropriate tool (if any), and formats the response. You can mix follow-up questions, ask for clarification, or chain requests (e.g. &quot;Now get me news about that token&quot;) in the same conversation. The interface is the same whether you're asking for a signal, news, or a memecoin screen.
        </p>
      </section>

      <section id="full-list" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Full List of Tools</h2>
        <p className="text-muted-foreground mb-4">
          For a complete, up-to-date list of every tool the agent can use—including names, short descriptions, per-call prices in USD, and example prompts—see the <Link to="/docs/agent/agent-catalog" className="text-primary hover:underline">Agent Catalog</Link>. It covers core tools (signals, news, sentiment, research, x-search, gems, KOL, digest, headline), partner tools (Nansen, DexScreener, Jupiter, Rugcheck, Bubblemaps, Binance, Pump), and all memecoin screens.
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
          <Link to="/docs/agent/supported-tokens">Next: Supported Tokens →</Link>
        </Button>
        <Button variant="ghost" size="lg" className="w-full sm:min-w-[12rem] sm:w-auto justify-center" asChild>
          <Link to="/docs/agent/getting-started">← Getting Started</Link>
        </Button>
      </div>
    </DocsLayout>
  );
}
