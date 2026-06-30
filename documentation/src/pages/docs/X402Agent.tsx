import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { DocPageHeader } from "@/components/docs/DocPageHeader";
import { DocSection } from "@/components/docs/DocSection";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";

const tocItems = [
  { id: "what-you-need", title: "What You'll Need", level: 2 },
  { id: "activate", title: "Activate Syra on x402scan", level: 2 },
  { id: "first-task", title: "Run Your First Agent Task", level: 2 },
];

export default function X402Agent() {
  return (
    <DocsLayout toc={tocItems}>
      <DocPageHeader
        eyebrow="x402 Agent"
        title="Getting Started"
        description={
          <>
            Welcome to the <strong className="text-foreground">Syra x402 Autonomous Intelligence Agent</strong> guide.
            Syra on x402 is an agentic research system — not a signal bot — focused on structured market interpretation,
            narrative &amp; sentiment awareness, and risk-context perspectives.
          </>
        }
      />

      <DocSection id="what-you-need" title="What You'll Need" prose>
        <ul>
          <li>
            Access to the <strong>x402 Agent platform / x402scan</strong>
          </li>
          <li>A connected wallet or authenticated agent account</li>
          <li>Internet access</li>
          <li>(Optional) Familiarity with indicators (RSI, MACD, EMA, volume &amp; momentum)</li>
        </ul>
        <p>No trading expertise is required — Syra explains the reasoning behind every output.</p>
      </DocSection>

      <DocSection id="activate" title="Step 1: Activate Syra on x402scan" prose>
        <p>When the Syra Agent is live on x402scan, you can trigger agent workflows such as:</p>
        <ul>
          <li>📊 Market &amp; trend analysis</li>
          <li>🧠 AI-driven research synthesis</li>
          <li>🔎 Narrative &amp; sentiment tracking</li>
          <li>🧾 Structured insight generation</li>
        </ul>
        <p>
          When a task runs, Syra: (1) collects market &amp; contextual data, (2) processes indicators and momentum,
          (3) interprets conditions with an AI reasoning layer, (4) produces a{" "}
          <strong>structured research-grade output</strong>. Syra focuses on scenarios, confidence ranges, risk context,
          and awareness — not blind Buy/Sell calls.
        </p>
      </DocSection>

      <DocSection id="first-task" title="Step 2: Run Your First Agent Task">
        <p className="text-muted-foreground leading-7 mb-4">
          From x402scan you can run Syra to generate token insight reports, market condition summaries, and momentum
          &amp; volatility evaluations. Typical output includes:
        </p>
        <div className="not-prose flex flex-wrap gap-2 mb-6">
          {[
            "Price trend overview",
            "RSI / MACD / EMA interpretation",
            "Support & resistance ranges",
            "Volatility & momentum",
            "Narrative + sentiment context",
            "AI confidence outlook",
          ].map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20"
            >
              <CheckCircle className="h-4 w-4" />
              {item}
            </span>
          ))}
        </div>
        <p className="text-muted-foreground leading-7">
          The goal is to support <strong className="text-foreground">decision thinking</strong>, not automated
          execution.
        </p>
      </DocSection>

      <div className="flex flex-col sm:flex-row flex-wrap gap-3 not-prose">
        <Button variant="primary" size="lg" asChild>
          <Link to="/docs/x402-agent/agent-catalog">
            Agent Catalog
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link to="/docs/welcome">Back to Welcome</Link>
        </Button>
      </div>
    </DocsLayout>
  );
}
