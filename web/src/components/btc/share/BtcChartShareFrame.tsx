import { forwardRef } from "react";
import { Bitcoin, TrendingUp } from "lucide-react";
import { formatBtcUsd } from "@/lib/btcApi";
import {
  BTC_CHART_VARIANTS,
  exchangeLabel,
  ratioNoteFor,
  type BtcChartVariant,
  type ChartRow,
} from "@/components/btc/chart/btcChartShared";
import { BtcChartVariantView } from "@/components/btc/chart/BtcChartVariantViews";
import type { BtcBubblemapData, BtcExchange, BtcInterval } from "@/lib/btcApi";
import { BTC_CHART_SHARE_WIDTH } from "@/components/btc/share/btcChartShareExport";
import type { ResolvedShareTheme } from "@/components/btc/share/btcChartShareTheme";
import { cn } from "@/lib/utils";

export interface BtcChartShareFrameProps {
  data: BtcBubblemapData;
  exchange: BtcExchange;
  interval: BtcInterval;
  variant: BtcChartVariant;
  rows: ChartRow[];
  shareTheme: ResolvedShareTheme;
  className?: string;
}

export const BtcChartShareFrame = forwardRef<HTMLDivElement, BtcChartShareFrameProps>(
  function BtcChartShareFrame({ data, exchange, interval, variant, rows, shareTheme, className }, ref) {
    const title = `${exchangeLabel(data.exchange)} — BTC Price with Ratio Bubblemap`;
    const ratioNote = ratioNoteFor(data);
    const variantMeta = BTC_CHART_VARIANTS.find((v) => v.id === variant);
    const lastPrice = rows.at(-1)?.price ?? null;
    const capturedAt = new Date(data.computedAt).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const t = shareTheme.frame;

    return (
      <div
        ref={ref}
        className={cn("btc-chart-share-frame overflow-hidden", className)}
        style={{
          width: BTC_CHART_SHARE_WIDTH,
          background: t.backgroundCss,
          color: t.textPrimary,
        }}
        data-export-bg={shareTheme.exportBackground}
      >
        <div className="border-b px-8 py-6" style={{ borderColor: t.border }}>
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-2.5">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl border"
                  style={{ borderColor: t.iconBorder, backgroundColor: t.iconBg, color: t.accent }}
                >
                  <Bitcoin className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: t.textFaint }}>
                    Syra · Bitcoin intelligence
                  </p>
                  <p className="text-sm font-medium" style={{ color: t.textMuted }}>
                    Ratio bubblemap
                  </p>
                </div>
              </div>
              <h2
                className="flex items-center gap-2 font-display text-2xl font-semibold tracking-tight"
                style={{ color: t.textPrimary }}
              >
                <TrendingUp className="h-5 w-5" style={{ color: t.chartIcon }} aria-hidden />
                {title}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed" style={{ color: t.textMuted }}>
                {ratioNote}
              </p>
            </div>
            {lastPrice != null ? (
              <div
                className="shrink-0 rounded-2xl border px-5 py-4 text-right"
                style={{ borderColor: t.spotCardBorder, backgroundColor: t.spotCardBg }}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: t.textFaint }}>
                  Spot
                </p>
                <p
                  className="mt-1 font-mono text-3xl font-semibold tabular-nums"
                  style={{ color: t.textPrimary }}
                >
                  {formatBtcUsd(lastPrice, 0)}
                </p>
              </div>
            ) : null}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              exchangeLabel(exchange),
              interval,
              variantMeta?.label ?? variant,
              data.ratioSource === "taker" ? "Taker ratio" : "Proxy ratio",
            ].map((chip) => (
              <span
                key={chip}
                className="rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-wide"
                style={{
                  borderColor: t.chipBorder,
                  backgroundColor: t.chipBg,
                  color: t.chipText,
                }}
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        <div className="btc-chart-share-canvas px-6 py-5">
          <BtcChartVariantView
            rows={rows}
            ratioNote={ratioNote}
            variant={variant}
            captureMode
            shareTheme={shareTheme}
          />
        </div>

        <div
          className="flex items-center justify-between border-t px-8 py-4"
          style={{ borderColor: t.border }}
        >
          <p className="font-mono text-[11px]" style={{ color: t.textFaint }}>
            Green: ratio ≥ 1 · Red: ratio &lt; 1 · Larger bubbles = more extreme flow
          </p>
          <div className="text-right">
            <p className="font-mono text-xs font-medium" style={{ color: t.accentSoft }}>
              syraa.fun/btc
            </p>
            <p className="mt-0.5 font-mono text-[10px]" style={{ color: t.textFaint }}>
              {capturedAt}
            </p>
          </div>
        </div>
      </div>
    );
  },
);
