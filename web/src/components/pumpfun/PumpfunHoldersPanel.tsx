import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  CircleDollarSign,
  Loader2,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import { useHolderInsights } from "@/hooks/useHolderProfit";
import { formatRelativeTime } from "@/lib/agentWalletUi";
import type { HolderLastTrade, HolderNetWorth, MemecoinAnalysisPayload } from "@/lib/pumpfunAnalysisApi";
import { cn } from "@/lib/utils";

function truncateWallet(wallet: string | null): string {
  if (!wallet) return "—";
  if (wallet.length <= 12) return wallet;
  return `${wallet.slice(0, 4)}…${wallet.slice(-4)}`;
}

function formatCompactUsd(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(abs / 1_000).toFixed(1)}K`;
  return `$${abs.toFixed(2)}`;
}

function formatTokenAmount(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatProfitUsd(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "";
  const abs = Math.abs(value);
  const prefix = value >= 0 ? "+" : "−";
  if (abs >= 1_000_000) return `${prefix}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${prefix}$${(abs / 1_000).toFixed(1)}K`;
  return `${prefix}$${abs.toFixed(2)}`;
}

function formatProfitPct(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "";
  const prefix = value >= 0 ? "+" : "−";
  return `${prefix}${Math.abs(value).toFixed(1)}%`;
}

function ProfitBadge({
  inProfit,
  profitUsd,
  profitPct,
}: {
  inProfit: boolean | null;
  profitUsd: number | null;
  profitPct: number | null;
}) {
  if (inProfit == null) {
    return (
      <Badge variant="outline" className="text-[10px] text-muted-foreground">
        Unknown
      </Badge>
    );
  }

  const detail =
    profitUsd != null
      ? formatProfitUsd(profitUsd)
      : profitPct != null
        ? formatProfitPct(profitPct)
        : "";

  if (inProfit) {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-emerald-500/40 bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400"
      >
        <TrendingUp className="h-3 w-3" aria-hidden />
        In profit{detail ? ` · ${detail}` : ""}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="gap-1 border-red-500/40 bg-red-500/10 text-[10px] text-red-600 dark:text-red-400"
    >
      <TrendingDown className="h-3 w-3" aria-hidden />
      At loss{detail ? ` · ${detail}` : ""}
    </Badge>
  );
}

function LastTradeBadge({ trade }: { trade: HolderLastTrade | undefined }) {
  if (!trade?.at && !trade?.side) {
    return (
      <Badge variant="outline" className="text-[10px] text-muted-foreground">
        No activity
      </Badge>
    );
  }

  const tokenAmt = formatTokenAmount(trade.amountToken);
  const usdAmt = formatCompactUsd(trade.amountUsd);
  const amountParts = [tokenAmt ? `${tokenAmt} tokens` : null, usdAmt || null].filter(Boolean);
  const amountLabel = amountParts.join(" · ");
  const whenLabel = trade.at ? formatRelativeTime(trade.at) : null;
  const detail = [amountLabel || null, whenLabel].filter(Boolean).join(" · ");

  if (trade.side === "buy") {
    return (
      <Badge
        variant="outline"
        className="max-w-[220px] gap-1 border-emerald-500/40 bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400"
        title={trade.at ? new Date(trade.at).toLocaleString() : undefined}
      >
        <ArrowDownLeft className="h-3 w-3 shrink-0" aria-hidden />
        <span className="truncate">Buy{detail ? ` · ${detail}` : whenLabel ? ` · ${whenLabel}` : ""}</span>
      </Badge>
    );
  }

  if (trade.side === "sell") {
    return (
      <Badge
        variant="outline"
        className="max-w-[220px] gap-1 border-red-500/40 bg-red-500/10 text-[10px] text-red-600 dark:text-red-400"
        title={trade.at ? new Date(trade.at).toLocaleString() : undefined}
      >
        <ArrowUpRight className="h-3 w-3 shrink-0" aria-hidden />
        <span className="truncate">Sell{detail ? ` · ${detail}` : whenLabel ? ` · ${whenLabel}` : ""}</span>
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="max-w-[220px] text-[10px] text-muted-foreground"
      title={trade.at ? new Date(trade.at).toLocaleString() : undefined}
    >
      <span className="truncate">
        Active{whenLabel ? ` · ${whenLabel}` : ""}
        {amountLabel ? ` · ${amountLabel}` : ""}
      </span>
    </Badge>
  );
}

function NetWorthCell({ netWorth }: { netWorth: HolderNetWorth | undefined }) {
  if (!netWorth?.netWorthUsd && netWorth?.nativeBalanceSol == null) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const solLabel =
    netWorth.nativeBalanceSol != null
      ? `${netWorth.nativeBalanceSol.toLocaleString(undefined, { maximumFractionDigits: 2 })} SOL`
      : null;

  return (
    <div className="text-right">
      {netWorth.netWorthUsd != null ? (
        <p className="font-mono text-xs font-semibold tabular-nums">
          {formatCompactUsd(netWorth.netWorthUsd)}
        </p>
      ) : null}
      {solLabel ? (
        <p className="font-mono text-[10px] tabular-nums text-muted-foreground">{solLabel}</p>
      ) : null}
    </div>
  );
}

function HeaderToggle({
  active,
  onToggle,
  label,
  activeLabel,
  children,
}: {
  active: boolean;
  onToggle: () => void;
  label: string;
  activeLabel: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={active ? "secondary" : "outline"}
          size="icon"
          className="h-8 w-8 shrink-0 rounded-lg"
          aria-pressed={active}
          aria-label={active ? activeLabel : label}
          onClick={onToggle}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left" className="text-xs">
        {active ? activeLabel : label}
      </TooltipContent>
    </Tooltip>
  );
}

export interface PumpfunHoldersPanelProps {
  data: MemecoinAnalysisPayload;
  className?: string;
}

export function PumpfunHoldersPanel({ data, className }: PumpfunHoldersPanelProps) {
  const [showProfit, setShowProfit] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showNetWorth, setShowNetWorth] = useState(false);
  const holders = data.holders.ok ? data.holders.data : null;
  const concentration = holders?.top10ConcentrationPct;

  const holderWallets = useMemo(
    () =>
      holders?.holders
        .slice(0, 10)
        .map((h) => h.wallet)
        .filter((w): w is string => Boolean(w)) ?? [],
    [holders?.holders],
  );

  const insightsQ = useHolderInsights(data.mint, holderWallets, holderWallets.length > 0);
  const insightsLoading =
    (showProfit || showActivity || showNetWorth) && insightsQ.isFetching && !insightsQ.data;

  const insightsByWallet = useMemo(() => {
    const map = new Map<
      string,
      {
        inProfit: boolean | null;
        profitUsd: number | null;
        profitPct: number | null;
        lastTrade: HolderLastTrade | undefined;
        netWorth: HolderNetWorth | undefined;
      }
    >();
    for (const row of insightsQ.data?.holders ?? []) {
      map.set(row.wallet, {
        inProfit: row.inProfit,
        profitUsd: row.profitUsd,
        profitPct: row.profitPct,
        lastTrade: row.lastTrade,
        netWorth: row.netWorth,
      });
    }
    return map;
  }, [insightsQ.data?.holders]);

  return (
    <section className={cn(overviewCardShell, "p-5 sm:p-6", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div>
            <p className={overviewKickerClass}>Holder concentration</p>
            <h3 className="text-sm font-medium text-muted-foreground">On-chain top holders via Solana RPC</h3>
          </div>
        </div>

        {holders && holders.holders.length > 0 ? (
          <TooltipProvider delayDuration={300}>
            <div className="flex shrink-0 items-center gap-1.5">
              <HeaderToggle
                active={showProfit}
                onToggle={() => setShowProfit((v) => !v)}
                label="Show if holders are in profit"
                activeLabel="Hide profit status"
              >
                <CircleDollarSign className="h-4 w-4" aria-hidden />
              </HeaderToggle>
              <HeaderToggle
                active={showActivity}
                onToggle={() => setShowActivity((v) => !v)}
                label="Show last buy/sell activity"
                activeLabel="Hide trade activity"
              >
                <ArrowLeftRight className="h-4 w-4" aria-hidden />
              </HeaderToggle>
              <HeaderToggle
                active={showNetWorth}
                onToggle={() => setShowNetWorth((v) => !v)}
                label="Show total wallet value (all tokens)"
                activeLabel="Hide net worth"
              >
                <Wallet className="h-4 w-4" aria-hidden />
              </HeaderToggle>
            </div>
          </TooltipProvider>
        ) : null}
      </div>

      {!holders ? (
        <p className="text-sm text-muted-foreground">
          Holder data unavailable
          {data.holders.error ? `: ${data.holders.error.replace(/\{"jsonrpc".*$/, "Solana RPC temporarily unavailable")}` : ""}
        </p>
      ) : holders.holders.length === 0 && holders.holderCountEstimate != null ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Top holder breakdown is temporarily unavailable (Solana RPC busy).
          </p>
          <div className="flex items-center justify-between rounded-xl border border-border/40 px-4 py-3 text-sm">
            <span className="text-muted-foreground">Estimated holders (pump.fun)</span>
            <span className="font-mono font-semibold tabular-nums">
              {holders.holderCountEstimate.toLocaleString()}
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {(showProfit || showActivity || showNetWorth) && insightsQ.isError ? (
            <p className="text-xs text-destructive">
              {insightsQ.error instanceof Error
                ? insightsQ.error.message
                : "Could not load holder insights"}
            </p>
          ) : null}

          {showProfit && insightsQ.data?.summary ? (
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {insightsQ.data.summary.inProfit}
                </span>{" "}
                in profit
              </span>
              <span aria-hidden>·</span>
              <span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  {insightsQ.data.summary.atLoss}
                </span>{" "}
                at loss
              </span>
              {insightsQ.data.summary.unknown > 0 ? (
                <>
                  <span aria-hidden>·</span>
                  <span>{insightsQ.data.summary.unknown} unknown</span>
                </>
              ) : null}
            </div>
          ) : null}

          {showActivity && insightsQ.data?.summary ? (
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {insightsQ.data.summary.lastBuy}
                </span>{" "}
                last buy
              </span>
              <span aria-hidden>·</span>
              <span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  {insightsQ.data.summary.lastSell}
                </span>{" "}
                last sell
              </span>
              {insightsQ.data.summary.lastTradeUnknown > 0 ? (
                <>
                  <span aria-hidden>·</span>
                  <span>{insightsQ.data.summary.lastTradeUnknown} active (side unknown)</span>
                </>
              ) : null}
            </div>
          ) : null}

          {showNetWorth && insightsQ.data?.summary?.totalNetWorthUsd != null ? (
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>
                Combined top-{insightsQ.data.summary.withNetWorth} net worth{" "}
                <span className="font-medium text-foreground">
                  {formatCompactUsd(insightsQ.data.summary.totalNetWorthUsd)}
                </span>
              </span>
            </div>
          ) : null}

          {concentration != null ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Top 10 concentration</span>
                <span
                  className={cn(
                    "font-mono font-semibold tabular-nums",
                    concentration >= 60
                      ? "text-red-500"
                      : concentration >= 40
                        ? "text-amber-500"
                        : "text-emerald-500",
                  )}
                >
                  {concentration.toFixed(1)}%
                </span>
              </div>
              <Progress value={Math.min(100, concentration)} className="h-2" />
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-xl border border-border/40">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Share</TableHead>
                  {showProfit ? (
                    <TableHead className="min-w-[120px] text-right">Profit</TableHead>
                  ) : null}
                  {showActivity ? (
                    <TableHead className="min-w-[160px] text-right">Last trade</TableHead>
                  ) : null}
                  {showNetWorth ? (
                    <TableHead className="min-w-[100px] text-right">Net worth</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {holders.holders.slice(0, 10).map((row) => {
                  const insight = row.wallet ? insightsByWallet.get(row.wallet) : undefined;
                  return (
                    <TableRow key={row.tokenAccount}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{row.rank}</TableCell>
                      <TableCell className="font-mono text-xs">{truncateWallet(row.wallet)}</TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums">
                        {row.balanceHuman != null
                          ? row.balanceHuman.toLocaleString(undefined, { maximumFractionDigits: 2 })
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums">
                        {row.sharePct != null ? `${row.sharePct.toFixed(2)}%` : "—"}
                      </TableCell>
                      {showProfit ? (
                        <TableCell className="text-right">
                          {insightsLoading ? (
                            <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-muted-foreground" />
                          ) : row.wallet ? (
                            <div className="flex justify-end">
                              <ProfitBadge
                                inProfit={insight?.inProfit ?? null}
                                profitUsd={insight?.profitUsd ?? null}
                                profitPct={insight?.profitPct ?? null}
                              />
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      ) : null}
                      {showActivity ? (
                        <TableCell className="text-right">
                          {insightsLoading ? (
                            <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-muted-foreground" />
                          ) : row.wallet ? (
                            <div className="flex justify-end">
                              <LastTradeBadge trade={insight?.lastTrade} />
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      ) : null}
                      {showNetWorth ? (
                        <TableCell className="text-right">
                          {insightsLoading ? (
                            <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-muted-foreground" />
                          ) : row.wallet ? (
                            <NetWorthCell netWorth={insight?.netWorth} />
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      ) : null}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {showProfit || showActivity || showNetWorth ? (
            <p className="text-[11px] leading-relaxed text-muted-foreground/90">
              Net worth is the total USD value of all tokens in each wallet (via GMGN portfolio holdings). Profit
              and trade activity come from on-chain buy/sell history. Hover a trade badge for the exact timestamp.
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
