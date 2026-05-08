import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { DASHBOARD_COPY } from "@/lib/dashboardI18n";
import { useLanguage } from "@/lib/LanguageContext";
import { useRiseMarketsAll, useRiseMarketsTop } from "@/lib/RiseDashboardContext";
import { usePersistentState } from "@/lib/usePersistentState";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import { EmptyState, GlassCard, RISE_UPONLY_MINT, SectionHeader } from "@/components/rise/RiseShared";
import { cn } from "@/lib/utils";
import { BubbleCanvas } from "./BubbleCanvas";
import { BubbleDetailDialog, type BubbleDetailCopy } from "./BubbleDetailDialog";
import type { BubbleDatum, BubbleSizeMetric } from "./bubbleMapTypes";
import { useBubbleSimulation } from "./useBubbleSimulation";

function pinUponlyFirst(rows: RiseMarketRow[]): RiseMarketRow[] {
  const idx = rows.findIndex((r) => r.mint === RISE_UPONLY_MINT);
  if (idx <= 0) return rows;
  const row = rows[idx];
  return [row, ...rows.slice(0, idx), ...rows.slice(idx + 1)];
}

function metricValue(row: RiseMarketRow, metric: BubbleSizeMetric): number {
  if (metric === "marketCapUsd") return row.marketCapUsd ?? 0;
  if (metric === "volume24hUsd") return row.volume24hUsd ?? 0;
  return row.holders ?? 0;
}

function toBubbleDatum(r: RiseMarketRow): BubbleDatum {
  return {
    mint: r.mint,
    symbol: r.symbol,
    name: r.name,
    imageUrl: r.imageUrl,
    priceUsd: r.priceUsd,
    priceChange24hPct: r.priceChange24hPct,
    marketCapUsd: r.marketCapUsd,
    floorMarketCapUsd: r.floorMarketCapUsd,
    volume24hUsd: r.volume24hUsd,
    holders: r.holders,
    ageHours: r.ageHours,
    level: r.level,
    isVerified: r.isVerified,
  };
}

const METRICS: readonly BubbleSizeMetric[] = ["marketCapUsd", "volume24hUsd", "holders"] as const;
/** Bubble map shows at most this many markets (matches fetch size). */
const BUBBLE_MAP_MAX = 100;

type RiseBubbleMapProps = {
  onSelect: (market: RiseMarketRow) => void;
};

