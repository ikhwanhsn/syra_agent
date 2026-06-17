import { PumpfunPriceChart } from "@/components/chat/PumpfunPriceChart";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
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
    <section className={cn(overviewCardShell, "overflow-hidden p-0", className)}>
      <div className="border-b border-border/40 px-5 py-4 sm:px-6">
        <p className={overviewKickerClass}>Price chart</p>
        <h3 className="text-sm font-medium text-muted-foreground">
          Live USD · pump.fun · DexScreener / GeckoTerminal fallback · source: {data.market.primarySource}
        </h3>
      </div>
      <div className="px-2 pb-2 sm:px-3">
        <PumpfunPriceChart mint={data.mint} title={symbol} className="mt-0 border-0 bg-transparent shadow-none" />
      </div>
    </section>
  );
}
