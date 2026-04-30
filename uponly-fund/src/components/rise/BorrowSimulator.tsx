/**
 * Borrow simulator — POSTs to /uponly-rise-market/:addr/borrow-quote.
 * Read-only: shows the wallet's max borrow capacity, required deposit, and
 * borrow fee for a given borrow amount. No on-chain action.
 */
import { useEffect, useMemo, useState } from "react";
import { Banknote, ExternalLink, Loader2, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useRiseBorrowQuote, useRiseDashboard, useRiseMarketsAll } from "@/lib/RiseDashboardContext";
import { buildRiseTradeUrl } from "@/lib/riseDashboardApi";
import { formatPct, formatUsd } from "@/lib/marketDisplayFormat";
import { cn } from "@/lib/utils";
import {
  ChangePill,
  EmptyState,
  GlassCard,
  RISE_UPONLY_MINT,
  StatTile,
  TokenAvatar,
  formatPriceSmart,
} from "./RiseShared";
import { MarketSearchPicker } from "@/components/rise/MarketSearchPicker";
import { useLanguage } from "@/lib/LanguageContext";

const ADDR_MIN = 32;
const ADDR_MAX = 50;

function isValidWallet(addr: string): boolean {
  return addr.length >= ADDR_MIN && addr.length <= ADDR_MAX && /^[a-zA-Z0-9]+$/.test(addr);
}

