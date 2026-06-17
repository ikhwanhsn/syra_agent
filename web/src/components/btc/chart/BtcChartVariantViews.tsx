import type { BtcChartVariant, ChartRow } from "@/components/btc/chart/btcChartShared";
import { BtcFlowChart } from "@/components/btc/chart/BtcFlowChart";
import type { ResolvedShareTheme } from "@/components/btc/share/btcChartShareTheme";

interface VariantViewProps {
  rows: ChartRow[];
  ratioNote: string;
  variant: BtcChartVariant;
  captureMode?: boolean;
  shareTheme?: ResolvedShareTheme;
}

export function BtcChartVariantView({ rows, ratioNote, variant, captureMode, shareTheme }: VariantViewProps) {
  return (
    <BtcFlowChart
      rows={rows}
      variant={variant}
      ratioNote={ratioNote}
      captureMode={captureMode}
      shareTheme={shareTheme}
      showChrome={!captureMode}
    />
  );
}
