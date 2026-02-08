import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const AGENT_URL = "https://agent.syraa.fun";

const tocItems = [
  { id: "purpose", title: "Purpose of Syra", level: 2 },
  { id: "research-not-advice", title: "Research & Education, Not Advice", level: 2 },
  { id: "your-responsibility", title: "Your Responsibility", level: 2 },
  { id: "risk-position-size", title: "Risk & Position Size", level: 2 },
  { id: "best-practices", title: "Best Practices", level: 2 },
  { id: "disclaimer", title: "Disclaimer", level: 2 },
];

export default function AgentTradingGuidance() {
  return (
    <DocsLayout toc={tocItems}>
      <div className="mb-8">
        <div className="text-sm text-primary font-medium mb-2">Syra Agent</div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Trading Guidance</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          How to use Syra for research and education, and how to stay responsible when using signals and market data.
        </p>
      </div>

      <section id="purpose" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Purpose of Syra</h2>
        <p className="text-muted-foreground mb-4">
          Syra is built to <strong className="text-foreground">enhance your understanding</strong> of markets, narratives, and trade setups—not to replace your judgment or to execute trades for you. The agent provides signals, news, sentiment, and research so you can make better-informed decisions; it does not provide personalized financial, legal, or tax advice, and it is not a substitute for doing your own due diligence.
        </p>
      </section>

      <section id="research-not-advice" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Research & Education, Not Advice</h2>
        <p className="text-muted-foreground mb-4">
          All output from the Syra Agent—including trading signals, action plans, levels, and risk/reward figures—is for <strong className="text-foreground">research and educational purposes</strong>. It is not tailored to your financial situation, risk tolerance, or goals. Entry levels, targets, and stop losses suggested in a signal are illustrative and may not suit your strategy or capital. Always interpret the agent's output in the context of your own analysis, time horizon, and risk management rules.
        </p>
      </section>

      <section id="your-responsibility" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Your Responsibility</h2>
        <p className="text-muted-foreground mb-4">
          You are responsible for your own trading and investment decisions. Before acting on any signal or insight from the agent, consider:
        </p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-4">
          <li>Whether the setup fits your strategy and risk tolerance</li>
          <li>Your position size and how much you can afford to lose</li>
          <li>Market conditions, liquidity, and timing</li>
          <li>External factors (news, macro, regulatory) that may affect the asset</li>
        </ul>
        <p className="text-muted-foreground">
          Syra does not guarantee outcomes. Past performance and backtests are not indicative of future results. Use the agent as one input among many—not as the sole basis for a trade.
        </p>
      </section>

      <section id="risk-position-size" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Risk & Position Size</h2>
        <p className="text-muted-foreground mb-4">
          Even when a signal suggests an entry and targets, <strong className="text-foreground">you</strong> decide how much to risk. Never risk more than you can afford to lose. Use stop losses and position sizing that align with your capital and goals. The agent may show risk/reward ratios or confidence levels; these are based on the analysis at the time of the request and can change as the market moves. Re-evaluate as new data arrives rather than following a single snapshot blindly.
        </p>
      </section>

      <section id="best-practices" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
          <li><strong className="text-foreground">Use signals as input, not orders</strong> — Treat each signal as a starting point for your own analysis, not as a recommendation to trade.</li>
          <li><strong className="text-foreground">Combine with other sources</strong> — Cross-check with news, on-chain data, and your own research before committing capital.</li>
          <li><strong className="text-foreground">Understand the reasoning</strong> — The agent explains why it suggests a setup; use that to assess whether the logic fits your view.</li>
          <li><strong className="text-foreground">Respect volatility and liquidity</strong> — Especially for smaller caps and memecoins, consider slippage, liquidity, and sudden moves before acting.</li>
        </ul>
      </section>

      <section id="disclaimer" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Disclaimer</h2>
        <p className="text-muted-foreground mb-4">
          Syra and the Syra Agent are provided for informational and educational use only. Nothing in the agent's output constitutes financial, investment, legal, or tax advice. Cryptocurrency and other asset trading involve substantial risk of loss. You should conduct your own research and, where appropriate, seek independent professional advice before making any financial decisions. Syra does not assume any liability for decisions made based on the agent's output.
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
          <Link to="/docs/agent/agent-catalog">Agent Catalog →</Link>
        </Button>
        <Button variant="ghost" size="lg" className="w-full sm:min-w-[12rem] sm:w-auto justify-center" asChild>
          <Link to="/docs/agent/getting-started">← Getting Started</Link>
        </Button>
      </div>
    </DocsLayout>
  );
}