function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function BorrowSimulator() {
  const { language } = useLanguage();
  const isZh = language === "zh";
  const { uponly } = useRiseDashboard();
  const allMarkets = useRiseMarketsAll();

  const choices = useMemo(() => {
    if (allMarkets.data && allMarkets.data.length > 0) return allMarkets.data;
    return uponly ? [uponly] : [];
  }, [allMarkets.data, uponly]);

  const [mint, setMint] = useState<string>(uponly?.mint || RISE_UPONLY_MINT);
  const selected = useMemo(() => choices.find((m) => m.mint === mint) ?? choices[0] ?? null, [choices, mint]);

  useEffect(() => {
    if (!mint && choices[0]) setMint(choices[0].mint);
  }, [choices, mint]);

  const [wallet, setWallet] = useState("");
  const [borrowStr, setBorrowStr] = useState<string>("0");

  const borrowAmount = useMemo(() => {
    const n = Number(borrowStr.replace(/,/g, ""));
    return Number.isFinite(n) && n >= 0 ? n : null;
  }, [borrowStr]);

  const debouncedBorrow = useDebounced(borrowAmount, 400);
  const validWallet = wallet.trim().length > 0 && isValidWallet(wallet.trim());

  const borrow = useRiseBorrowQuote({
    address: validWallet ? selected?.mint ?? null : null,
    wallet: validWallet ? wallet.trim() : null,
    amountToBorrow: debouncedBorrow,
  });
  const q = borrow.data?.quote;
  const tradeUrl = selected ? buildRiseTradeUrl(selected.mint) : null;

  const aggregatePending = allMarkets.isPending;
  const quoteEnabled =
    Boolean(selected?.mint) &&
    validWallet &&
    typeof debouncedBorrow === "number" &&
    Number.isFinite(debouncedBorrow) &&
    debouncedBorrow >= 0;

  return (
    <section aria-labelledby="rise-borrow-heading">
      <h2 id="rise-borrow-heading" className="sr-only">
        {isZh ? "底线抵押借贷模拟器" : "Floor-backed borrow simulator"}
      </h2>

      <GlassCard
        padded={false}
        className="overflow-hidden border-border/50 shadow-[0_0_0_1px_hsl(0_0%_100%/0.05)_inset,0_24px_60px_-28px_hsl(0_0%_0%/0.55)]"
      >
        <div className="border-b border-border/45 bg-gradient-to-b from-card/55 to-transparent px-4 py-5 sm:px-6">
          <p className="inline-flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-foreground/45" aria-hidden />
            {isZh ? "底线抵押借贷" : "Floor-backed borrow"}
          </p>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {isZh ? "粘贴 Solana 钱包并选择可抵押市场。报价遵循 RISE 借贷模型；输入 " : "Paste a Solana wallet and pick a floor-eligible market. Quotes mirror RISE borrow math-use "}
            <code className="rounded bg-muted/50 px-1 py-0.5 font-mono text-[0.7rem]">0</code>
            {isZh ? " 可仅查看可借额度，无需指定借款规模。" : " borrow to read capacity without sizing a draw."}
          </p>
        </div>

        <div className="grid gap-6 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,17rem)] lg:items-start lg:gap-8 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-5">
            <div>
              <Label
                htmlFor="borrow-wallet"
                className="mb-2 block text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
              >
                {isZh ? "钱包" : "Wallet"}
              </Label>
              <Input
                id="borrow-wallet"
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                placeholder={isZh ? "Solana 地址（base58）" : "Solana address (base58)"}
                spellCheck={false}
                className={cn(
                  "h-12 rounded-xl border-border/55 bg-background/40 font-mono text-sm shadow-inner sm:text-sm",
                  wallet.length > 0 && !validWallet && "border-destructive/45",
                )}
                aria-invalid={wallet.length > 0 && !validWallet}
              />
              {wallet.length > 0 && !validWallet ? (
                <p className="mt-2 text-[0.72rem] text-destructive/90">
                  {isZh ? `请输入有效 base58 钱包地址（${ADDR_MIN}-${ADDR_MAX} 字符）。` : `Enter a valid base58 wallet (${ADDR_MIN}-${ADDR_MAX} chars).`}
                </p>
              ) : null}
            </div>

            <div>
              <Label
                htmlFor="borrow-amount"
                className="mb-2 block text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
              >
                {isZh ? "借款数量（原始单位）" : "Amount to borrow (raw units)"}
              </Label>
              <Input
                id="borrow-amount"
                value={borrowStr}
                onChange={(e) => setBorrowStr(e.target.value)}
                inputMode="decimal"
                placeholder="0"
                className={cn(
                  "h-12 max-w-md rounded-xl border-border/55 bg-background/40 font-mono text-base tabular-nums shadow-inner",
                  borrowAmount === null && borrowStr.trim() !== "" && "border-destructive/45",
                )}
                aria-invalid={borrowAmount === null && borrowStr.trim() !== ""}
              />
              <div className="mt-3 flex gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2.5 text-[0.72rem] leading-relaxed text-amber-100/95 sm:text-xs">
                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                <span>
                  {isZh ? "输入 " : "Use "}
                  <code className="font-mono text-[0.7rem]">0</code>
                  {isZh ? " 可查询最大可借与所需抵押，无需指定借款规模。数值遵循 RISE 原始抵押语义，执行前请在 " : " to fetch max borrowable and deposits without specifying a draw size. Numbers follow RISE raw collateral semantics-confirm decimals on "}
                  <span className="font-medium text-foreground/90">rise.rich</span>
                  {isZh ? " 核对小数位。" : " before execution."}
                </span>
              </div>
            </div>

            <div>
              <Label
                htmlFor="borrow-market"
                className="mb-2 block text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
              >
                {isZh ? "可抵押市场" : "Floor-eligible market"}
              </Label>
              <MarketSearchPicker
                id="borrow-market"
                options={choices}
                value={mint}
                onValueChange={setMint}
                disabled={aggregatePending}
                triggerPlaceholder={aggregatePending ? (isZh ? "加载市场中..." : "Loading markets...") : (isZh ? "选择市场" : "Select a market")}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{isZh ? "市场快照" : "Market snapshot"}</p>
            {selected ? (
              <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card/70 via-card/35 to-card/20 p-4 shadow-inner">
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[radial-gradient(circle,hsl(215_80%_50%/0.12),transparent_68%)]"
                  aria-hidden
                />
                <div className="relative flex items-start gap-3">
                  <TokenAvatar imageUrl={selected.imageUrl} symbol={selected.symbol} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-lg font-semibold tracking-tight text-foreground">${selected.symbol || "—"}</p>
                      <ChangePill pct={selected.priceChange24hPct} />
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">{selected.name}</p>
                    <dl className="mt-4 space-y-2 text-[0.72rem] sm:text-xs">
                      <div className="flex justify-between gap-2 border-b border-border/30 pb-2">
                        <dt className="text-muted-foreground">{isZh ? "现货" : "Spot"}</dt>
                        <dd className="font-semibold tabular-nums text-foreground">{formatPriceSmart(selected.priceUsd)}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">{isZh ? "底线" : "Floor"}</dt>
                        <dd className="font-semibold tabular-nums text-foreground">{formatPriceSmart(selected.floorPriceUsd)}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/50 bg-muted/[0.08] p-6 text-center text-sm text-muted-foreground">
                {isZh ? "请选择一个带底线数据的市场。" : "Pick a market with floor data."}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border/45 bg-muted/[0.08] px-4 py-5 sm:px-6 sm:py-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{isZh ? "输出" : "Output"}</p>
              <h3 className="font-display text-lg font-semibold tracking-tight text-foreground sm:text-xl">{isZh ? "借贷报价" : "Borrow quote"}</h3>
            </div>
            {borrow.isFetching && quoteEnabled ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-border/45 bg-background/40 px-3 py-1 text-[0.7rem] font-medium text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-uof" aria-hidden />
                {isZh ? "获取中…" : "Fetching..."}
              </span>
            ) : null}
          </div>

          {!validWallet || !selected ? (
            <div className="rounded-xl border border-dashed border-border/50 bg-background/[0.15] py-10 sm:py-12">
              <EmptyState
                icon={Banknote}
                title={isZh ? "需要钱包与市场" : "Wallet & market required"}
                description={
                  isZh
                    ? "请输入有效 Solana 地址并选择底线支撑市场，以获取 RISE 可借额度。"
                    : "Enter a valid Solana address and choose a floor-backed market to pull borrow capacity from RISE."
                }
              />
            </div>
          ) : borrowAmount === null ? (
            <div className="rounded-xl border border-destructive/25 bg-destructive/[0.04] py-8">
              <EmptyState
                icon={Banknote}
                title={isZh ? "借款数量无效" : "Invalid borrow amount"}
                description={isZh ? "请输入非负数（仅看额度可填 0），并检查异常字符。" : "Use a non-negative number (or 0 for capacity-only). Check for stray characters."}
              />
            </div>
          ) : borrow.isError ? (
            <div className="rounded-xl border border-destructive/25 bg-destructive/[0.04] py-8">
              <EmptyState
                icon={Banknote}
                title={isZh ? "借贷报价失败" : "Borrow quote failed"}
                description={(borrow.error as Error)?.message ?? (isZh ? "RISE 拒绝了借贷报价请求。" : "RISE rejected the borrow quote.")}
                action={
                  <Button size="sm" variant="secondary" onClick={() => borrow.refetch()}>
                    {isZh ? "重试" : "Retry"}
                  </Button>
                }
              />
            </div>
          ) : borrow.isFetching && !q ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="h-[4.5rem] rounded-xl" />
              ))}
            </div>
          ) : !q ? (
            <div className="rounded-xl border border-dashed border-border/50 bg-background/[0.15] py-10">
              <EmptyState
                icon={Banknote}
                title={isZh ? "暂无报价" : "No quote yet"}
                description={isZh ? "等待 RISE 返回，请调整输入或重试。" : "Awaiting RISE - adjust inputs or retry."}
              />
            </div>
          ) : (
            <div className="relative">
              {borrow.isFetching ? (
                <div className="pointer-events-none absolute inset-0 z-[1] rounded-xl bg-background/40 backdrop-blur-[2px]" aria-hidden />
              ) : null}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <StatTile label={isZh ? "钱包余额" : "Wallet balance"} value={formatUsd(q.walletBalance, { compact: true })} />
                <StatTile label={isZh ? "已抵押代币" : "Deposited tokens"} value={q.depositedTokens != null ? q.depositedTokens.toString() : "—"} />
                <StatTile label={isZh ? "现有债务" : "Existing debt"} value={formatUsd(q.debt, { compact: true })} />
                <StatTile label={isZh ? "底线价格" : "Floor price"} value={formatPriceSmart(q.floorPrice)} />
                <StatTile
                  label={isZh ? "最大可借" : "Max borrowable"}
                  value={formatUsd(q.maxBorrowableUsd, { compact: false })}
                  sub={q.maxBorrowable != null ? `${q.maxBorrowable} ${isZh ? "原始单位" : "raw"}` : undefined}
                  accent
                />
                <StatTile label={isZh ? "全额抵押可借" : "If you deposit all"} value={formatUsd(q.maxBorrowableIfDepositAllUsd, { compact: false })} />
                <StatTile label={isZh ? "所需抵押" : "Required deposit"} value={q.requiredDeposit != null ? `${q.requiredDeposit}` : "—"} />
                <StatTile label={isZh ? "借款总额" : "Gross borrow"} value={formatUsd(q.grossBorrow, { compact: true })} />
                <StatTile label={isZh ? "借款费率" : "Borrow fee"} value={formatPct(q.borrowFeePercent)} />
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 border-t border-border/35 pt-5 text-[0.72rem] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:text-xs">
            <p className="inline-flex max-w-xl items-start gap-2">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
              <span>
                {isZh
                  ? "数据来自 RISE 借贷报价 API，实际操作前请务必核验协议实时限制与文档。"
                  : "Figures come from the borrow quote API RISE exposes-always verify live protocol limits and docs before moving size."}
              </span>
            </p>
            {tradeUrl ? (
              <Button asChild size="sm" variant="secondary" className="h-10 shrink-0 gap-2 rounded-xl border-border/55 px-4">
                <a href={tradeUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  {isZh ? "在 RISE 打开" : "Open in RISE"}
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </GlassCard>
    </section>
  );
}
