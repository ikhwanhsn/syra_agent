import { useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { useRiseDashboard, useRiseMarketsAll, useRiseOhlc } from "@/lib/RiseDashboardContext";
import {
  ChangePill,
  EmptyState,
  GlassCard,
  StatTile,
  TokenAvatar,
  formatPriceSmart,
} from "@/components/rise/RiseShared";
import { formatUsd } from "@/lib/marketDisplayFormat";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MarketSearchPicker } from "@/components/rise/MarketSearchPicker";
import { useLanguage } from "@/lib/LanguageContext";

export function DcaSimulator() {
  const { language } = useLanguage();
  const isZh = language === "zh";
  const { uponly } = useRiseDashboard();
  const markets = useRiseMarketsAll();
  const [mint, setMint] = useState(uponly?.mint ?? "");
  const [amount, setAmount] = useState("100");
  const [step, setStep] = useState("7");

  const selected = useMemo(() => (markets.data ?? []).find((row) => row.mint === mint) ?? null, [markets.data, mint]);
  const ohlc = useRiseOhlc(selected?.mint ?? null, "1d", 180);

  const dca = useMemo(() => {
    const budget = Number(amount);
    const interval = Math.max(1, Number(step));
    const closes = (ohlc.data?.candles ?? [])
      .map((row) => row.close ?? row.open)
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    if (!Number.isFinite(budget) || budget <= 0 || closes.length < 2) return null;
    let invested = 0;
    let tokens = 0;
    for (let i = 0; i < closes.length; i += interval) {
      const px = closes[i];
      invested += budget;
      tokens += budget / px;
    }
    const current = closes[closes.length - 1];
    const value = tokens * current;
    return { invested, tokens, value, pnl: value - invested, avgEntry: invested / tokens, current };
  }, [ohlc.data, amount, step]);

  const budgetNum = Number(amount);
  const stepNum = Number(step);
  const inputsInvalid =
    !Number.isFinite(budgetNum) ||
    budgetNum <= 0 ||
    !Number.isFinite(stepNum) ||
    stepNum < 1 ||
    !mint;

  const resultsLoading =
    !markets.isError &&
    !ohlc.isError &&
    selected &&
    !inputsInvalid &&
    (markets.isPending || ohlc.isPending || (ohlc.isFetching && (ohlc.data?.candles?.length ?? 0) === 0));

  return (
    <GlassCard
          padded={false}
          className="overflow-hidden border-border/50 shadow-[0_0_0_1px_hsl(0_0%_100%/0.05)_inset,0_24px_60px_-28px_hsl(0_0%_0%/0.55)]"
        >
          <div className="border-b border-border/45 bg-gradient-to-b from-card/55 to-transparent px-4 py-5 sm:px-6">
            <p className="inline-flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-foreground/45" aria-hidden />
              {isZh ? "定投累积" : "Recurring accumulation"}
            </p>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {isZh
                ? "使用仪表盘数据流最近约 180 根日线收盘价。间隔按 K 线跳跃 "
                : "Uses the last ~180 daily OHLC closes from the dashboard feed. Interval skips "}
              <code className="rounded bg-muted/50 px-1 py-0.5 font-mono text-[0.7rem]">n</code>
              {isZh ? " 根再买入（不是自然日），可按你的节奏偏好调整。" : " candles between buys-not calendar days-so tune cadence to match how you think about spacing."}
            </p>
          </div>

          <div className="grid gap-6 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,17rem)] lg:items-start lg:gap-8 sm:px-6 sm:py-6">
            <div className="grid gap-5">
              <div>
                <Label htmlFor="dca-market" className="mb-2 block text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {isZh ? "市场" : "Market"}
                </Label>
                <MarketSearchPicker
                  id="dca-market"
                  options={markets.data ?? []}
                  value={mint}
                  onValueChange={setMint}
                  disabled={markets.isPending}
                  triggerPlaceholder={markets.isPending ? (isZh ? "加载市场中..." : "Loading markets...") : (isZh ? "选择市场" : "Choose a market")}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="dca-amount" className="mb-2 block text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {isZh ? "每次买入金额（USD）" : "Size per buy (USD)"}
                  </Label>
                  <Input
                    id="dca-amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    inputMode="decimal"
                    className={cn(
                      "h-11 rounded-xl border-border/55 bg-background/40 font-mono tabular-nums shadow-inner",
                      (!Number.isFinite(budgetNum) || budgetNum <= 0) && amount.trim() !== "" && "border-destructive/45",
                    )}
                    aria-invalid={(!Number.isFinite(budgetNum) || budgetNum <= 0) && amount.trim() !== ""}
                  />
                </div>
                <div>
                  <Label htmlFor="dca-step" className="mb-2 block text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {isZh ? "买入间隔（跳过K线）" : "Skip candles between buys"}
                  </Label>
                  <Input
                    id="dca-step"
                    value={step}
                    onChange={(e) => setStep(e.target.value)}
                    inputMode="numeric"
                    className={cn(
                      "h-11 rounded-xl border-border/55 bg-background/40 font-mono tabular-nums shadow-inner",
                      (!Number.isFinite(stepNum) || stepNum < 1) && step.trim() !== "" && "border-destructive/45",
                    )}
                    aria-invalid={(!Number.isFinite(stepNum) || stepNum < 1) && step.trim() !== ""}
                  />
                  <p className="mt-2 text-[0.72rem] text-muted-foreground sm:text-xs">
                    {isZh ? "示例：" : "Example:"} <span className="font-medium text-foreground/85">7</span> {isZh ? "≈ 日线下接近每周一次。" : "≈ weekly cadence on daily data."}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{isZh ? "现货上下文" : "Spot context"}</p>
              {selected ? (
                <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card/70 via-card/35 to-card/20 p-4 shadow-inner">
                  <div
                    className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[radial-gradient(circle,hsl(var(--uof)_/_0.12),transparent_68%)]"
                    aria-hidden
                  />
                  <div className="relative flex items-start gap-3">
                    <TokenAvatar imageUrl={selected.imageUrl} symbol={selected.symbol} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-lg font-semibold tracking-tight text-foreground">${selected.symbol}</p>
                        <ChangePill pct={selected.priceChange24hPct} />
                      </div>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">{selected.name}</p>
                      <p className="mt-3 text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">{isZh ? "最新收盘（数据流）" : "Last close (feed)"}</p>
                      <p className="font-display text-xl font-semibold tabular-nums text-foreground">{formatPriceSmart(selected.priceUsd)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/50 bg-muted/[0.08] p-6 text-center text-sm text-muted-foreground">
                  {isZh ? "请选择一个市场作为模拟基准。" : "Select a market to anchor the simulation."}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-border/45 bg-muted/[0.08] px-4 py-5 sm:px-6 sm:py-6">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{isZh ? "输出" : "Output"}</p>
                <h2 className="font-display text-lg font-semibold tracking-tight text-foreground sm:text-xl">{isZh ? "模拟结果" : "Simulation results"}</h2>
              </div>
              {resultsLoading ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-border/45 bg-background/40 px-3 py-1 text-[0.7rem] font-medium text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-uof" aria-hidden />
                  {isZh ? "加载K线中…" : "Loading candles..."}
                </span>
              ) : null}
            </div>

            {markets.isError || ohlc.isError ? (
              <div className="rounded-xl border border-destructive/25 bg-destructive/[0.04] py-8">
                <EmptyState
                  icon={AlertTriangle}
                  title={isZh ? "模拟数据不可用" : "Simulation data unavailable"}
                  description={
                    (markets.error as Error)?.message || (ohlc.error as Error)?.message || (isZh ? "请稍后重试。" : "Try again in a moment.")
                  }
                  action={
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        markets.refetch();
                        ohlc.refetch();
                      }}
                    >
                      {isZh ? "重试" : "Retry"}
                    </Button>
                  }
                />
              </div>
            ) : resultsLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-[4.75rem] rounded-xl" />
                ))}
              </div>
            ) : dca ? (
              <div className="relative">
                {ohlc.isFetching ? (
                  <div className="pointer-events-none absolute inset-0 z-[1] rounded-xl bg-background/35 backdrop-blur-[2px]" aria-hidden />
                ) : null}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                  <StatTile label={isZh ? "总投入" : "Total invested"} value={formatUsd(dca.invested, { compact: false })} />
                  <StatTile label={isZh ? "市值" : "Mark value"} value={formatUsd(dca.value, { compact: false })} />
                  <StatTile
                    label={isZh ? "盈亏" : "PnL"}
                    value={formatUsd(dca.pnl, { compact: false })}
                    accent={dca.pnl >= 0}
                    sub={dca.pnl >= 0 ? (isZh ? "相对成本为正" : "Vs. cost basis") : isZh ? "低于成本" : "Below cost basis"}
                  />
                  <StatTile label={isZh ? "平均成本" : "Avg entry"} value={formatPriceSmart(dca.avgEntry)} />
                  <StatTile label={isZh ? "最新收盘价" : "Last candle close"} value={formatPriceSmart(dca.current)} />
                  <StatTile label={isZh ? "累计代币" : "Accumulated tokens"} value={dca.tokens.toFixed(4)} sub={isZh ? "模拟单位" : "Synthetic units"} />
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border/50 bg-background/[0.12] py-10 sm:py-12">
                <EmptyState
                  icon={CalendarClock}
                  title={inputsInvalid ? (isZh ? "请检查输入" : "Check inputs") : isZh ? "历史数据不足" : "Not enough history"}
                  description={
                    inputsInvalid
                      ? isZh
                        ? "请选择市场、输入正数买入金额，且间隔需 >= 1 根K线。"
                        : "Pick a market, positive USD size per leg, and interval >= 1 candle."
                      : isZh
                        ? "OHLC窗口至少需要两个有效收盘价，可尝试其他市场或刷新。"
                        : "Need at least two valid closes in the OHLC window-try another market or refresh."
                  }
                />
              </div>
            )}

            <p className="mt-6 border-t border-border/35 pt-5 text-[0.72rem] leading-relaxed text-muted-foreground sm:text-xs">
              {isZh
                ? "仅用于教育演示：默认按采样收盘价成交，未计手续费、滑点与流动性。非投资建议。"
                : "Educational model only: assumes fills at sampled closes, ignores fees, slippage, and liquidity. Not investment advice."}
            </p>
          </div>
    </GlassCard>
  );
}

export default function DcaPage() {
  const { language } = useLanguage();
  const isZh = language === "zh";
  return (
    <div className="relative flex flex-col gap-8">
      <div
        className="pointer-events-none absolute inset-x-0 -top-32 z-0 h-[26rem] bg-[radial-gradient(ellipse_68%_54%_at_50%_-8%,hsl(var(--uof)_/_0.13),transparent_56%),radial-gradient(ellipse_44%_40%_at_86%_22%,hsl(215_85%_55%/0.07),transparent_52%),radial-gradient(ellipse_38%_34%_at_12%_28%,hsl(280_70%_50%/0.06),transparent_50%)]"
        aria-hidden
      />
      <div className="relative z-[1] flex flex-col gap-8">
        <DashboardPageHeader
          eyebrow={isZh ? "策略实验室" : "Strategy lab"}
          title={isZh ? "DCA 模拟器" : "DCA simulator"}
          description={
            isZh
              ? "基于历史日线回测固定金额买入，模拟平均成本、累积敞口与市值变化，无需下单。"
              : "Backtest fixed-size buys on historical daily candles-model average entry, stacked exposure, and mark-to-market without placing trades."
          }
        />
        <DcaSimulator />
      </div>
    </div>
  );
}
