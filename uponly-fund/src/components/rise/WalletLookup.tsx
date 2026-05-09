/**
 * Wallet lookup — drop in any Solana wallet and see its RISE portfolio
 * (summary + positions). URL-syncs `?wallet=…` so the result is shareable.
 */
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Briefcase, ExternalLink, Loader2, Search, Sparkles, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRisePortfolioPositions, useRisePortfolioSummary } from "@/lib/RiseDashboardContext";
import { buildRiseTradeUrl, buildSolscanAccountUrl } from "@/lib/riseDashboardApi";
import type { RisePortfolioPosition } from "@/lib/riseDashboardTypes";
import { formatInt, formatUsd } from "@/lib/marketDisplayFormat";
import { cn } from "@/lib/utils";
import { buildPaginationItems } from "@/lib/pagination";
import {
  ChangePill,
  EmptyState,
  GlassCard,
  RiseTradeButton,
  StatTile,
  TokenAvatar,
  formatPriceSmart,
  shortenMint,
} from "./RiseShared";
import { useLanguage } from "@/lib/LanguageContext";

const ADDR_MIN = 32;
const ADDR_MAX = 50;
const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 50, 100] as const;

function isValidAddress(addr: string): boolean {
  return addr.length >= ADDR_MIN && addr.length <= ADDR_MAX && /^[a-zA-Z0-9]+$/.test(addr);
}

