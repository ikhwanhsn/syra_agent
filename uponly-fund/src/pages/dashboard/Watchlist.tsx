import { Bookmark, RefreshCw, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useWatchlist } from "@/lib/useWatchlist";
import { useRiseMarketsAll } from "@/lib/RiseDashboardContext";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import {
  ChangePill,
  EmptyState,
  GlassCard,
  RiseTradeButton,
  TokenAvatar,
  VerifiedBadge,
  formatPriceSmart,
  shortenMint,
} from "@/components/rise/RiseShared";
import { MarketSparkline } from "@/components/rise/MarketSparkline";
import { formatInt, formatUsd } from "@/lib/marketDisplayFormat";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";

function StatMini({
  label,
  value,
  hint,
  gradientClass,
}: {
  label: string;
  value: string;
  hint: string;
  gradientClass: string;
}) {
  return (
    <div
      className={cn(
        "relative min-w-0 overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br p-[1.125rem] shadow-[0_1px_0_0_hsl(0_0%_100%/0.05)_inset,0_18px_44px_-22px_hsl(0_0%_0%/0.45)] transition-[transform,box-shadow] duration-300",
        "from-card/90 via-card/45 to-card/25 hover:-translate-y-px hover:border-border/65",
        gradientClass,
      )}
    >
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold tabular-nums tracking-[-0.02em] text-foreground sm:text-[1.35rem]">
        {value}
      </p>
      <p className="mt-1.5 text-[0.76rem] leading-snug text-muted-foreground sm:text-xs">{hint}</p>
    </div>
  );
}

