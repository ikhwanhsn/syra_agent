import { EmptyState, PanelShell } from "./shared/PanelShell";
import type { Btc3Prediction } from "@/lib/btc3/types";
import { formatConfidence, formatReturn } from "@/lib/btc3/format";

function HorizonCard({
  label,
  data,
}: {
  label: string;
  data: Btc3Prediction["horizons"]["h24"];
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-[10px] text-muted-foreground">Expected Return</p>
          <p className="font-mono font-semibold">{formatReturn(data.expectedReturn)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Downside</p>
          <p className="font-mono font-semibold">{formatReturn(data.expectedDownside)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Volatility</p>
          <p className="font-mono font-semibold">{formatReturn(data.expectedVolatility)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Confidence</p>
          <p className="font-mono font-semibold">{formatConfidence(data.confidence)}</p>
        </div>
      </div>
    </div>
  );
}

export function PredictionsPanel({ predictions }: { predictions: Btc3Prediction[] }) {
  const latest = predictions[0];

  return (
    <PanelShell
      kicker="Predictions"
      title="BTC Impact Estimates"
      description="Probabilistic expected returns across 24h, 7d, and 30d horizons."
    >
      {!latest ? (
        <EmptyState message="No predictions yet." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <HorizonCard label="24 Hours" data={latest.horizons.h24} />
          <HorizonCard label="7 Days" data={latest.horizons.d7} />
          <HorizonCard label="30 Days" data={latest.horizons.d30} />
        </div>
      )}
    </PanelShell>
  );
}
