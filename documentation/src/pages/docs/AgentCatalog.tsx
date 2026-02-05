import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { Button } from "@/components/ui/button";

export default function AgentCatalog() {
  return (
    <DocsLayout>
      <div className="mb-8">
        <div className="text-sm text-primary font-medium mb-2">x402 Agent</div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Agent Catalog</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Syra autonomous agent catalog on x402scan. Discover available agent workflows and research tasks.
        </p>
      </div>

      <div className="p-5 rounded-xl border border-border bg-card text-muted-foreground mb-8">
        <p>Syra is ranked <strong className="text-primary">#1</strong> on x402scan. Use the x402 platform to run market analysis, research synthesis, and narrative & sentiment workflows. For the full catalog and task list, see the x402scan platform.</p>
      </div>

      <Button variant="outline" asChild>
        <Link to="/docs/x402-agent/getting-started">← Getting Started</Link>
      </Button>
    </DocsLayout>
  );
}
