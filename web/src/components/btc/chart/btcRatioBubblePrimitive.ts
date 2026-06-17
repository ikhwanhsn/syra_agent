import type {
  IChartApiBase,
  ISeriesApi,
  ISeriesPrimitive,
  IPrimitivePaneRenderer,
  IPrimitivePaneView,
  SeriesAttachedParameter,
  Time,
  UTCTimestamp,
} from "lightweight-charts";
import type { CanvasRenderingTarget2D } from "fancy-canvas";
import { RATIO_GTE, RATIO_LT, type ChartRow } from "@/components/btc/chart/btcChartShared";

export interface RatioBubblePoint {
  time: UTCTimestamp;
  price: number;
  ratio: number;
  extremePercentile: number;
}

function bubbleRadius(pct: number, minR: number, maxR: number): number {
  return minR + (pct / 100) * (maxR - minR);
}

class RatioBubbleRenderer implements IPrimitivePaneRenderer {
  constructor(
    private readonly _points: RatioBubblePoint[],
    private readonly _series: ISeriesApi<"Area" | "Line", Time>,
    private readonly _chart: IChartApiBase<Time>,
    private readonly _minR: number,
    private readonly _maxR: number,
  ) {}

  draw(target: CanvasRenderingTarget2D): void {
    const timeScale = this._chart.timeScale();
    target.useBitmapCoordinateSpace((scope) => {
      const ctx = scope.context;
      const hRatio = scope.horizontalPixelRatio;
      const vRatio = scope.verticalPixelRatio;

      for (const point of this._points) {
        const x = timeScale.timeToCoordinate(point.time);
        const y = this._series.priceToCoordinate(point.price);
        if (x === null || y === null) continue;

        const r = bubbleRadius(point.extremePercentile, this._minR, this._maxR);
        const px = x * hRatio;
        const py = y * vRatio;
        const pr = r * Math.min(hRatio, vRatio);
        const color = point.ratio >= 1 ? RATIO_GTE : RATIO_LT;
        const alpha = 0.28 + (point.extremePercentile / 100) * 0.62;

        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.globalAlpha = Math.min(alpha + 0.2, 1);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.25 * Math.min(hRatio, vRatio);
        ctx.stroke();
        ctx.restore();
      }
    });
  }
}

class RatioBubblePaneView implements IPrimitivePaneView {
  constructor(private readonly _primitive: RatioBubblePrimitive) {}

  zOrder(): "top" {
    return "top";
  }

  renderer(): IPrimitivePaneRenderer | null {
    const { points, series, chart, minR, maxR } = this._primitive._state();
    if (!series || !chart || points.length === 0) return null;
    return new RatioBubbleRenderer(points, series, chart, minR, maxR);
  }
}

export class RatioBubblePrimitive implements ISeriesPrimitive<Time> {
  private _points: RatioBubblePoint[] = [];
  private _series: ISeriesApi<"Area" | "Line", Time> | null = null;
  private _chart: IChartApiBase<Time> | null = null;
  private _requestUpdate: (() => void) | null = null;
  private _minR = 5;
  private _maxR = 18;
  private readonly _paneView = new RatioBubblePaneView(this);

  _state() {
    return {
      points: this._points,
      series: this._series,
      chart: this._chart,
      minR: this._minR,
      maxR: this._maxR,
    };
  }

  attached(param: SeriesAttachedParameter<Time>): void {
    this._series = param.series as ISeriesApi<"Area" | "Line", Time>;
    this._chart = param.chart;
    this._requestUpdate = param.requestUpdate;
  }

  detached(): void {
    this._series = null;
    this._chart = null;
    this._requestUpdate = null;
  }

  paneViews(): readonly IPrimitivePaneView[] {
    return [this._paneView];
  }

  setPoints(points: RatioBubblePoint[]): void {
    this._points = points;
    this._requestUpdate?.();
  }

  setBubbleSize(minR: number, maxR: number): void {
    this._minR = minR;
    this._maxR = maxR;
    this._requestUpdate?.();
  }
}

export function chartRowsToBubblePoints(rows: ChartRow[]): RatioBubblePoint[] {
  const seen = new Set<number>();
  const out: RatioBubblePoint[] = [];
  for (const row of rows) {
    const sec = Math.floor(row.time / 1000);
    if (seen.has(sec)) continue;
    seen.add(sec);
    out.push({
      time: sec as UTCTimestamp,
      price: row.price,
      ratio: row.ratio,
      extremePercentile: row.extremePercentile,
    });
  }
  return out;
}
