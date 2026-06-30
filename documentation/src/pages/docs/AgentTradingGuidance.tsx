import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { DocPageHeader } from "@/components/docs/DocPageHeader";
import { DocSection } from "@/components/docs/DocSection";
import { Callout } from "@/components/docs/Callout";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

import { SYRA_AGENT_URL } from "@/content/syraUrls";

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
      <DocPageHeader
        eyebrow="Syra Agent"
        title="Trading Guidance"
        description="How to use Syra for research and education, and how to stay responsible when using signals and market data."
      />

      <Callout variant="warning" title="Not financial advice">
        All output from the Syra Agent—including trading signals, action plans, levels, and risk/reward figures—is for
        research and educational purposes only. It is not tailored to your financial situation, risk tolerance, or goals.
        Cryptocurrency trading involves substantial risk of loss. You are solely responsible for your trading and
        investment decisions.
      </Callout>

      <DocSection id="purpose" title="Purpose of Syra" prose>
        <p>
          Syra is built to <strong>enhance your understanding</strong> of markets, narratives, and trade setups—not to
          replace your judgment or to execute trades for you. The agent provides signals, news, sentiment, and research
          so you can make better-informed decisions; it does not provide personalized financial, legal, or tax advice,
          and it is not a substitute for doing your own due diligence.
        </p>
      </DocSection>

      <DocSection id="research-not-advice" title="Research & Education, Not Advice" prose>
        <p>
          All output from the Syra Agent—including trading signals, action plans, levels, and risk/reward figures—is for{" "}
          <strong>research and educational purposes</strong>. It is not tailored to your financial situation, risk
          tolerance, or goals. Entry levels, targets, and stop losses suggested in a signal are illustrative and may not
          suit your strategy or capital. Always interpret the agent&apos;s output in the context of your own analysis,
          time horizon, and risk management rules.
        </p>
      </DocSection>

      <DocSection id="your-responsibility" title="Your Responsibility" prose>
        <p>
          You are responsible for your own trading and investment decisions. Before acting on any signal or insight from
          the agent, consider:
        </p>
        <ul>
          <li>Whether the setup fits your strategy and risk tolerance</li>
          <li>Your position size and how much you can afford to lose</li>
          <li>Market conditions, liquidity, and timing</li>
          <li>External factors (news, macro, regulatory) that may affect the asset</li>
        </ul>
        <p>
          Syra does not guarantee outcomes. Past performance and backtests are not indicative of future results. Use the
          agent as one input among many—not as the sole basis for a trade.
        </p>
      </DocSection>

      <DocSection id="risk-position-size" title="Risk & Position Size" prose>
        <p>
          Even when a signal suggests an entry and targets, <strong>you</strong> decide how much to risk. Never risk
          more than you can afford to lose. Use stop losses and position sizing that align with your capital and goals.
          The agent may show risk/reward ratios or confidence levels; these are based on the analysis at the time of the
          request and can change as the market moves. Re-evaluate as new data arrives rather than following a single
          snapshot blindly.
        </p>
      </DocSection>

      <DocSection id="best-practices" title="Best Practices" prose>
        <ul>
          <li>
            <strong>Use signals as input, not orders</strong> — Treat each signal as a starting point for your own
            analysis, not as a recommendation to trade.
          </li>
          <li>
            <strong>Combine with other sources</strong> — Cross-check with news, on-chain data, and your own research
            before committing capital.
          </li>
          <li>
            <strong>Understand the reasoning</strong> — The agent explains why it suggests a setup; use that to assess
            whether the logic fits your view.
          </li>
          <li>
            <strong>Respect volatility and liquidity</strong> — Especially for smaller caps and memecoins, consider
            slippage, liquidity, and sudden moves before acting.
          </li>
        </ul>
      </DocSection>

      <DocSection id="disclaimer" title="Disclaimer">
        <Callout variant="important" title="Legal disclaimer">
          Syra and the Syra Agent are provided for informational and educational use only. Nothing in the agent&apos;s
          output constitutes financial, investment, legal, or tax advice. Cryptocurrency and other asset trading involve
          substantial risk of loss. You should conduct your own research and, where appropriate, seek independent
          professional advice before making any financial decisions. Syra does not assume any liability for decisions
          made based on the agent&apos;s output.
        </Callout>
      </DocSection>

      <div className="flex flex-col sm:flex-row flex-wrap gap-3 not-prose">
        <Button variant="primary" size="lg" asChild>
          <a href={SYRA_AGENT_URL} target="_blank" rel="noopener noreferrer">
            Open Syra Agent
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link to="/docs/agent/agent-catalog">Agent Catalog</Link>
        </Button>
        <Button variant="ghost" size="lg" asChild>
          <Link to="/docs/agent/getting-started">← Getting Started</Link>
        </Button>
      </div>
    </DocsLayout>
  );
}
