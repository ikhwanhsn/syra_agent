import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { DocPageHeader } from "@/components/docs/DocPageHeader";
import { DocSection } from "@/components/docs/DocSection";
import { Callout } from "@/components/docs/Callout";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { SYRA_AGENT_URL, SYRA_WEB_LABEL } from "@/content/syraUrls";

const tocItems = [
  { id: "what-is-syra-agent", title: "What is the Syra Agent?", level: 2 },
  { id: "what-you-need", title: "What You'll Need", level: 2 },
  { id: "key-benefits", title: "Key Benefits", level: 2 },
  { id: "free-vs-paid", title: "Free vs Paid Usage", level: 2 },
  { id: "quick-start", title: "Quick Start", level: 2 },
  { id: "next-steps", title: "Next Steps", level: 2 },
];

export default function AgentGettingStarted() {
  return (
    <DocsLayout toc={tocItems}>
      <DocPageHeader
        eyebrow="Syra Agent"
        title="Getting Started"
        description={
          <>
            Welcome to the <strong className="text-foreground">Syra Agent</strong> at{" "}
            <a href={SYRA_AGENT_URL} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              {SYRA_WEB_LABEL}
            </a>
            — research, treasury workflows, onchain tools, and agent-native payments in one chat.
          </>
        }
      />

      <DocSection id="what-is-syra-agent" title="What is the Syra Agent?" prose>
        <p>
          The Syra Agent is an AI-powered surface for <strong>operators and autonomous agents</strong> on Solana. It
          combines natural-language chat with on-demand tools: market signals, crypto news, sentiment, deep research, X
          search, memecoin screens, treasury flows, and partner integrations.
        </p>
        <p>
          Syra builds <strong>machine money infrastructure</strong> — not another generic chatbot. You remain responsible
          for keys, compliance, and execution.
        </p>
      </DocSection>

      <DocSection id="what-you-need" title="What You'll Need" prose>
        <ul>
          <li>A modern browser (Chrome, Firefox, Safari, or Edge)</li>
          <li>
            Access to{" "}
            <a href={SYRA_AGENT_URL} target="_blank" rel="noopener noreferrer">
              {SYRA_WEB_LABEL}
            </a>
          </li>
          <li>An internet connection</li>
          <li>
            (Optional) A connected wallet for paid tools — see{" "}
            <a href="#free-vs-paid">Free vs Paid Usage</a>
          </li>
        </ul>
      </DocSection>

      <DocSection id="key-benefits" title="Key Benefits" prose>
        <ul>
          <li>
            <strong>One place for everything</strong> — Signals, news, sentiment, research, and discovery in a single
            chat.
          </li>
          <li>
            <strong>Natural language</strong> — No commands to memorize; describe what you want.
          </li>
          <li>
            <strong>Pay per use</strong> — You only pay when the agent calls a paid tool.
          </li>
          <li>
            <strong>Transparent reasoning</strong> — The agent explains how it reached its conclusions.
          </li>
        </ul>
      </DocSection>

      <DocSection id="free-vs-paid" title="Free vs Paid Usage">
        <Callout variant="warning" title="Paid tools require a wallet">
          General conversation is free. When you ask for data that requires the API — signals, news, sentiment,
          research — the agent uses a paid tool. Connect a wallet with sufficient balance; the agent will prompt you
          when needed.
        </Callout>
        <p className="text-muted-foreground leading-7 mt-4">
          Prices are listed in the{" "}
          <Link to="/docs/agent/agent-catalog" className="text-primary hover:underline">
            Agent Catalog
          </Link>
          .
        </p>
      </DocSection>

      <DocSection id="quick-start" title="Quick Start" prose>
        <p>
          Open{" "}
          <a href={SYRA_AGENT_URL} target="_blank" rel="noopener noreferrer">
            {SYRA_WEB_LABEL}
          </a>
          , type a message, and hit send. Try:
        </p>
        <ul>
          <li>
            <em>&quot;What can you do?&quot;</em> — Capabilities overview
          </li>
          <li>
            <em>&quot;Signal for Bitcoin&quot;</em> — Full analysis (requires wallet)
          </li>
          <li>
            <em>&quot;Latest crypto news&quot;</em> — Recent headlines (requires wallet)
          </li>
        </ul>
        <p>
          See <Link to="/docs/agent/how-it-works">How It Works</Link> for a full walkthrough.
        </p>
      </DocSection>

      <DocSection id="next-steps" title="Next Steps" prose>
        <ul>
          <li>
            <Link to="/docs/agent/how-it-works">How It Works</Link> — Step-by-step guide
          </li>
          <li>
            <Link to="/docs/agent/features">Agent Features</Link> — Signals, news, research, and more
          </li>
          <li>
            <Link to="/docs/agent/agent-catalog">Agent Catalog</Link> — Full tool list with prices
          </li>
        </ul>
      </DocSection>

      <div className="flex flex-col sm:flex-row flex-wrap gap-3 not-prose">
        <Button variant="primary" size="lg" asChild>
          <a href={SYRA_AGENT_URL} target="_blank" rel="noopener noreferrer">
            Open Syra Agent
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link to="/docs/agent/how-it-works">Next: How It Works</Link>
        </Button>
      </div>
    </DocsLayout>
  );
}