export function RiseBubbleMap({ onSelect }: RiseBubbleMapProps) {
  const { language } = useLanguage();
  const copy = DASHBOARD_COPY[language];
  const bm = copy.bubbleMap;
  const reduceMotion = useReducedMotion() ?? false;
  const topMarketsQuery = useRiseMarketsTop(BUBBLE_MAP_MAX, { refetchInterval: 60_000 });
  const allMarketsQuery = useRiseMarketsAll(BUBBLE_MAP_MAX, { refetchInterval: 60_000 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const [dim, setDim] = useState({ w: 0, h: 0 });
  const [metric, setMetric] = usePersistentState<BubbleSizeMetric>(
    "bubble-map-metric",
    "marketCapUsd",
    (raw): raw is BubbleSizeMetric =>
      raw === "marketCapUsd" || raw === "volume24hUsd" || raw === "holders",
  );
  const [selectedMint, setSelectedMint] = useState<string | null>(null);
  const exportSnapshotRef = useRef<(() => Promise<Blob>) | null>(null);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/`;
  }, []);
  const shareText = useMemo(() => {
    return language === "zh"
      ? "RISE 实时气泡图：查看市场热度、持有人与24h波动。"
      : "Live RISE bubble map: market heat, holders, and 24h movement.";
  }, [language]);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const w = Math.floor(r.width);
      const h = Math.floor(r.height);
      setDim((prev) => {
        const nw = w > 0 ? w : 0;
        const nh = h > 0 ? h : 0;
        if (prev.w === nw && prev.h === nh) return prev;
        return { w: nw, h: nh };
      });
    };
    measure();
    let timer = 0;
    const ro = new ResizeObserver(() => {
      if (timer) window.clearTimeout(timer);
      // 100ms debounce so dragging the resizable sidebar handle does not thrash dim->resync->repaint.
      timer = window.setTimeout(() => {
        timer = 0;
        measure();
      }, 100);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  const sourceRows = allMarketsQuery.data ?? topMarketsQuery.data ?? [];
  const rows = useMemo(() => {
    const raw = sourceRows;
    // Each tab must show top markets for that metric (not a fixed token set).
    const sorted = [...raw].sort((a, b) => metricValue(b, metric) - metricValue(a, metric));
    return sorted.slice(0, BUBBLE_MAP_MAX);
  }, [sourceRows, metric]);

  /** Stabilize datum array reference between refetches whose rows are byte-identical (no churn into useBubbleSimulation). */
  const dataSig = useMemo(
    () => rows.map((r) => `${r.mint}:${r.priceChange24hPct ?? ""}:${r.marketCapUsd ?? ""}:${r.volume24hUsd ?? ""}:${r.holders ?? ""}`).join("|"),
    [rows],
  );
  const data = useMemo(() => rows.map(toBubbleDatum), [dataSig]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedMarket = useMemo(
    () => rows.find((r) => r.mint === selectedMint) ?? null,
    [rows, selectedMint],
  );

  const { nodesRef, boundsRef, tick, beginDrag, drag, endDrag, hitTest } = useBubbleSimulation({
    data,
    metric,
    width: dim.w,
    height: dim.h,
    reduceMotion,
  });

  const detailCopy: BubbleDetailCopy = useMemo(
    () => ({
      viewToken: bm.dialogViewToken,
      subtitle: bm.dialogSubtitle,
      kpiPrice: bm.dialogKpiPrice,
      kpi24h: bm.dialogKpi24h,
      kpiMcap: bm.dialogKpiMcap,
      kpiFloorMcap: bm.dialogKpiFloorMcap,
      kpiVol24h: bm.dialogKpiVol24h,
      kpiHolders: bm.dialogKpiHolders,
      kpiAge: bm.dialogKpiAge,
    }),
    [bm],
  );

  const a11yRows = useMemo(
    () => rows.map((r) => ({ mint: r.mint, symbol: r.symbol || "—", name: r.name || r.mint })),
    [rows],
  );

  const preloadMintsKey = useMemo(() => data.map((d) => d.mint).join("|"), [data]);
  /** Omit metric so switching size tab does not reset zoom/pan (bubble positions are unchanged). */
  const bubbleMapFitKey = preloadMintsKey;

  useEffect(() => {
    if (selectedMint && !rows.some((r) => r.mint === selectedMint)) {
      setSelectedMint(null);
    }
  }, [selectedMint, rows]);

  const isError = allMarketsQuery.isError && topMarketsQuery.isError && rows.length === 0;
  const isPending = allMarketsQuery.isPending && topMarketsQuery.isPending && rows.length === 0;
  const isFetching = allMarketsQuery.isFetching || topMarketsQuery.isFetching;

  const exportCanvasBlob = async (): Promise<Blob> => {
    const exporter = exportSnapshotRef.current;
    if (exporter) {
      return await exporter();
    }
    const root = wrapRef.current;
    if (!root) throw new Error("canvas root missing");
    const canvas = root.querySelector("canvas");
    if (!(canvas instanceof HTMLCanvasElement)) throw new Error("canvas not found");
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("blob empty"));
          return;
        }
        resolve(blob);
      }, "image/png", 1);
    });
  };

  const handleDownloadMap = async () => {
    try {
      const blob = await exportCanvasBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.download = `rise-bubble-map-${Date.now()}.png`;
      a.href = url;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(bm.shareCopiedImage);
    } catch {
      toast.error(bm.shareDownloadFailed);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator === "undefined" || typeof navigator.share !== "function") return;
    try {
      const blob = await exportCanvasBlob();
      const file = new File([blob], `rise-bubble-map-${Date.now()}.png`, { type: "image/png" });
      const payload: ShareData = { title: bm.title, text: shareText, url: shareUrl };
      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        payload.files = [file];
      }
      await navigator.share(payload);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      toast.error(bm.shareNativeFailed);
    }
  };

  const handleShareOnX = () => {
    const q = new URLSearchParams({ text: `${shareText} ${shareUrl}`.trim() });
    window.open(`https://twitter.com/intent/tweet?${q.toString()}`, "_blank", "noopener,noreferrer");
  };

  const handleShareOnTelegram = () => {
    const q = new URLSearchParams({ url: shareUrl, text: shareText });
    window.open(`https://t.me/share/url?${q.toString()}`, "_blank", "noopener,noreferrer");
  };

  if (isError) {
    return (
      <GlassCard className="border-border/50">
        <SectionHeader title={bm.title} description={bm.loadError} />
        <EmptyState
          title={bm.loadError}
          description={
            (allMarketsQuery.error as Error)?.message ?? (topMarketsQuery.error as Error)?.message
          }
          action={
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                void Promise.all([allMarketsQuery.refetch(), topMarketsQuery.refetch()]);
              }}
            >
              {bm.retry}
            </Button>
          }
        />
      </GlassCard>
    );
  }

  return (
    <>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={reduceMotion ? false : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <GlassCard
          padded={false}
          className="overflow-hidden border-border/50 shadow-[0_0_0_1px_hsl(0_0%_100%/0.05)_inset,0_24px_60px_-28px_hsl(0_0%_0%/0.55)]"
        >
          <div className="border-b border-border/45 bg-gradient-to-b from-card/55 to-transparent px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <SectionHeader eyebrow={bm.eyebrow} title={bm.title} description={bm.description} />
              <div className="flex flex-col gap-2 sm:items-end">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {bm.sizeBy}
                </p>
                <div className="flex flex-wrap gap-1 rounded-xl border border-border/50 bg-background/35 p-1">
                  {METRICS.map((m) => (
                    <Button
                      key={m}
                      type="button"
                      size="sm"
                      variant={metric === m ? "secondary" : "ghost"}
                      className={cn(
                        "h-9 rounded-lg px-3 text-xs font-medium",
                        metric === m && "bg-foreground/[0.08] shadow-sm",
                      )}
                      onClick={() => setMetric(m)}
                    >
                      {m === "marketCapUsd"
                        ? bm.marketCap
                        : m === "volume24hUsd"
                          ? bm.volume24h
                          : bm.holders}
                    </Button>
                  ))}
                </div>
                <div className="flex flex-wrap justify-end gap-1">
                  {typeof navigator !== "undefined" && typeof navigator.share === "function" ? (
                    <Button type="button" size="sm" variant="secondary" className="h-8 rounded-lg px-2.5 text-[11px]" onClick={() => void handleNativeShare()}>
                      <Share2 className="mr-1 h-3.5 w-3.5" />
                      {bm.shareNative}
                    </Button>
                  ) : null}
                  <Button type="button" size="sm" variant="secondary" className="h-8 rounded-lg px-2.5 text-[11px]" onClick={() => void handleDownloadMap()}>
                    <Download className="mr-1 h-3.5 w-3.5" />
                    {bm.shareDownloadImage}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" className="h-8 rounded-lg px-2.5 text-[11px]" onClick={handleShareOnX}>
                    {bm.shareOnX}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" className="h-8 rounded-lg px-2.5 text-[11px]" onClick={handleShareOnTelegram}>
                    {bm.shareOnTelegram}
                  </Button>
                </div>
                <p className="text-[0.65rem] text-muted-foreground/90">{bm.dragHint}</p>
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-5">
            <div
              ref={wrapRef}
              className="relative aspect-[4/5] w-full min-h-[200px] min-w-0 overflow-hidden rounded-xl border border-border/40 bg-background/20 sm:aspect-video sm:min-h-[240px]"
            >
              <div
                className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-[2px] overflow-hidden bg-muted/35"
                role="status"
                aria-live="polite"
                aria-label={isFetching ? bm.refreshing : bm.liveStripLabel}
              >
                {reduceMotion ? (
                  <div
                    className={cn(
                      "h-full w-full bg-foreground/15",
                      isFetching && "animate-pulse bg-foreground/25",
                    )}
                  />
                ) : (
                  <motion.div
                    className="absolute top-0 h-full w-[32%] min-w-[56px] max-w-[140px] rounded-full bg-gradient-to-r from-transparent via-foreground/35 to-transparent"
                    initial={false}
                    animate={{ left: ["-32%", "105%"] }}
                    transition={{
                      duration: isFetching ? 0.85 : 2.6,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                )}
              </div>
              {dim.w >= 32 && dim.h >= 32 ? (
                <BubbleCanvas
                  width={dim.w}
                  height={dim.h}
                  nodesRef={nodesRef}
                  boundsRef={boundsRef}
                  tick={tick}
                  reduceMotion={reduceMotion}
                  beginDrag={beginDrag}
                  drag={drag}
                  endDrag={endDrag}
                  hitTest={hitTest}
                  onBubbleClick={(mint) => setSelectedMint(mint)}
                  a11yRows={a11yRows}
                  a11yListAriaLabel={bm.a11yListLabel}
                  a11yPickLabel={(symbol, name) => `${symbol} — ${name}`}
                  onA11yPick={(mint) => setSelectedMint(mint)}
                  preloadMintsKey={preloadMintsKey}
                  fitKey={bubbleMapFitKey}
                  zoomInAria={bm.zoomInAria}
                  zoomOutAria={bm.zoomOutAria}
                  onExportSnapshotReady={(exporter) => {
                    exportSnapshotRef.current = exporter;
                  }}
                />
              ) : (
                <div className="min-h-[200px] w-full sm:min-h-[240px]" aria-hidden />
              )}
              {isPending ? (
                <div
                  className="absolute inset-0 z-[4] flex animate-pulse items-center justify-center bg-muted/20"
                  aria-busy
                  aria-label={bm.refreshing}
                />
              ) : null}
            </div>
            <p className="mt-2 text-center text-[0.65rem] text-muted-foreground/90 sm:mt-3">{bm.zoomHint}</p>
          </div>
        </GlassCard>
      </motion.div>

      <BubbleDetailDialog
        market={selectedMarket}
        open={selectedMint !== null && selectedMarket !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedMint(null);
        }}
        onViewToken={(m) => {
          setSelectedMint(null);
          onSelect(m);
        }}
        copy={detailCopy}
      />
    </>
  );
}
