import { type ReactNode, useMemo, useState } from "react";
import { BarChart3, ChevronDown, Plus, RefreshCw, Search, Sparkles, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRiseMarketsAll } from "@/lib/RiseDashboardContext";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import {
  ChangePill,
  EmptyState,
  GlassCard,
  LevelChip,
  RiseTradeButton,
  TokenAvatar,
  VerifiedBadge,
  formatPriceSmart,
  formatRelativeAge,
} from "@/components/rise/RiseShared";
import { formatInt, formatUsd } from "@/lib/marketDisplayFormat";
import { useWatchlist } from "@/lib/useWatchlist";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";

const MAX = 4;
const PICKER_ROW_HEIGHT = 44;
const PICKER_VIEWPORT_HEIGHT = 264;
const PICKER_OVERSCAN = 6;

type MetricRow = { id: string; label: string; render: (m: RiseMarketRow) => ReactNode };

function getMetrics(isZh: boolean): MetricRow[] {
  return [
    { id: "price", label: isZh ? "价格" : "Price", render: (m) => formatPriceSmart(m.priceUsd) },
    {
      id: "ch24",
      label: isZh ? "24h变化" : "24h change",
      render: (m) => <ChangePill pct={m.priceChange24hPct} />,
    },
    { id: "vol", label: isZh ? "24h成交量" : "24h volume", render: (m) => formatUsd(m.volume24hUsd, { compact: true }) },
    { id: "mcap", label: isZh ? "市值" : "Market cap", render: (m) => formatUsd(m.marketCapUsd, { compact: true }) },
    { id: "floor", label: isZh ? "底线价格" : "Floor price", render: (m) => formatPriceSmart(m.floorPriceUsd) },
    {
      id: "floorD",
      label: isZh ? "底线变化" : "Floor delta",
      render: (m) => <ChangePill pct={m.floorDeltaPct} />,
    },
    { id: "floorMc", label: isZh ? "底线市值" : "Floor market cap", render: (m) => formatUsd(m.floorMarketCapUsd, { compact: true }) },
    { id: "hold", label: isZh ? "持有人" : "Holders", render: (m) => formatInt(m.holders) },
    {
      id: "fee",
      label: isZh ? "创作者费率" : "Creator fee",
      render: (m) => (m.creatorFeePct != null ? `${m.creatorFeePct}%` : "—"),
    },
    {
      id: "lock",
      label: isZh ? "锁仓供应" : "Locked supply",
      render: (m) => (m.lockedSupplyPct != null ? `${m.lockedSupplyPct.toFixed(0)}%` : "—"),
    },
    {
      id: "lvl",
      label: isZh ? "等级" : "Level",
      render: (m) => <LevelChip level={m.level} />,
    },
    {
      id: "ver",
      label: isZh ? "已验证" : "Verified",
      render: (m) => (m.isVerified ? <span className="text-foreground/90">{isZh ? "是" : "Yes"}</span> : <span className="text-muted-foreground">—</span>),
    },
    { id: "age", label: isZh ? "时长" : "Age", render: (m) => formatRelativeAge(m.ageHours) },
  ];
}

function MarketColumnHeader({
  row,
  onRemove,
  onWatchToggle,
  watching,
  isZh,
}: {
  row: RiseMarketRow;
  onRemove: () => void;
  onWatchToggle: () => void;
  watching: boolean;
  isZh: boolean;
}) {
  return (
    <div className="flex min-w-[7.5rem] flex-col items-stretch gap-2 sm:min-w-[8.5rem]">
      <div className="flex items-center gap-2">
        <TokenAvatar imageUrl={row.imageUrl} symbol={row.symbol} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-left text-sm font-semibold text-foreground">${row.symbol}</p>
          <p className="line-clamp-1 text-left text-[0.65rem] text-muted-foreground">{row.name}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onWatchToggle}
          title={isZh ? "观察列表" : "Watchlist"}
          className="h-8 w-8 rounded-lg"
        >
          <Star className={cn("h-3.5 w-3.5", watching && "fill-current")} />
        </Button>
        <RiseTradeButton mint={row.mint} size="sm" className="shrink-0" />
        <Button type="button" size="sm" variant="ghost" onClick={onRemove} className="h-8 rounded-lg px-2 text-xs">
          {isZh ? "移除" : "Remove"}
        </Button>
      </div>
    </div>
  );
}

