import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle, Bot, Zap } from "lucide-react";

const tocItems = [
  { id: "what-is-syra", title: "What Is Syra?", level: 2 },
  { id: "where-syra-runs", title: "Where Syra Runs", level: 2 },
  { id: "key-highlights", title: "Key Highlights", level: 2 },
  { id: "how-syra-works", title: "How Syra Works", level: 2 },
  { id: "quick-start", title: "Quick Start Options", level: 2 },
  { id: "why-choose-syra", title: "Why Choose Syra?", level: 2 },
];

export default function Welcome() {
  return (
    <DocsLayout toc={tocItems}>
      <div className="mb-8">
        <div className="text-sm text-primary font-medium mb-2">Welcome</div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">👋 Welcome</h1>
        <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
          Welcome to <strong className="text-foreground">Syra</strong> — an intelligent, research-driven AI Trading Intelligence Agent for the Solana ecosystem.
        </p>
      </div>

      <p className="text-muted-foreground leading-relaxed mb-8">
        Syra helps traders, analysts, and builders make smarter, data-based decisions by combining real-time market data, on-chain activity signals, narrative & sentiment intelligence, and structured AI-driven research insights. Use the <strong className="text-foreground">Syra Agent</strong> at <a href="https://agent.syraa.fun" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">agent.syraa.fun</a>, or integrate via API and autonomous agents such as <strong className="text-foreground">x402 Agent (Rank #1 on x402scan)</strong>.
      </p>

      <section id="what-is-syra" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">What Is Syra?</h2>
        <p className="text-muted-foreground mb-4">
          Syra is an <strong className="text-foreground">AI-powered trading and research assistant</strong> designed to analyze markets in real time, process technical + contextual indicators, and summarize complex data into clear, usable insights. Instead of hype or speculation, Syra focuses on structured research, risk-aware trading perspectives, and learning-oriented explanations.
        </p>
        <p className="text-muted-foreground mb-4">Every analysis includes:</p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-6">
          <li><strong className="text-foreground">Market Overview</strong> — price, volume, volatility, trend strength</li>
          <li><strong className="text-foreground">Technical Indicators</strong> — RSI, MACD, SMA, EMA, Bollinger Bands</li>
          <li><strong className="text-foreground">Action Perspectives</strong> — key levels, momentum bias, scenario outlooks</li>
          <li><strong className="text-foreground">Risk Context</strong> — R/R awareness and exposure considerations</li>
          <li><strong className="text-foreground">AI Insights</strong> — confidence levels + sentiment interpretation</li>
        </ul>
      </section>

      <section id="where-syra-runs" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Where Syra Runs</h2>
        <p className="text-muted-foreground mb-4">
          Syra is not limited to a single interface. It operates across multiple environments:
        </p>
        <div className="rounded-lg border border-border overflow-hidden overflow-x-auto overflow-x-auto-touch">
          <table className="w-full text-sm min-w-[320px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-2 sm:p-3 font-medium">Platform</th>
                <th className="text-left p-2 sm:p-3 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/50"><td className="p-2 sm:p-3 whitespace-nowrap">🤖 Syra Agent</td><td className="p-2 sm:p-3">Chat at <a href="https://agent.syraa.fun" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">agent.syraa.fun</a> for market analysis, signals & insights</td></tr>
              <tr className="border-b border-border/50"><td className="p-2 sm:p-3 whitespace-nowrap">🔗 x402 Autonomous Agent</td><td className="p-2 sm:p-3">Ranked #1 on x402scan; executes research & insights workflows</td></tr>
              <tr className="border-b border-border/50"><td className="p-2 sm:p-3 whitespace-nowrap">🧩 API & Workflows</td><td className="p-2 sm:p-3">Integrates with tools like n8n & automation pipelines</td></tr>
              <tr className="border-b border-border/50"><td className="p-2 sm:p-3 whitespace-nowrap">🛠️ API Playground</td><td className="p-2 sm:p-3">Try the API at <a href="https://playground.syraa.fun" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">playground.syraa.fun</a></td></tr>
              <tr className="border-b border-border/50"><td className="p-2 sm:p-3 whitespace-nowrap">📡 Data & Signal Engine</td><td className="p-2 sm:p-3">Processes indicators, trends, & on-chain movements</td></tr>
              <tr><td className="p-2 sm:p-3 whitespace-nowrap">🧠 AI Reasoning Layer</td><td className="p-2 sm:p-3">Synthesizes signals into structured interpretations</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-muted-foreground mt-4">
          Syra is designed as <strong className="text-foreground">an intelligence layer — not just a signal bot</strong>.
        </p>
      </section>

      <section id="key-highlights" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Key Highlights</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { title: "AI-Assisted Insights", desc: "Multiple indicators + reasoning → structured trade outlooks" },
            { title: "Real-Time Market Data", desc: "Powered by live technical & contextual data sources" },
            { title: "Research-Driven Output", desc: "Focused on understanding — not blind execution" },
            { title: "Multi-Platform Access", desc: "Syra Agent (agent.syraa.fun), x402 Agent, API & automation" },
            { title: "Educational Context", desc: "Every output includes explanations & indicators" },
            { title: "Agentic Automation", desc: "Syra automates analysis pipelines across platforms" },
          ].map((item) => (
            <div key={item.title} className="p-4 rounded-lg border border-border bg-card">
              <div className="font-medium text-foreground mb-1">{item.title}</div>
              <div className="text-sm text-muted-foreground">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="how-syra-works" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">How Syra Works (High-Level Flow)</h2>
        <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
          <li><strong className="text-foreground">User Request / Agent Trigger</strong> — Via Syra Agent (agent.syraa.fun), x402 Agent, or workflow automation.</li>
          <li><strong className="text-foreground">Data Collection</strong> — Syra retrieves technical metrics, price action, and contextual signals.</li>
          <li><strong className="text-foreground">Analysis Engine</strong> — Processes indicators (RSI, MACD, EMA, trend momentum, volume shifts, etc.).</li>
          <li><strong className="text-foreground">AI Reasoning Layer</strong> — Interprets signals into structured scenarios, not simple buy/sell calls.</li>
          <li><strong className="text-foreground">Insight Delivery</strong> — Output is formatted into a readable, actionable research summary.</li>
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
              <li>Open <a href="https://agent.syraa.fun" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">agent.syraa.fun</a></li>
              <li>Start a conversation in the chat</li>
              <li>Ask for supported tokens or try <em>“Signal for Bitcoin”</em> for a live analysis</li>
            </ol>
            <Button size="sm" variant="outline" asChild>
              <Link to="/docs/agent/getting-started">Syra Agent Docs <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
          <div className="p-5 rounded-xl border border-border bg-card">
            <h3 className="font-semibold flex items-center gap-2 mb-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              x402 Autonomous Agent
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Syra runs as an autonomous research agent on <strong className="text-foreground">x402scan</strong>, currently ranked <strong className="text-primary">#1</strong>. It is designed for automated research cycles, news & narrative monitoring, and signal interpretation pipelines.
            </p>
            <Button size="sm" variant="outline" asChild>
              <Link to="/docs/x402-agent/getting-started">x402 Agent Docs <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
        </div>
        <div className="mt-6 p-4 rounded-lg border border-primary/20 bg-primary/5">
          <h4 className="font-medium text-foreground mb-2">Example (Syra Agent at agent.syraa.fun)</h4>
          <div className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div><em>“What can you do?”</em> — See capabilities</div>
            <div><em>“Signal for bitcoin”</em> — Get latest BTC analysis</div>
            <div><em>“List supported tokens”</em> — Show supported tokens</div>
            <div><em>“News for BTC”</em> — Get BTC-related news</div>
          </div>
        </div>
      </section>

      <section id="why-choose-syra" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Why Choose Syra?</h2>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
          <li>Designed for clarity, consistency, and structured reasoning</li>
          <li>Blends AI insight + traditional market analysis</li>
          <li>Built for automation and agent workflows</li>
          <li>Expanding across multi-surface agent environments</li>
          <li>Evolving through real-world usage & community feedback</li>
        </ul>
        <p className="text-lg text-foreground">
          Syra is not built to replace decision-making; it is built to <strong className="text-primary">enhance understanding</strong>.
        </p>
      </section>

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 pt-4">
        <Button variant="primary" size="default" className="w-full sm:w-auto justify-center" asChild>
          <a href="https://agent.syraa.fun" target="_blank" rel="noopener noreferrer">
            Open Syra Agent
            <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
          </a>
        </Button>
        <Button variant="outline" size="default" className="w-full sm:w-auto justify-center" asChild>
          <Link to="/docs/agent/getting-started">Agent Docs</Link>
        </Button>
        <Button variant="outline" size="default" className="w-full sm:w-auto justify-center" asChild>
          <Link to="/docs/api-reference">API Reference</Link>
        </Button>
      </div>
    </DocsLayout>
  );
}
