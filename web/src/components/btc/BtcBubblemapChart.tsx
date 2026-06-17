import { useMemo, useState } from "react";
import { CardContent } from "@/components/ui/card";
import { LineChart } from "lucide-react";
import type { BtcBubblemapData, BtcExchange, BtcInterval } from "@/lib/btcApi";
import { btcCardClass, btcKickerClass, btcPillButtonClass, btcPillTrackClass } from "@/components/btc/btcStyles";
import { BtcChartControls } from "@/components/btc/BtcChartControls";
import { BtcChartShareModal } from "@/components/btc/share/BtcChartShareModal";
import { BtcShareableSection } from "@/components/btc/share/BtcShareableSection";
import { cn } from "@/lib/utils";
import {
  BTC_CHART_VARIANTS,
  exchangeLabel,
  ratioNoteFor,
  toChartRows,
  type BtcChartVariant,
} from "@/components/btc/chart/btcChartShared";
import { BtcChartVariantView } from "@/components/btc/chart/BtcChartVariantViews";

function VariantSwitcher({
  value,
  onChange,
}: {
  value: BtcChartVariant;
  onChange: (v: BtcChartVariant) => void;
}) {
  const active = BTC_CHART_VARIANTS.find((v) => v.id === value);

  return (
    <div className="flex flex-col gap-3 border-t border-border/40 bg-muted/[0.02] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{active?.label}</span>
        {active ? <span className="hidden sm:inline"> — {active.hint}</span> : null}
      </p>
      <div className={btcPillTrackClass} role="tablist" aria-label="Chart style">
        {BTC_CHART_VARIANTS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={opt.id === value}
            title={opt.hint}
            onClick={() => onChange(opt.id)}
            className={btcPillButtonClass(opt.id === value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function BtcBubblemapChart({
  data,
  exchange,
  interval,
  loading,
  onExchangeChange,
  onIntervalChange,
}: {
  data: BtcBubblemapData | undefined;
  exchange: BtcExchange;
  interval: BtcInterval;
  loading?: boolean;
  onExchangeChange: (v: BtcExchange) => void;
  onIntervalChange: (v: BtcInterval) => void;
}) {
  const [variant, setVariant] = useState<BtcChartVariant>("classic");
  const [shareOpen, setShareOpen] = useState(false);

  const rows = useMemo(() => toChartRows(data), [data]);
  const ratioNote = ratioNoteFor(data);
  const title = data
    ? `${exchangeLabel(data.exchange)} — BTC ratio bubblemap`
    : "BTC ratio bubblemap";
  const chartReady = rows.length >= 2;

  return (
    <>
      <BtcShareableSection
        id="section-bubblemap"
        kicker="Flow intelligence"
        title="Price + aggressive flow"
        description="Taker buy/sell ratio overlaid on price — green bubbles mark buy pressure, red marks sell pressure."
        shareSlug={`bubblemap-${exchange}-${interval}`}
        onShare={() => setShareOpen(true)}
        shareDisabled={!chartReady}
        empty={!chartReady && !loading}
        loading={loading}
        capturedAt={data?.computedAt}
        accent="blue"
        shareLines={
          data
            ? [
                `${exchangeLabel(data.exchange)} · ${interval}`,
                rows.at(-1)?.price != null ? `Last ${rows.at(-1)!.price.toFixed(0)}` : "",
              ].filter(Boolean)
            : undefined
        }
        bodyClassName="!p-0"
      >
        <div className={cn(btcCardClass, "overflow-hidden border-0 shadow-none")}>
          <div className="flex flex-col gap-3 border-b border-border/40 bg-muted/[0.02] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="min-w-0">
              <p className={btcKickerClass}>Active chart</p>
              <p className="mt-0.5 flex items-center gap-2 truncate font-display text-sm font-semibold tracking-tight text-foreground">
                <LineChart className="h-4 w-4 shrink-0 text-[#2563eb]" aria-hidden />
                {title}
              </p>
            </div>
            <BtcChartControls
              exchange={exchange}
              interval={interval}
              onExchangeChange={onExchangeChange}
              onIntervalChange={onIntervalChange}
            />
          </div>

          <VariantSwitcher value={variant} onChange={setVariant} />

          <CardContent className="p-0">
            {rows.length < 2 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                <div className="h-10 w-10 animate-pulse rounded-full bg-muted/40" />
                <p className="text-sm text-muted-foreground">Loading chart data…</p>
              </div>
            ) : (
              <div className="px-1 pb-4 pt-1 sm:px-2">
                <BtcChartVariantView rows={rows} ratioNote={ratioNote} variant={variant} />
              </div>
            )}
          </CardContent>
        </div>
      </BtcShareableSection>

      <BtcChartShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        data={data ?? null}
        rows={rows}
        exchange={exchange}
        interval={interval}
        variant={variant}
      />
    </>
  );
}
