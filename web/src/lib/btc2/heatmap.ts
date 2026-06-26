import type { BtcOhlcvPoint } from "@/lib/btcQuantApi";

/** Bar-over-bar return heatmap from onchain OHLCV closes. */
export function buildHeatmapFromOhlcv(points: BtcOhlcvPoint[]): number[][] {
  if (points.length < 2) return [];

  const returns = points.slice(1).map((p, i) => {
    const prev = points[i]?.c ?? 0;
    return prev > 0 ? ((p.c - prev) / prev) * 100 : 0;
  });

  const rows = 5;
  const cols = 12;
  const grid: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      row.push(returns[idx] ?? 0);
    }
    grid.push(row);
  }
  return grid;
}
