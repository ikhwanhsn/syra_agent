import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bot, CheckCircle } from "lucide-react";

const tocItems = [
  { id: "what-you-need", title: "What You'll Need", level: 2 },
  { id: "activate", title: "Activate Syra on x402scan", level: 2 },
  { id: "first-task", title: "Run Your First Agent Task", level: 2 },
];

export default function X402Agent() {
  return (
    <DocsLayout toc={tocItems}>
      <div className="mb-8">
        <div className="text-sm text-primary font-medium mb-2">x402 Agent</div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">⚙️ Getting Started</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Welcome to the <strong className="text-foreground">Syra x402 Autonomous Intelligence Agent</strong> guide. Syra on x402 is an agentic research system — not a signal bot — focused on structured market interpretation, narrative & sentiment awareness, and risk-context perspectives.
        </p>
      </div>

      <section id="what-you-need" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">What You'll Need</h2>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>Access to the <strong className="text-foreground">x402 Agent platform / x402scan</strong></li>
          <li>A connected wallet or authenticated agent account</li>
          <li>Internet access</li>
          <li>(Optional) Familiarity with indicators (RSI, MACD, EMA, volume & momentum)</li>
        </ul>
        <p className="text-muted-foreground mt-4">No trading expertise is required — Syra explains the reasoning behind every output.</p>
      </section>

      <section id="activate" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Step 1: Activate Syra on x402scan</h2>
        <p className="text-muted-foreground mb-4">When the Syra Agent is live on x402scan, you can trigger agent workflows such as:</p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-4">
          <li>📊 Market & trend analysis</li>
          <li>🧠 AI-driven research synthesis</li>
          <li>🔎 Narrative & sentiment tracking</li>
          <li>🧾 Structured insight generation</li>
        </ul>
        <p className="text-muted-foreground mb-4">When a task runs, Syra: (1) collects market & contextual data, (2) processes indicators and momentum, (3) interprets conditions with an AI reasoning layer, (4) produces a <strong className="text-foreground">structured research-grade output</strong>. Syra focuses on scenarios, confidence ranges, risk context, and awareness — not blind Buy/Sell calls.</p>
      </section>

      <section id="first-task" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Step 2: Run Your First Agent Task</h2>
        <p className="text-muted-foreground mb-4">From x402scan you can run Syra to generate token insight reports, market condition summaries, and momentum & volatility evaluations. Typical output includes:</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {["Price trend overview", "RSI / MACD / EMA interpretation", "Support & resistance ranges", "Volatility & momentum", "Narrative + sentiment context", "AI confidence outlook"].map((item) => (
            <span key={item} className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              <CheckCircle className="h-4 w-4" />
              {item}
            </span>
          ))}
        </div>
        <p className="text-muted-foreground">The goal is to support <strong className="text-foreground">decision thinking</strong>, not automated execution.</p>
      </section>

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
        <Button variant="primary" size="lg" className="w-full sm:w-auto justify-center" asChild>
          <Link to="/docs/x402-agent/agent-catalog">
            Agent Catalog
            <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
          </Link>
        </Button>
        <Button variant="outline" className="w-full sm:w-auto justify-center" asChild>
          <Link to="/docs/welcome">Back to Welcome</Link>
        </Button>
      </div>
    </DocsLayout>
  );
}
