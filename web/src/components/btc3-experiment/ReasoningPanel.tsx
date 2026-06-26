import { Badge } from "@/components/ui/badge";
import { EmptyState, PanelShell } from "./shared/PanelShell";
import type { Btc3Reasoning } from "@/lib/btc3/types";
import { formatConfidence, formatPct } from "@/lib/btc3/format";

function FactorList({ title, items, variant }: { title: string; items: string[]; variant: "bull" | "bear" }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li
            key={i}
            className={`rounded-lg px-3 py-2 text-sm ${
              variant === "bull"
                ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                : "bg-red-500/10 text-red-800 dark:text-red-300"
            }`}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ReasoningPanel({ reasoning }: { reasoning: Btc3Reasoning | null }) {
  return (
    <PanelShell
      kicker="Reasoning"
      title="Structured Agent Reasoning"
      description="Evidence-based analysis — never plain sentiment."
    >
      {!reasoning ? (
        <EmptyState message="No reasoning generated yet. Configure OPENROUTER_API_KEY and run pipeline." />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{reasoning.status}</Badge>
            <Badge variant="outline">Horizon: {reasoning.timeHorizon}</Badge>
            <Badge variant="outline">Confidence: {formatConfidence(reasoning.confidence)}</Badge>
            <Badge variant="secondary">
              Target: {formatPct(reasoning.recommendedAllocation.btcPct)} BTC /{" "}
              {formatPct(reasoning.recommendedAllocation.usdcPct)} USDC
            </Badge>
          </div>
          <p className="text-sm leading-relaxed">{reasoning.summary}</p>
          <div className="grid gap-4 md:grid-cols-2">
            <FactorList title="Bullish Factors" items={reasoning.bullishFactors} variant="bull" />
            <FactorList title="Bearish Factors" items={reasoning.bearishFactors} variant="bear" />
          </div>
          {reasoning.historicalEvidence.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Historical Evidence
              </p>
              <ul className="space-y-2 text-sm">
                {reasoning.historicalEvidence.map((ev, i) => (
                  <li key={i} className="rounded-lg border border-border/40 px-3 py-2">
                    {ev.eventTitle} — similarity {(ev.similarityScore * 100).toFixed(0)}%, BTC{" "}
                    {(ev.btcReturn * 100).toFixed(1)}%
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </PanelShell>
  );
}
