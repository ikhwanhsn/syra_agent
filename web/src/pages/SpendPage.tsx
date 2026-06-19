import { Link } from "@/lib/navigation";
import { Code2, ExternalLink } from "lucide-react";
import { PillarLayout } from "@/components/pillars/PillarLayout";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Spend pillar — x402 is one module; playground is the primary catalog surface. */
export default function SpendPage() {
  return (
    <PillarLayout
      embedded
      title="Spend"
      tagline="x402 native payments"
      description="Pay-per-call machine money. x402 is the Spend module — one feature in the five-pillar stack, not the whole narrative."
      actions={
        <Button size="sm" asChild>
          <Link to="/playground">
            Open playground
            <ExternalLink className="ml-1.5 h-3.5 w-3.5" aria-hidden />
          </Link>
        </Button>
      }
    >
      <div className={cn(overviewCardShell, "p-6 space-y-4")}>
        <div className="flex items-center gap-2">
          <Code2 className="h-5 w-5 text-primary" aria-hidden />
          <h2 className="text-lg font-semibold">x402 API catalog</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Browse and test Syra x402 endpoints — news, signals, Nansen, Brain, and 100+ agent tools. Agents pay
          per call in USDC; policy caps apply via the agent wallet.
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Playground — try routes with wallet-connected x402 settlement</li>
          <li>SDK — <code className="text-xs">client.pillars.spend.call()</code></li>
          <li>MCP — tools tagged <code className="text-xs">[Spend]</code></li>
        </ul>
        <Button variant="outline" asChild>
          <Link to="/playground">Go to API playground</Link>
        </Button>
      </div>
    </PillarLayout>
  );
}