function MetricCell({ children, align = "right" }: { children: ReactNode; align?: "left" | "right" }) {
  return (
    <TableCell
      className={cn(
        "min-w-[6.5rem] border-border/35 py-2.5 align-middle text-[0.8125rem] tabular-nums text-foreground sm:py-3",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      {children}
    </TableCell>
  );
}

export default function ComparePage() {
  const { language } = useLanguage();
  const isZh = language === "zh";
  const [selectedMints, setSelectedMints] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerScrollTop, setPickerScrollTop] = useState(0);
  const allMarkets = useRiseMarketsAll();
  const { toggle, has } = useWatchlist();
  const marketOptions = allMarkets.data ?? [];
  const selectedMarkets = useMemo(() => {
    const lookup = new Map(marketOptions.map((row) => [row.mint, row]));
    return selectedMints.map((mint) => lookup.get(mint)).filter((row): row is RiseMarketRow => row != null);
  }, [selectedMints, marketOptions]);

  const availableToAdd = useMemo(
    () => marketOptions.filter((row) => !selectedMints.includes(row.mint)),
    [marketOptions, selectedMints],
  );
  const filteredToAdd = useMemo(() => {
    const needle = pickerQuery.trim().toLowerCase();
    if (!needle) return availableToAdd;
    return availableToAdd.filter(
      (row) => row.symbol.toLowerCase().includes(needle) || row.name.toLowerCase().includes(needle),
    );
  }, [availableToAdd, pickerQuery]);
  const startIndex = Math.max(0, Math.floor(pickerScrollTop / PICKER_ROW_HEIGHT) - PICKER_OVERSCAN);
  const visibleCount = Math.ceil(PICKER_VIEWPORT_HEIGHT / PICKER_ROW_HEIGHT) + PICKER_OVERSCAN * 2;
  const endIndex = Math.min(filteredToAdd.length, startIndex + visibleCount);
  const virtualRows = filteredToAdd.slice(startIndex, endIndex);
  const topOffset = startIndex * PICKER_ROW_HEIGHT;
  const totalHeight = filteredToAdd.length * PICKER_ROW_HEIGHT;
  const metrics = useMemo(() => getMetrics(isZh), [isZh]);

  return (
    <div className="relative flex flex-col gap-8">
      <div
        className="pointer-events-none absolute inset-x-0 -top-32 z-0 h-[26rem] bg-[radial-gradient(ellipse_70%_54%_at_50%_-8%,hsl(var(--uof)_/_0.13),transparent_56%),radial-gradient(ellipse_46%_40%_at_88%_20%,hsl(215_85%_55%/0.07),transparent_52%),radial-gradient(ellipse_40%_36%_at_10%_26%,hsl(280_70%_50%/0.06),transparent_50%)]"
        aria-hidden
      />

      <div className="relative z-[1] flex flex-col gap-8">
        <GlassCard
          className={cn(
            "border-border/50 shadow-[0_0_0_1px_hsl(0_0%_100%/0.05)_inset,0_24px_60px_-28px_hsl(0_0%_0%/0.55)]",
          )}
        >
          <div className="border-b border-border/40 bg-gradient-to-b from-card/45 to-transparent pb-5">
            <p className="inline-flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <BarChart3 className="h-3.5 w-3.5 text-foreground/45" aria-hidden />
              {isZh ? "对比集合" : "Comparison set"}
            </p>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {isZh ? "添加市场进行对比。已选代币会从选择器中隐藏。" : "Add markets to compare. Selected tokens are hidden from the picker."}
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-4">
            {allMarkets.isPending && marketOptions.length === 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-11 w-full max-w-md rounded-xl" />
                <Skeleton className="h-10 w-24 rounded-lg" />
              </div>
            ) : (
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  <Popover
                    open={pickerOpen}
                    onOpenChange={(open) => {
                      setPickerOpen(open);
                      if (!open) {
                        setPickerQuery("");
                        setPickerScrollTop(0);
                      }
                    }}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        disabled={selectedMints.length >= MAX || availableToAdd.length === 0}
                        className="h-11 min-w-[min(100%,18rem)] max-w-md justify-between rounded-xl border-border/55 bg-background/40 shadow-inner"
                      >
                        {isZh ? "添加市场进行对比" : "Add market to compare"}
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-[22rem] rounded-xl border-border/60 p-2">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={pickerQuery}
                          onChange={(e) => {
                            setPickerQuery(e.target.value);
                            setPickerScrollTop(0);
                          }}
                          placeholder={isZh ? "搜索符号或名称..." : "Search symbol or name..."}
                          className="h-9 rounded-lg border-border/55 pl-8"
                        />
                      </div>
                      <div
                        className="mt-2 overflow-y-auto rounded-lg border border-border/40 bg-background/35"
                        style={{ height: PICKER_VIEWPORT_HEIGHT }}
                        onScroll={(e) => setPickerScrollTop(e.currentTarget.scrollTop)}
                      >
                        {filteredToAdd.length === 0 ? (
                          <p className="px-3 py-6 text-center text-xs text-muted-foreground">{isZh ? "没有匹配的市场。" : "No matching markets."}</p>
                        ) : (
                          <div style={{ height: totalHeight, position: "relative" }}>
                            <div style={{ position: "absolute", top: topOffset, left: 0, right: 0 }}>
                              {virtualRows.map((row) => (
                                <button
                                  key={row.mint}
                                  type="button"
                                  className="flex h-11 w-full items-center gap-2 px-3 text-left text-sm transition-colors hover:bg-muted/50"
                                  onClick={() => {
                                    setSelectedMints((prev) => {
                                      if (prev.includes(row.mint) || prev.length >= MAX) return prev;
                                      return [...prev, row.mint];
                                    });
                                    setPickerOpen(false);
                                  }}
                                >
                                  <TokenAvatar imageUrl={row.imageUrl} symbol={row.symbol} size="xs" />
                                  <span className="min-w-0 truncate font-medium">${row.symbol}</span>
                                  <span className="min-w-0 truncate text-xs text-muted-foreground">{row.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedMints([])}
                    disabled={selectedMints.length === 0}
                    className="h-11 rounded-xl border-border/55"
                  >
                    {isZh ? "清空全部" : "Clear all"}
                  </Button>
                  {allMarkets.isFetching ? (
                    <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden />
                      {isZh ? "同步中…" : "Syncing..."}
                    </p>
                  ) : null}
                </div>
              </div>
            )}

            {selectedMints.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedMarkets.map((row) => (
                  <button
                    key={row.mint}
                    type="button"
                    onClick={() => setSelectedMints((prev) => prev.filter((m) => m !== row.mint))}
                    className="group inline-flex items-center gap-1.5 rounded-full border border-border/55 bg-muted/[0.2] py-1 pl-2.5 pr-1.5 text-xs font-medium text-foreground transition-colors hover:border-border hover:bg-muted/35"
                  >
                    <TokenAvatar imageUrl={row.imageUrl} symbol={row.symbol} size="xs" />
                    <span>${row.symbol}</span>
                    <span className="rounded-full p-0.5 text-muted-foreground transition-colors group-hover:bg-background/60 group-hover:text-foreground">
                      <X className="h-3 w-3" aria-hidden />
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </GlassCard>

        {allMarkets.isError ? (
          <GlassCard className="border-destructive/20">
            <EmptyState
              title={isZh ? "无法加载市场" : "Unable to load markets"}
              description={(allMarkets.error as Error)?.message || (isZh ? "请稍后重试。" : "Try again in a moment.")}
              action={
                <Button size="sm" variant="secondary" onClick={() => allMarkets.refetch()}>
                  {isZh ? "重试" : "Retry"}
                </Button>
              }
            />
          </GlassCard>
        ) : selectedMarkets.length === 0 ? (
          <GlassCard className="border-dashed border-border/60 bg-muted/[0.08]">
            <EmptyState
              icon={Plus}
              title={isZh ? "尚未选择市场" : "No markets selected"}
              description={isZh ? "在上方选择一个或多个代币，对比矩阵和指标表会立即显示。" : "Choose one or more tokens above-your comparison matrix and metric grid appear here instantly."}
            />
          </GlassCard>
        ) : (
          <>
            {/* Desktop matrix */}
            <GlassCard padded={false} className="hidden overflow-hidden border-border/50 lg:block">
              <div className="border-b border-border/45 bg-gradient-to-r from-card/40 via-transparent to-card/30 px-5 py-4 sm:px-6">
                <p className="inline-flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-foreground/45" aria-hidden />
                  {isZh ? "并排矩阵" : "Side-by-side matrix"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{isZh ? "按行对齐，便于快速比较。" : "Aligned rows for quick comparisons."}</p>
              </div>
              <div className="overflow-x-auto">
                <Table className="min-w-[720px] text-[0.8125rem]">
                  <TableHeader>
                    <TableRow className="border-border/40 hover:bg-transparent">
                      <TableHead className="sticky left-0 z-[2] min-w-[8rem] bg-card/95 px-4 py-3 text-left text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground shadow-[1px_0_0_0_hsl(var(--border)_/_0.45)] backdrop-blur-sm">
                        {isZh ? "指标" : "Metric"}
                      </TableHead>
                      {selectedMarkets.map((row) => (
                        <TableHead key={row.mint} className="min-w-[9rem] bg-card/80 px-3 py-3 align-top backdrop-blur-sm">
                          <MarketColumnHeader
                            row={row}
                            onRemove={() => setSelectedMints((prev) => prev.filter((m) => m !== row.mint))}
                            onWatchToggle={() => toggle(row.mint)}
                            watching={has(row.mint)}
                            isZh={isZh}
                          />
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics.map((metric) => (
                      <TableRow key={metric.id} className="border-border/30 hover:bg-muted/[0.2]">
                        <TableCell className="sticky left-0 z-[1] bg-card/95 px-4 py-2.5 text-[0.7rem] font-medium text-muted-foreground shadow-[1px_0_0_0_hsl(var(--border)_/_0.45)] backdrop-blur-sm sm:py-3 sm:text-xs">
                          {metric.label}
                        </TableCell>
                        {selectedMarkets.map((row) => (
                          <MetricCell key={`${metric.id}-${row.mint}`}>{metric.render(row)}</MetricCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </GlassCard>

            {/* Mobile / tablet cards */}
            <div className="grid gap-4 lg:hidden">
              {selectedMarkets.map((row) => (
                <GlassCard
                  key={row.mint}
                  className="overflow-hidden border-border/50 bg-gradient-to-b from-card/55 to-card/[0.2] shadow-lg shadow-black/5"
                >
                  <div className="flex items-start gap-3 border-b border-border/40 pb-4">
                    <TokenAvatar imageUrl={row.imageUrl} symbol={row.symbol} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-lg font-semibold tracking-tight text-foreground">${row.symbol}</p>
                        <VerifiedBadge verified={row.isVerified} />
                        <LevelChip level={row.level} />
                      </div>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">{row.name}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <ChangePill pct={row.priceChange24hPct} />
                        <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg" onClick={() => toggle(row.mint)}>
                          <Star className={cn("h-4 w-4", has(row.mint) && "fill-current")} />
                        </Button>
                        <RiseTradeButton mint={row.mint} />
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg"
                          onClick={() => setSelectedMints((prev) => prev.filter((m) => m !== row.mint))}
                        >
                          {isZh ? "移除" : "Remove"}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {metrics.map((metric) => (
                      <div
                        key={metric.id}
                        className="rounded-xl border border-border/40 bg-background/[0.25] px-3 py-2.5 shadow-inner"
                      >
                        <dt className="text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                          {metric.label}
                        </dt>
                        <dd className="mt-1.5 text-sm font-medium tabular-nums text-foreground">{metric.render(row)}</dd>
                      </div>
                    ))}
                  </dl>
                </GlassCard>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
