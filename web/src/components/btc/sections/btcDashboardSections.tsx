import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatBtcCompactUsd,
  formatBtcPct,
  formatBtcUsd,
  formatBtcVolume,
  formatFundingRate,
  type BtcDashboardSections,
} from "@/lib/btcApi";
import { btcCardInset } from "@/components/btc/btcStyles";
import {
  BtcMetricTile,
  BtcSectionShell,
  BtcSparkline,
} from "@/components/btc/sections/btcSectionShared";

function accentFromPct(v: number | null | undefined): "up" | "down" | "neutral" {
  if (v == null || v === 0) return "neutral";
  return v > 0 ? "up" : "down";
}

function BarRow({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono tabular-nums">{value.toFixed(2)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted/40">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export function BtcDashboardSectionsBlock({
  sections,
  loading,
  computedAt,
}: {
  sections: BtcDashboardSections | undefined;
  loading?: boolean;
  computedAt?: string;
}) {
  const t = sections?.technicals;
  const perf = sections?.performance;
  const vol = sections?.volatility;
  const ob = sections?.orderBook;
  const funding = sections?.funding;
  const oi = sections?.openInterest;
  const ls = sections?.longShort;
  const flow = sections?.takerFlow;
  const corr = sections?.correlations;
  const fng = sections?.fearGreedHistory;
  const mkt = sections?.marketStructure;
  const news = sections?.news;
  const sent = sections?.sentiment;
  const sig = sections?.signal;
  const supply = sections?.supply;

  return (
    <>
      <BtcSectionShell
          id="section-technicals"
          kicker="Technicals"
          title="Indicator stack"
          description="RSI, MACD, EMA, and Bollinger on BTCUSDT 1h candles."
          loading={loading}
          empty={!t}
          capturedAt={computedAt}
          shareLines={
            t
              ? [
                  t.rsi != null ? `RSI (14): ${t.rsi.toFixed(1)}` : "",
                  t.macdHistogram != null ? `MACD hist: ${t.macdHistogram.toFixed(2)}` : "",
                  t.ema21 != null ? `EMA 21: ${formatBtcUsd(t.ema21, 0)}` : "",
                ].filter(Boolean)
              : undefined
          }
        >
          {t ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <BtcMetricTile label="RSI (14)" value={t.rsi != null ? t.rsi.toFixed(1) : "—"} hint={t.rsiSignal ?? undefined} />
              <BtcMetricTile
                label="MACD hist"
                value={t.macdHistogram != null ? t.macdHistogram.toFixed(2) : "—"}
                hint={t.macdSignal ?? undefined}
              />
              <BtcMetricTile label="EMA 21" value={t.ema21 != null ? formatBtcUsd(t.ema21, 0) : "—"} hint={t.emaSignal ?? undefined} />
              <BtcMetricTile
                label="Bollinger"
                value={
                  t.bollingerUpper != null && t.bollingerLower != null
                    ? `${formatBtcUsd(t.bollingerLower, 0)} – ${formatBtcUsd(t.bollingerUpper, 0)}`
                    : "—"
                }
                hint={t.bollingerSignal ?? undefined}
              />
            </div>
          ) : null}
        </BtcSectionShell>

      <BtcSectionShell
          id="section-performance"
          kicker="Performance"
          title="Multi-timeframe returns"
          loading={loading}
          empty={!perf}
          capturedAt={computedAt}
          shareLines={
            perf
              ? (["24h", "7d", "30d", "90d", "1y"] as const).map(
                  (k) => `${k.toUpperCase()}: ${formatBtcPct(perf.changes[k])}`,
                )
              : undefined
          }
        >
          {perf ? (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
              {(["24h", "7d", "30d", "90d", "1y"] as const).map((k) => {
                const v = perf.changes[k];
                return (
                  <BtcMetricTile
                    key={k}
                    label={k.toUpperCase()}
                    value={formatBtcPct(v)}
                    accent={accentFromPct(v)}
                  />
                );
              })}
            </div>
          ) : null}
        </BtcSectionShell>

      <BtcSectionShell
          id="section-volatility"
          kicker="Volatility"
          title="Range & ATR"
          loading={loading}
          empty={!vol}
          capturedAt={computedAt}
          shareLines={
            vol
              ? [
                  vol.atr14 != null ? `ATR (14): ${formatBtcUsd(vol.atr14, 0)}` : "",
                  vol.rangePositionPct != null ? `24h range: ${vol.rangePositionPct.toFixed(0)}%` : "",
                ].filter(Boolean)
              : undefined
          }
        >
          {vol ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <BtcMetricTile
                  label="ATR (14)"
                  value={vol.atr14 != null ? formatBtcUsd(vol.atr14, 0) : "—"}
                  hint={vol.atrPct != null ? `${vol.atrPct.toFixed(2)}% of price` : undefined}
                />
                <BtcMetricTile
                  label="24h range position"
                  value={vol.rangePositionPct != null ? `${vol.rangePositionPct.toFixed(0)}%` : "—"}
                  hint="Where spot sits between 24h low and high"
                />
                <BtcMetricTile
                  label="24h band"
                  value={
                    vol.low24h != null && vol.high24h != null
                      ? `${formatBtcUsd(vol.low24h, 0)} – ${formatBtcUsd(vol.high24h, 0)}`
                      : "—"
                  }
                />
              </div>
              {vol.rangePositionPct != null ? (
                <div className="relative h-2 overflow-hidden rounded-full bg-muted/40">
                  <div
                    className="absolute top-0 h-full w-2 -translate-x-1/2 rounded-full bg-[#3b82f6]"
                    style={{ left: `${vol.rangePositionPct}%` }}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </BtcSectionShell>

      <BtcSectionShell
          id="section-orderbook"
          kicker="Liquidity"
          title="Order book imbalance"
          loading={loading}
          empty={!ob}
          capturedAt={computedAt}
          shareLines={
            ob
              ? [
                  ob.imbalancePct != null ? `Imbalance: ${formatBtcPct(ob.imbalancePct)}` : "",
                  `Bids ${formatBtcCompactUsd(ob.bidNotional)} · Asks ${formatBtcCompactUsd(ob.askNotional)}`,
                ].filter(Boolean)
              : undefined
          }
        >
          {ob ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <BtcMetricTile
                  label="Bid notional (±1%)"
                  value={formatBtcCompactUsd(ob.bidNotional)}
                  accent="up"
                />
                <BtcMetricTile
                  label="Ask notional (±1%)"
                  value={formatBtcCompactUsd(ob.askNotional)}
                  accent="down"
                />
                <BtcMetricTile
                  label="Imbalance"
                  value={ob.imbalancePct != null ? formatBtcPct(ob.imbalancePct) : "—"}
                  hint={ob.spreadBps != null ? `Spread ${ob.spreadBps.toFixed(1)} bps` : undefined}
                  accent={accentFromPct(ob.imbalancePct)}
                />
              </div>
              <div className="flex h-3 overflow-hidden rounded-full">
                <div
                  className="bg-emerald-500/70"
                  style={{
                    width: `${ob.bidNotional + ob.askNotional > 0 ? (ob.bidNotional / (ob.bidNotional + ob.askNotional)) * 100 : 50}%`,
                  }}
                />
                <div className="flex-1 bg-red-500/70" />
              </div>
            </div>
          ) : null}
        </BtcSectionShell>

      <BtcSectionShell
          id="section-funding"
          kicker="Derivatives"
          title="Funding rate"
          loading={loading}
          empty={!funding}
          capturedAt={computedAt}
          shareLines={
            funding
              ? [
                  `Current: ${formatFundingRate(funding.current)}`,
                  funding.annualizedPct != null ? `Annualized est.: ${funding.annualizedPct.toFixed(2)}%` : "",
                ].filter(Boolean)
              : undefined
          }
        >
          {funding ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <BtcMetricTile label="Current" value={formatFundingRate(funding.current)} accent={accentFromPct(funding.current)} />
                <BtcMetricTile
                  label="Annualized est."
                  value={funding.annualizedPct != null ? `${funding.annualizedPct.toFixed(2)}%` : "—"}
                />
              </div>
              <BtcSparkline values={funding.series.map((p) => p.rate * 10000)} color="#a855f7" />
            </div>
          ) : null}
        </BtcSectionShell>

      <BtcSectionShell
          id="section-oi"
          kicker="Derivatives"
          title="Open interest"
          loading={loading}
          empty={!oi}
          capturedAt={computedAt}
          shareLines={
            oi
              ? [
                  oi.latestBtc != null ? `OI: ${formatBtcVolume(oi.latestBtc)} BTC` : "",
                  `24h: ${formatBtcPct(oi.change24hPct)}`,
                ].filter(Boolean)
              : undefined
          }
        >
          {oi ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <BtcMetricTile label="OI (BTC)" value={oi.latestBtc != null ? `${formatBtcVolume(oi.latestBtc)} BTC` : "—"} />
                <BtcMetricTile label="24h change" value={formatBtcPct(oi.change24hPct)} accent={accentFromPct(oi.change24hPct)} />
              </div>
              <BtcSparkline values={oi.series.map((p) => p.oiBtc)} />
            </div>
          ) : null}
        </BtcSectionShell>

      <BtcSectionShell
          id="section-longshort"
          kicker="Positioning"
          title="Long / short ratio"
          loading={loading}
          empty={!ls}
          capturedAt={computedAt}
          shareLines={ls?.latest != null ? [`Ratio: ${ls.latest.toFixed(2)} (>1 = more longs)`] : undefined}
        >
          {ls ? (
            <div className="space-y-4">
              <BtcMetricTile label="Latest ratio" value={ls.latest != null ? ls.latest.toFixed(2) : "—"} hint=">1 = more longs" />
              <BtcSparkline values={ls.series.map((p) => p.ratio)} color="#f59e0b" />
            </div>
          ) : null}
        </BtcSectionShell>

      <BtcSectionShell
          id="section-takerflow"
          kicker="Flow"
          title="Taker buy pressure (24h)"
          loading={loading}
          empty={!flow}
          capturedAt={computedAt}
          shareLines={
            flow?.buyPct24h != null ? [`Aggregate buy: ${flow.buyPct24h.toFixed(1)}%`] : undefined
          }
        >
          {flow ? (
            <div className="space-y-4">
              <BtcMetricTile
                label="Aggregate buy %"
                value={flow.buyPct24h != null ? `${flow.buyPct24h.toFixed(1)}%` : "—"}
                accent={flow.buyPct24h != null && flow.buyPct24h >= 50 ? "up" : "down"}
              />
              <div className="flex h-16 items-end gap-0.5">
                {flow.bars.map((b) => (
                  <div
                    key={b.time}
                    className="flex-1 rounded-t-sm"
                    style={{
                      height: `${Math.max(8, b.buyPct)}%`,
                      backgroundColor: b.buyPct >= 50 ? "rgba(22,163,74,0.65)" : "rgba(220,38,38,0.65)",
                    }}
                    title={`${b.buyPct.toFixed(0)}% buy`}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </BtcSectionShell>

      <BtcSectionShell
          id="section-correlation"
          kicker="Macro beta"
          title="Correlation vs majors"
          loading={loading}
          empty={!corr}
          capturedAt={computedAt}
          shareLines={corr?.pairs.slice(0, 6).map((p) => `${p.label}: ${p.correlation.toFixed(2)}`)}
        >
          {corr ? (
            <div className={cn(btcCardInset, "grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-4")}>
              {corr.pairs.map((p) => (
                <div key={p.symbol} className={btcCardInset + " px-3 py-2"}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{p.label}</span>
                    <span
                      className={cn(
                        "font-mono tabular-nums",
                        p.correlation >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
                      )}
                    >
                      {p.correlation.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </BtcSectionShell>

      <BtcSectionShell
          id="section-feargreed"
          kicker="Sentiment"
          title="Fear & Greed timeline"
          loading={loading}
          empty={!fng}
          capturedAt={computedAt}
          shareLines={
            fng?.series.length
              ? [`Latest: ${fng.series.at(-1)?.value} (${fng.series.at(-1)?.label ?? "index"})`]
              : undefined
          }
        >
          {fng ? (
            <div className={cn(btcCardInset, "p-5")}>
              <div className="flex h-20 items-end gap-1">
                {fng.series.map((p) => (
                  <div
                    key={p.time}
                    className="flex-1 rounded-t-sm"
                    style={{
                      height: `${p.value}%`,
                      backgroundColor:
                        p.value >= 55 ? "rgba(22,163,74,0.6)" : p.value <= 45 ? "rgba(220,38,38,0.6)" : "rgba(161,161,170,0.5)",
                    }}
                    title={`${p.value} ${p.label ?? ""}`}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </BtcSectionShell>

      <BtcSectionShell
          id="section-market"
          kicker="Structure"
          title="Market structure"
          loading={loading}
          empty={!mkt}
          capturedAt={computedAt}
          shareLines={
            mkt
              ? [
                  `Crypto mcap: ${formatBtcCompactUsd(mkt.totalMarketCapUsd)}`,
                  mkt.btcDominancePct != null ? `BTC dominance: ${mkt.btcDominancePct.toFixed(2)}%` : "",
                ].filter(Boolean)
              : undefined
          }
        >
          {mkt ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <BtcMetricTile label="Total crypto mcap" value={formatBtcCompactUsd(mkt.totalMarketCapUsd)} />
              <BtcMetricTile label="BTC dominance" value={mkt.btcDominancePct != null ? `${mkt.btcDominancePct.toFixed(2)}%` : "—"} />
              <BtcMetricTile label="24h crypto volume" value={formatBtcCompactUsd(mkt.totalVolumeUsd24h)} />
              <BtcMetricTile
                label="Alt season proxy"
                value={mkt.altSeasonProxy != null ? `${mkt.altSeasonProxy.toFixed(1)}%` : "—"}
                hint="100 − BTC dominance"
              />
            </div>
          ) : null}
        </BtcSectionShell>

      <BtcSectionShell
          id="section-news"
          kicker="Intelligence"
          title="BTC headlines"
          loading={loading}
          empty={!news?.items?.length}
          capturedAt={computedAt}
          shareLines={news?.items?.slice(0, 3).map((item) => item.title)}
        >
          {news?.items?.length ? (
            <div className={cn(btcCardInset, "divide-y divide-border/40")}>
              {news.items.map((item, i) => (
                <div key={`${item.title}-${i}`} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {[item.source, item.date].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                      aria-label="Open article"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </BtcSectionShell>

      <BtcSectionShell
          id="section-sentiment"
          kicker="Intelligence"
          title="News sentiment pulse"
          loading={loading}
          empty={!sent}
          capturedAt={computedAt}
          shareLines={
            sent
              ? [
                  `Bullish ${sent.positive} · Bearish ${sent.negative} · Neutral ${sent.neutral}`,
                  sent.score != null ? `Score: ${sent.score.toFixed(2)}` : "",
                ].filter(Boolean)
              : undefined
          }
        >
          {sent ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-4">
                <BtcMetricTile label="Bullish" value={String(sent.positive)} accent="up" />
                <BtcMetricTile label="Bearish" value={String(sent.negative)} accent="down" />
                <BtcMetricTile label="Neutral" value={String(sent.neutral)} />
                <BtcMetricTile label="Score" value={sent.score != null ? sent.score.toFixed(2) : "—"} />
              </div>
              <BarRow label="Positive" value={sent.positive} max={sent.total} color="#16a34a" />
              <BarRow label="Negative" value={sent.negative} max={sent.total} color="#dc2626" />
            </div>
          ) : null}
        </BtcSectionShell>

      <BtcSectionShell
          id="section-signal"
          kicker="Syra signal"
          title="BTC trading bias"
          loading={loading}
          empty={!sig}
          capturedAt={computedAt}
          shareLines={
            sig
              ? [
                  `Bias: ${sig.bias ?? "—"}`,
                  sig.confidence != null ? `Confidence: ${sig.confidence}` : "",
                  sig.reasoning ?? "",
                ].filter(Boolean)
              : undefined
          }
        >
          {sig ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-sm font-semibold">
                  {sig.bias ?? "—"}
                </span>
                {sig.confidence != null ? (
                  <span className="text-sm text-muted-foreground">Confidence {sig.confidence}%</span>
                ) : null}
                {sig.source ? <span className="text-xs text-muted-foreground">via {sig.source}</span> : null}
              </div>
              {sig.reasoning ? <p className="text-sm leading-relaxed text-muted-foreground">{sig.reasoning}</p> : null}
            </div>
          ) : null}
        </BtcSectionShell>

      <BtcSectionShell
          id="section-supply"
          kicker="Fundamentals"
          title="Supply & halving"
          loading={loading}
          empty={!supply}
          capturedAt={computedAt}
          shareLines={
            supply
              ? [
                  supply.circulating != null ? `Circulating: ${formatBtcVolume(supply.circulating)} BTC` : "",
                  supply.pctMined != null ? `Mined: ${supply.pctMined.toFixed(2)}%` : "",
                  supply.daysToHalving != null ? `Halving in ${supply.daysToHalving} days` : "",
                ].filter(Boolean)
              : undefined
          }
        >
          {supply ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <BtcMetricTile
                  label="Circulating"
                  value={supply.circulating != null ? `${formatBtcVolume(supply.circulating)} BTC` : "—"}
                />
                <BtcMetricTile label="Mined" value={supply.pctMined != null ? `${supply.pctMined.toFixed(2)}%` : "—"} />
                <BtcMetricTile
                  label="Next halving"
                  value={supply.daysToHalving != null ? `${supply.daysToHalving} days` : "—"}
                  hint={new Date(supply.nextHalvingAt).toLocaleDateString()}
                />
              </div>
              {supply.pctMined != null ? (
                <div className="h-2 overflow-hidden rounded-full bg-muted/40">
                  <div className="h-full rounded-full bg-[#F7931A]" style={{ width: `${supply.pctMined}%` }} />
                </div>
              ) : null}
            </div>
          ) : null}
        </BtcSectionShell>
    </>
  );
}
