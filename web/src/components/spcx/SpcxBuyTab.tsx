import type { SpcxIntelligenceReport, SpreadHistoryPoint } from "@/lib/spcxApi";
import { SpcxBuySafety } from "@/components/spcx/SpcxBuySafety";
import { SpcxLivePriceChart } from "@/components/spcx/SpcxLivePriceChart";
import { SpcxSwapPanel } from "@/components/spcx/SpcxSwapPanel";

export function SpcxBuyTab({
  report,
  spreadHistory,
  refreshing,
}: {
  report: SpcxIntelligenceReport;
  spreadHistory: SpreadHistoryPoint[];
  refreshing?: boolean;
}) {
  return (
    <div className="space-y-4">
      <SpcxLivePriceChart report={report} data={spreadHistory} refreshing={refreshing} />
      <SpcxSwapPanel report={report} />
      <SpcxBuySafety report={report} />
    </div>
  );
}