function PositionCard({ p }: { p: RisePortfolioPosition }) {
  const url = buildRiseTradeUrl(p.mint);
  return (
    <div className="overflow-hidden rounded-2xl border border-border/45 bg-gradient-to-b from-card/50 to-card/[0.15] p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <TokenAvatar imageUrl={p.imageUrl} symbol={p.symbol ?? "—"} size="md" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-semibold tracking-tight text-foreground">${p.symbol || "—"}</p>
          <p className="truncate text-sm text-muted-foreground">{p.name || shortenMint(p.mint)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {url ? <RiseTradeButton mint={p.mint} /> : null}
          </div>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-border/35 pt-4 text-[0.68rem]">
        <div className="rounded-xl border border-border/40 bg-background/[0.25] px-2.5 py-2">
          <dt className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Balance</dt>
          <dd className="mt-1 font-semibold tabular-nums text-foreground">{formatInt(p.balance)}</dd>
        </div>
        <div className="rounded-xl border border-border/40 bg-background/[0.25] px-2.5 py-2">
          <dt className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">USD value</dt>
          <dd className="mt-1 font-semibold tabular-nums text-foreground">{formatUsd(p.balanceUsd, { compact: true })}</dd>
        </div>
        <div className="rounded-xl border border-border/40 bg-background/[0.25] px-2.5 py-2">
          <dt className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Avg entry</dt>
          <dd className="mt-1 tabular-nums text-foreground">{formatPriceSmart(p.avgEntryUsd)}</dd>
        </div>
        <div className="rounded-xl border border-border/40 bg-background/[0.25] px-2.5 py-2">
          <dt className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">P&amp;L</dt>
          <dd className="mt-1 flex flex-wrap items-center justify-end gap-1.5 sm:justify-start">
            <span
              className={cn(
                "font-semibold tabular-nums",
                typeof p.pnlUsd === "number" && p.pnlUsd > 0 && "text-success",
                typeof p.pnlUsd === "number" && p.pnlUsd < 0 && "text-destructive",
              )}
            >
              {formatUsd(p.pnlUsd, { compact: true })}
            </span>
            <ChangePill pct={p.pnlPct ?? null} />
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function WalletLookup() {
  const { language } = useLanguage();
  const isZh = language === "zh";
  const [searchParams, setSearchParams] = useSearchParams();
  const walletFromUrl = searchParams.get("wallet") || "";
  const initial = walletFromUrl;
  const [input, setInput] = useState(initial);
  const [submitted, setSubmitted] = useState<string | null>(initial && isValidAddress(initial) ? initial : null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    setSubmitted(isValidAddress(walletFromUrl) ? walletFromUrl : null);
    setInput(walletFromUrl);
  }, [walletFromUrl]);
  useEffect(() => {
    setPage(1);
  }, [submitted, rowsPerPage]);

  const summary = useRisePortfolioSummary(submitted);
  const positions = useRisePortfolioPositions(submitted, page, rowsPerPage);
  const totalPositionPages = useMemo(() => {
    const total = positions.data?.total ?? 0;
    return Math.max(1, Math.ceil(total / rowsPerPage));
  }, [positions.data?.total, rowsPerPage]);

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPositionPages));
  }, [totalPositionPages]);

  const pageItems = useMemo(() => buildPaginationItems(page, totalPositionPages), [page, totalPositionPages]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!isValidAddress(trimmed)) {
      setSubmitted(null);
      return;
    }
    setSubmitted(trimmed);
    const next = new URLSearchParams(searchParams);
    next.set("wallet", trimmed);
    setSearchParams(next, { replace: true });
  };

  const onClear = () => {
    setInput("");
    setSubmitted(null);
    const next = new URLSearchParams(searchParams);
    next.delete("wallet");
    setSearchParams(next, { replace: true });
  };

  const inputInvalid = input.length > 0 && !isValidAddress(input);
  const sumData = summary.data?.summary;
  const isError = summary.isError || positions.isError;
  const errMsg = (summary.error as Error)?.message || (positions.error as Error)?.message || "";

  const solscanUrl = submitted ? buildSolscanAccountUrl(submitted) : null;

  return (
    <section aria-labelledby="rise-wallet-heading">
      <h2 id="rise-wallet-heading" className="sr-only">
        {isZh ? "Solana 钱包资产查询" : "Solana wallet portfolio lookup"}
      </h2>

      <GlassCard
        padded={false}
        className="overflow-visible border-border/50 shadow-[0_0_0_1px_hsl(0_0%_100%/0.05)_inset,0_24px_60px_-28px_hsl(0_0%_0%/0.55)]"
      >
        <div className="border-b border-border/45 bg-gradient-to-b from-card/55 to-transparent px-4 py-5 sm:px-6">
          <p className="inline-flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-foreground/45" aria-hidden />
            {isZh ? "资产探针" : "Portfolio probe"}
          </p>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {isZh ? "提交后会同步 " : "Submitting syncs "}
            <code className="rounded bg-muted/50 px-1 py-0.5 font-mono text-[0.7rem]">?wallet=…</code>
            {isZh
              ? "，可收藏或分享只读快照。仅粘贴地址即可，无需连接钱包。"
              : " so you can bookmark or share a read-only snapshot. Paste-only-no wallet connection required."}
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-3 border-b border-border/40 px-4 py-4 sm:flex-row sm:items-stretch sm:gap-3 sm:px-6"
        >
          <div className="relative min-w-0 flex-1">
            <Wallet className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/90" aria-hidden />
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isZh ? "Solana 地址（base58，32-44 位）" : "Solana address (base58, 32-44 chars)"}
              className={cn(
                "h-11 rounded-xl border-border/55 bg-background/40 pl-10 pr-10 font-mono text-sm shadow-inner sm:text-sm",
                inputInvalid && "border-destructive/50",
              )}
              aria-invalid={inputInvalid}
              aria-label={isZh ? "Solana 钱包地址" : "Solana wallet address"}
              spellCheck={false}
            />
            {input ? (
              <button
                type="button"
                onClick={onClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                aria-label={isZh ? "清空钱包地址" : "Clear wallet"}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
          <Button type="submit" disabled={!isValidAddress(input.trim())} className="h-11 shrink-0 gap-2 rounded-xl px-5">
            <Search className="h-3.5 w-3.5" aria-hidden />
            {isZh ? "查询" : "Look up"}
          </Button>
        </form>

        <div className="px-4 py-5 sm:px-6">
          {!submitted ? (
            <div className="rounded-xl border border-dashed border-border/55 bg-muted/[0.06] py-12 sm:py-14">
              <EmptyState
                icon={Briefcase}
                title={isZh ? "输入钱包开始查看" : "Enter a wallet to inspect"}
                description={
                  isZh
                    ? "我们将从资产 API 加载总览与 RISE 持仓信息，不会签名或广播交易。"
                    : "We'll load aggregate totals and open RISE positions from the portfolio APIs-nothing is signed or broadcast."
                }
              />
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-destructive/25 bg-destructive/[0.04] py-8">
              <EmptyState
                icon={Briefcase}
                title={isZh ? "查询失败" : "Lookup failed"}
                description={errMsg || (isZh ? "RISE 资产接口未返回该钱包结果。" : "RISE portfolio API did not return a result for this wallet.")}
                action={
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      summary.refetch();
                      positions.refetch();
                    }}
                  >
                    {isZh ? "重试" : "Retry"}
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3 rounded-2xl border border-border/45 bg-gradient-to-r from-card/40 via-muted/[0.08] to-card/30 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-background/50">
                    <Wallet className="h-4 w-4 text-foreground/80" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-medium text-foreground">{shortenMint(submitted, 8, 8)}</p>
                    <p className="text-[0.65rem] text-muted-foreground">{isZh ? "当前查询" : "Active lookup"}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {solscanUrl ? (
                    <Button variant="outline" size="sm" asChild className="h-9 gap-1.5 rounded-lg border-border/55">
                      <a href={solscanUrl} target="_blank" rel="noopener noreferrer">
                        {isZh ? "Solscan" : "Solscan"}
                        <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                    </Button>
                  ) : null}
                  <span className="inline-flex items-center gap-1.5 text-[0.7rem] text-muted-foreground sm:text-xs">
                    {summary.isFetching || positions.isFetching ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin text-uof" aria-hidden />
                        {isZh ? "刷新中…" : "Refreshing..."}
                      </>
                    ) : (
                      isZh ? "已是最新" : "Up to date"
                    )}
                  </span>
                </div>
              </div>

              <div>
                <p className="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {isZh ? "资产总览" : "Portfolio summary"}
                </p>
                <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {(summary.isFetching || positions.isFetching) && sumData ? (
                    <div className="pointer-events-none absolute inset-0 z-[1] rounded-xl bg-background/30 backdrop-blur-[2px]" aria-hidden />
                  ) : null}
                  {summary.isPending ? (
                    Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[5.25rem] rounded-xl" />)
                  ) : sumData ? (
                    <>
                      <StatTile label={isZh ? "总资产" : "Total value"} value={formatUsd(sumData.totalValueUsd, { compact: false })} />
                      <StatTile
                        label={isZh ? "总盈亏" : "Total P&L"}
                        value={formatUsd(sumData.totalPnlUsd, { compact: false })}
                        sub={
                          sumData.totalValueUsd > 0
                            ? `${((sumData.totalPnlUsd / sumData.totalValueUsd) * 100).toFixed(1)}% ${isZh ? "占净值" : "of NAV"}`
                            : undefined
                        }
                        accent={sumData.totalPnlUsd >= 0}
                      />
                      <StatTile label={isZh ? "持有代币" : "Tokens held"} value={formatInt(sumData.tokensHeld)} />
                      <StatTile label={isZh ? "创建代币" : "Created"} value={formatInt(sumData.tokensCreatedCount)} />
                      <StatTile label={isZh ? "交易数" : "Transactions"} value={formatInt(sumData.totalTransactions)} />
                    </>
                  ) : null}
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{isZh ? "持仓" : "Positions"}</p>
                  {positions.data?.total != null ? (
                    <span className="text-[0.7rem] tabular-nums text-muted-foreground sm:text-xs">
                      {formatInt(positions.data.count)} {isZh ? "已显示" : "shown"}
                      {positions.data.total > positions.data.count ? ` · ${formatInt(positions.data.total)} ${isZh ? "总计" : "total"}` : ""}
                    </span>
                  ) : null}
                </div>

                <div className="hidden overflow-hidden rounded-xl border border-border/45 md:block">
                  <div className="overflow-x-auto">
                    <Table className="min-w-[44rem] text-[0.8125rem] tabular-nums">
                      <TableHeader>
                        <TableRow className="border-border/40 bg-muted/[0.12] hover:bg-transparent">
                          <TableHead className="h-11 px-4 text-left text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                            {isZh ? "代币" : "Token"}
                          </TableHead>
                          <TableHead className="h-11 px-3 text-right text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                            {isZh ? "余额" : "Balance"}
                          </TableHead>
                          <TableHead className="h-11 px-3 text-right text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                            {isZh ? "美元价值" : "USD value"}
                          </TableHead>
                          <TableHead className="h-11 px-3 text-right text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                            {isZh ? "平均成本" : "Avg entry"}
                          </TableHead>
                          <TableHead className="h-11 px-3 text-right text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                            P&amp;L
                          </TableHead>
                          <TableHead className="h-11 px-4 text-right text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                            {isZh ? "交易" : "Trade"}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {positions.isPending ? (
                          Array.from({ length: 4 }).map((_, i) => (
                            <TableRow key={`sk-${i}`} className="border-border/30">
                              <TableCell colSpan={6} className="px-4 py-3">
                                <Skeleton className="h-9 w-full rounded-lg" />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (positions.data?.positions.length ?? 0) === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                              {isZh ? "该钱包未找到 RISE 持仓。" : "No RISE positions found for this wallet."}
                            </TableCell>
                          </TableRow>
                        ) : (
                          positions.data?.positions.map((p) => {
                            const url = buildRiseTradeUrl(p.mint);
                            return (
                              <TableRow
                                key={p.mint}
                                className="group border-border/30 transition-colors hover:bg-muted/[0.35]"
                              >
                                <TableCell className="border-l-2 border-l-transparent px-4 py-3 transition-colors group-hover:border-l-uof/50">
                                  <div className="flex min-w-0 items-center gap-3">
                                    <TokenAvatar imageUrl={p.imageUrl} symbol={p.symbol ?? "—"} size="sm" />
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-semibold text-foreground">${p.symbol || "—"}</p>
                                      <p className="truncate text-[0.7rem] text-muted-foreground">{p.name || shortenMint(p.mint)}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="px-3 py-3 text-right text-foreground">{formatInt(p.balance)}</TableCell>
                                <TableCell className="px-3 py-3 text-right font-medium text-foreground">
                                  {formatUsd(p.balanceUsd, { compact: true })}
                                </TableCell>
                                <TableCell className="px-3 py-3 text-right text-muted-foreground">{formatPriceSmart(p.avgEntryUsd)}</TableCell>
                                <TableCell className="px-3 py-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <span
                                      className={cn(
                                        "tabular-nums",
                                        typeof p.pnlUsd === "number" && p.pnlUsd > 0 && "text-success",
                                        typeof p.pnlUsd === "number" && p.pnlUsd < 0 && "text-destructive",
                                      )}
                                    >
                                      {formatUsd(p.pnlUsd, { compact: true })}
                                    </span>
                                    <ChangePill pct={p.pnlPct ?? null} />
                                  </div>
                                </TableCell>
                                <TableCell className="px-4 py-3 text-right">
                                  {url ? <RiseTradeButton mint={p.mint} /> : <span className="text-xs text-muted-foreground">-</span>}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <ul className="flex flex-col gap-3 md:hidden">
                  {positions.isPending ? (
                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)
                  ) : (positions.data?.positions.length ?? 0) === 0 ? (
                    <li className="rounded-xl border border-dashed border-border/50 py-10 text-center text-sm text-muted-foreground">
                      {isZh ? "该钱包未找到 RISE 持仓。" : "No RISE positions found for this wallet."}
                    </li>
                  ) : (
                    positions.data?.positions.map((p) => (
                      <li key={p.mint}>
                        <PositionCard p={p} />
                      </li>
                    ))
                  )}
                </ul>
                {(positions.data?.total ?? 0) > 0 ? (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/35 pt-4">
                    <span className="text-[0.7rem] text-muted-foreground sm:text-xs">
                      {isZh ? "第" : "Page"} {page} {isZh ? "/" : "of"} {totalPositionPages}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-wrap items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                        {pageItems.map((item, idx) =>
                          item === "gap" ? (
                            <span key={`g-${idx}`} className="px-1.5 text-muted-foreground">
                              …
                            </span>
                          ) : (
                            <Button
                              key={item}
                              type="button"
                              variant={item === page ? "secondary" : "ghost"}
                              size="sm"
                              className={cn(
                                "h-8 min-w-[2.15rem] rounded-lg px-2 text-[0.7rem] tabular-nums",
                                item === page && "pointer-events-none",
                              )}
                              onClick={() => setPage(item)}
                            >
                              {item}
                            </Button>
                          ),
                        )}
                      </div>
                      <Select
                        value={String(rowsPerPage)}
                        onValueChange={(value) => {
                          setRowsPerPage(Number(value));
                          setPage(1);
                        }}
                      >
                        <SelectTrigger className="h-8 w-[7rem] rounded-lg text-[0.7rem]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAGE_SIZE_OPTIONS.map((size) => (
                            <SelectItem key={size} value={String(size)}>
                              {size} / page
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        {isZh ? "上一页" : "Prev"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        disabled={page >= totalPositionPages}
                        onClick={() => setPage((p) => Math.min(totalPositionPages, p + 1))}
                      >
                        {isZh ? "下一页" : "Next"}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>

              <p className="border-t border-border/35 pt-5 text-[0.72rem] leading-relaxed text-muted-foreground sm:text-xs">
                {isZh
                  ? "只读资产快照。盈亏与余额依赖 RISE 索引器更新，请始终在链上复核大额变动。"
                  : "Read-only portfolio snapshot. P&L and balances depend on RISE indexer freshness-always verify large moves on-chain."}
              </p>
            </div>
          )}
        </div>
      </GlassCard>
    </section>
  );
}

export { isValidAddress as isValidWalletAddress };