export default function WatchlistPage() {
  const { language } = useLanguage();
  const isZh = language === "zh";
  const { items, remove, clear } = useWatchlist();
  const markets = useRiseMarketsAll();
  const byMint = new Map((markets.data ?? []).map((row) => [row.mint, row]));
  const rows = items.map((mint) => byMint.get(mint)).filter((row): row is RiseMarketRow => row != null);
  const orphanMints = items.filter((mint) => !byMint.has(mint));

  const totalPinned = items.length;
  const resolved = rows.length;

  return (
    <div className="relative flex flex-col gap-8">
      <div
        className="pointer-events-none absolute inset-x-0 -top-32 z-0 h-[26rem] bg-[radial-gradient(ellipse_68%_54%_at_50%_-8%,hsl(var(--uof)_/_0.13),transparent_56%),radial-gradient(ellipse_44%_40%_at_86%_22%,hsl(215_85%_55%/0.07),transparent_52%),radial-gradient(ellipse_38%_34%_at_12%_28%,hsl(280_70%_50%/0.06),transparent_50%)]"
        aria-hidden
      />

      <div className="relative z-[1] flex flex-col gap-8">
        {!markets.isError && !markets.isPending && items.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <StatMini
              label="Pinned"
              value={formatInt(totalPinned)}
              hint={isZh ? "保存在当前浏览器。" : "Saved in this browser."}
              gradientClass="from-amber-500/18 to-orange-900/10"
            />
            <StatMini
              label="Resolved"
              value={formatInt(resolved)}
              hint={isZh ? "已匹配实时市场。" : "Matched to live markets."}
              gradientClass="from-emerald-500/22 to-teal-900/10"
            />
            <StatMini
              label="Awaiting feed"
              value={orphanMints.length === 0 ? "None" : formatInt(orphanMints.length)}
              hint={
                orphanMints.length === 0
                  ? (isZh ? "全部已同步。" : "All pins synced.")
                  : (isZh ? "当前快照中不存在。" : "Not in current snapshot.")
              }
              gradientClass="from-violet-500/20 to-fuchsia-900/10"
            />
          </div>
        ) : null}

        <GlassCard
          padded={false}
          className="overflow-hidden border-border/50 shadow-[0_0_0_1px_hsl(0_0%_100%/0.05)_inset,0_24px_60px_-28px_hsl(0_0%_0%/0.55)]"
        >
          <div className="border-b border-border/45 bg-gradient-to-b from-card/50 to-transparent px-4 py-4 sm:px-6 sm:py-5">
            <p className="inline-flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <Bookmark className="h-3.5 w-3.5 text-foreground/45" aria-hidden />
              {isZh ? "已保存市场" : "Saved markets"}
            </p>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {isZh ? "你保存市场的实时行数据。" : "Live rows for your saved markets."}
            </p>
          </div>

          <div className="px-4 pb-4 pt-3 sm:px-6">
            {orphanMints.length > 0 && !markets.isPending ? (
              <div className="mb-4 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2.5 text-[0.78rem] text-amber-100/95 sm:text-xs">
                <span className="font-medium text-foreground">{isZh ? "部分收藏不在当前数据快照中。" : "Some pins are not in this feed snapshot."}</span>{" "}
                {orphanMints.slice(0, 3).map((m) => (
                  <code key={m} className="mr-1 rounded bg-background/30 px-1 py-0.5 font-mono text-[0.65rem]">
                    {shortenMint(m, 4, 4)}
                  </code>
                ))}
                {orphanMints.length > 3 ? <span className="text-muted-foreground">+{orphanMints.length - 3} {isZh ? "更多" : "more"}</span> : null}
              </div>
            ) : null}

            {markets.isError ? (
              <div className="py-6 sm:py-8">
                <EmptyState
                  icon={Star}
                  title={isZh ? "无法加载观察列表数据" : "Could not load watchlist data"}
                  description={(markets.error as Error)?.message || (isZh ? "请尝试刷新市场数据流。" : "Try refreshing the market feed.")}
                  action={
                    <Button size="sm" variant="secondary" onClick={() => markets.refetch()}>
                      {isZh ? "重试" : "Retry"}
                    </Button>
                  }
                />
              </div>
            ) : markets.isPending ? (
              <div className="flex flex-col gap-2 py-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 rounded-xl border border-border/35 bg-background/20 px-3 py-3">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                    <div className="flex flex-1 flex-col gap-2">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-48 max-w-full" />
                    </div>
                    <Skeleton className="hidden h-8 w-20 sm:block" />
                  </div>
                ))}
              </div>
            ) : rows.length === 0 && items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/55 bg-muted/[0.06] py-12 sm:py-14">
                <EmptyState
                  icon={Star}
                  title={isZh ? "你的观察列表为空" : "Your watchlist is empty"}
                  description={isZh ? "可在筛选器、底线扫描或对比中收藏代币。" : "Star tokens from Screener, Floor Scanner, or Compare."}
                />
              </div>
            ) : rows.length === 0 && items.length > 0 ? (
              <div className="rounded-xl border border-dashed border-border/55 bg-muted/[0.06] py-12 sm:py-14">
                <EmptyState
                  icon={Star}
                  title={isZh ? "暂无可解析市场" : "No markets resolved yet"}
                  description={isZh ? "已保存代币不在当前数据快照中。" : "Saved tokens are not in the current feed snapshot."}
                  action={
                    <Button size="sm" variant="secondary" onClick={() => markets.refetch()}>
                      {isZh ? "刷新数据流" : "Refresh feed"}
                    </Button>
                  }
                />
              </div>
            ) : (
              <>
                {/* Desktop */}
                <div className="hidden md:block">
                  <Table className="text-[0.8125rem] tabular-nums">
                    <TableHeader>
                      <TableRow className="border-border/40 bg-muted/[0.12] hover:bg-transparent">
                        <TableHead className="h-11 min-w-[12rem] px-4 text-left text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          {isZh ? "资产" : "Asset"}
                        </TableHead>
                        <TableHead className="h-11 px-3 text-right text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          {isZh ? "价格" : "Price"}
                        </TableHead>
                        <TableHead className="h-11 px-3 text-right text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          24h Δ
                        </TableHead>
                        <TableHead className="h-11 min-w-[7rem] px-3 text-left text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          {isZh ? "走势" : "Trend"}
                        </TableHead>
                        <TableHead className="h-11 px-3 text-right text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          MCap
                        </TableHead>
                        <TableHead className="h-11 px-3 text-right text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          {isZh ? "底线Δ" : "Floor Δ"}
                        </TableHead>
                        <TableHead className="h-11 px-3 text-right text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          24h vol
                        </TableHead>
                        <TableHead className="h-11 px-4 text-right text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          {isZh ? "操作" : "Actions"}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow
                          key={row.mint}
                          className="group border-border/30 transition-colors hover:bg-muted/[0.35]"
                        >
                          <TableCell className="border-l-2 border-l-transparent px-4 py-3 transition-colors group-hover:border-l-uof/50">
                            <div className="flex min-w-0 items-center gap-3">
                              <TokenAvatar imageUrl={row.imageUrl} symbol={row.symbol} size="sm" />
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="font-semibold text-foreground">${row.symbol || "—"}</span>
                                  <VerifiedBadge verified={row.isVerified} />
                                </div>
                                <p className="truncate text-[0.7rem] text-muted-foreground">{row.name}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-3 py-3 text-right font-medium text-foreground">
                            {formatPriceSmart(row.priceUsd)}
                          </TableCell>
                          <TableCell className="px-3 py-3 text-right">
                            <ChangePill pct={row.priceChange24hPct} />
                          </TableCell>
                          <TableCell className="px-3 py-3 text-left">
                            <MarketSparkline
                              address={row.marketAddress || row.mint}
                              changePct={row.priceChange24hPct}
                              width={88}
                              height={26}
                            />
                          </TableCell>
                          <TableCell className="px-3 py-3 text-right text-foreground">
                            {formatUsd(row.marketCapUsd, { compact: true })}
                          </TableCell>
                          <TableCell className="px-3 py-3 text-right">
                            <ChangePill pct={row.floorDeltaPct} />
                          </TableCell>
                          <TableCell className="px-3 py-3 text-right text-foreground">
                            {formatUsd(row.volume24hUsd, { compact: true })}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right">
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <RiseTradeButton mint={row.mint} />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 rounded-lg px-2 text-xs"
                                onClick={() => remove(row.mint)}
                              >
                                {isZh ? "移除" : "Remove"}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile */}
                <ul className="flex flex-col gap-3 md:hidden">
                  {rows.map((row) => (
                    <li key={row.mint}>
                      <div className="overflow-hidden rounded-2xl border border-border/45 bg-gradient-to-b from-card/50 to-card/[0.15] p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                          <TokenAvatar imageUrl={row.imageUrl} symbol={row.symbol} size="md" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-display text-lg font-semibold tracking-tight text-foreground">
                                ${row.symbol || "—"}
                              </p>
                              <VerifiedBadge verified={row.isVerified} />
                            </div>
                            <p className="truncate text-sm text-muted-foreground">{row.name}</p>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <ChangePill pct={row.priceChange24hPct} />
                              <RiseTradeButton mint={row.mint} />
                              <Button size="sm" variant="outline" className="rounded-lg" onClick={() => remove(row.mint)}>
                                {isZh ? "移除" : "Remove"}
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-end">
                          <MarketSparkline
                            address={row.marketAddress || row.mint}
                            changePct={row.priceChange24hPct}
                            width={140}
                            height={30}
                            showVerdict
                          />
                        </div>
                        <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-border/35 pt-4 text-[0.68rem] sm:grid-cols-4">
                          <div className="rounded-xl border border-border/40 bg-background/[0.25] px-2.5 py-2">
                            <dt className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                              {isZh ? "价格" : "Price"}
                            </dt>
                            <dd className="mt-1 font-semibold tabular-nums text-foreground">{formatPriceSmart(row.priceUsd)}</dd>
                          </div>
                          <div className="rounded-xl border border-border/40 bg-background/[0.25] px-2.5 py-2">
                            <dt className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                              {isZh ? "市值" : "MCap"}
                            </dt>
                            <dd className="mt-1 font-semibold tabular-nums text-foreground">
                              {formatUsd(row.marketCapUsd, { compact: true })}
                            </dd>
                          </div>
                          <div className="rounded-xl border border-border/40 bg-background/[0.25] px-2.5 py-2">
                            <dt className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                              {isZh ? "底线Δ" : "Floor Δ"}
                            </dt>
                            <dd className="mt-1">
                              <ChangePill pct={row.floorDeltaPct} />
                            </dd>
                          </div>
                          <div className="rounded-xl border border-border/40 bg-background/[0.25] px-2.5 py-2">
                            <dt className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                              {isZh ? "24h量" : "24h vol"}
                            </dt>
                            <dd className="mt-1 font-semibold tabular-nums text-foreground">
                              {formatUsd(row.volume24hUsd, { compact: true })}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {rows.length > 0 ? (
            <div className="flex items-center justify-between border-t border-border/45 bg-muted/[0.12] px-4 py-3 text-[0.7rem] text-muted-foreground sm:px-6 sm:text-xs">
              <p className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-foreground/40" aria-hidden />
                <span>
                  {isZh ? "显示" : "Showing"} <strong className="font-medium text-foreground">{formatInt(rows.length)}</strong> {isZh ? "条已解析" : "resolved"}
                  {items.length !== rows.length ? (
                    <span className="text-muted-foreground/85">
                      {" "}
                      · {formatInt(items.length)} {isZh ? "条已收藏" : "pinned total"}
                    </span>
                  ) : null}
                </span>
              </p>
              {markets.isFetching ? (
                <span className="inline-flex items-center gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  {isZh ? "刷新中…" : "Refreshing..."}
                </span>
              ) : (
                <span className="text-muted-foreground/85">{isZh ? "已是最新" : "Up to date"}</span>
              )}
            </div>
          ) : null}
        </GlassCard>
      </div>
    </div>
  );
}
