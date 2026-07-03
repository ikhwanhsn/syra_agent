import { PumpfunPriceChart } from "@/components/chat/PumpfunPriceChart";
import type { MemecoinAnalysisPayload } from "@/lib/pumpfunAnalysisApi";
import { cn } from "@/lib/utils";

export interface PumpfunChartPanelProps {
  data: MemecoinAnalysisPayload;
  className?: string;
}

export function PumpfunChartPanel({ data, className }: PumpfunChartPanelProps) {
  const pumpfun = data.pumpfun.ok ? data.pumpfun.data : null;
  const symbol = pumpfun?.symbol ?? data.mint.slice(0, 6);

  return (
    <section className={cn(className)}>
      <PumpfunPriceChart
        mint={data.mint}
        title={symbol}
        variant="terminal"
        source={data.market.primarySource}
        className="mt-0"
      />
    </section>
  );
}
