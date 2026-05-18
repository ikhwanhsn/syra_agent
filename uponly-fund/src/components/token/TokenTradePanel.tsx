import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { GlassCard, formatPriceSmart } from "@/components/rise/RiseShared";
import { ConnectWalletButton } from "@/components/dashboard/ConnectWalletButton";
import { useRisePortfolioPositionForMint } from "@/hooks/useRisePortfolioPositionForMint";
import { useWalletCollateralBalance } from "@/hooks/useWalletCollateralBalance";
import { useRiseQuote } from "@/lib/RiseDashboardContext";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import { formatPct, formatUsd } from "@/lib/marketDisplayFormat";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY } from "@/lib/dashboardI18n";
import { useWallet } from "@/lib/WalletContext";
import { postRiseBuy, postRiseSell, RiseTradeApiError } from "@/lib/riseTradeApi";
import { submitBase64VersionedTx } from "@/lib/solanaTx";
import {
  SOL_BUY_FEE_RESERVE_HUMAN,
  USDC_MAINNET,
  applySlippageFloor,
  collateralDecimalsForMint,
  formatAmountInputValue,
  humanToRawFloor,
  tokenDecimalsOrDefault,
} from "@/lib/riseAmounts";
import { buildSolscanTxUrl } from "@/lib/riseDashboardApi";
import { toast } from "@/components/ui/sonner";

type Direction = "buy" | "sell";
type AmountPreset = 25 | 50 | "max";

function useDebounced<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function formatTokenBalance(n: number | null, decimals: number): string {
  if (n === null || !Number.isFinite(n)) return "0";
  const d = Number.isFinite(decimals) && decimals >= 0 ? Math.min(decimals, 12) : 6;
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: d,
    minimumFractionDigits: n !== 0 && Math.abs(n) < 1 ? Math.min(4, d) : 0,
  }).format(n);
}

export function TokenTradePanel({
  market,
  className,
}: {
  market: RiseMarketRow | null;
  className?: string;
}) {
  const { language } = useLanguage();
  const t = DASHBOARD_COPY[language].tokenDetail;
  const { publicKey, signTransaction } = useWallet();
  const queryClient = useQueryClient();
  const wallet = publicKey?.trim() ?? null;

  const [direction, setDirection] = useState<Direction>("buy");
  const [amountStr, setAmountStr] = useState("0.1");
  const [humanMode, setHumanMode] = useState(true);
  const [slippagePct, setSlippagePct] = useState<0.5 | 1 | 5>(1);
  const [submitting, setSubmitting] = useState(false);

  const collateralDec = collateralDecimalsForMint(market?.mintMain ?? null);
  const tokenDec = tokenDecimalsOrDefault(market?.tokenDecimals ?? null);
  const collateralLabel = market?.mintMain === USDC_MAINNET ? "USDC" : "SOL";
  const isSolCollateral = market?.mintMain !== USDC_MAINNET;

  const positionQuery = useRisePortfolioPositionForMint(wallet, market?.mint ?? null);
  const collateralQuery = useWalletCollateralBalance(wallet, market?.mintMain ?? null);

  const tokenBalanceHuman = useMemo(() => {
    const raw = positionQuery.data?.balance;
    if (raw == null || !Number.isFinite(raw)) return 0;
    return raw;
  }, [positionQuery.data?.balance]);

  const tokenBalanceRaw = useMemo(
    () => humanToRawFloor(tokenBalanceHuman, tokenDec),
    [tokenBalanceHuman, tokenDec],
  );

  const spendableForPresets = useMemo(() => {
    if (direction === "sell") {
      return {
        human: tokenBalanceHuman,
        raw: tokenBalanceRaw,
        decimals: tokenDec,
        loading: Boolean(wallet) && positionQuery.isPending,
      };
    }
    const col = collateralQuery.data;
    let human = col?.human ?? 0;
    if (isSolCollateral && human > SOL_BUY_FEE_RESERVE_HUMAN) {
      human = Math.max(0, human - SOL_BUY_FEE_RESERVE_HUMAN);
    }
    const raw =
      col != null
        ? isSolCollateral && col.human > SOL_BUY_FEE_RESERVE_HUMAN
          ? Math.max(0, col.raw - humanToRawFloor(SOL_BUY_FEE_RESERVE_HUMAN, collateralDec))
          : col.raw
        : 0;
    return {
      human,
      raw,
      decimals: collateralDec,
      loading: Boolean(wallet) && collateralQuery.isPending,
    };
  }, [
    collateralDec,
    collateralQuery.data,
    collateralQuery.isPending,
    direction,
    isSolCollateral,
    positionQuery.isPending,
    tokenBalanceHuman,
    tokenBalanceRaw,
    tokenDec,
    wallet,
  ]);

  const rawAmountForQuote = useMemo(() => {
    if (!market) return null;
    const trimmed = amountStr.replace(/,/g, "").trim();
    if (humanMode) {
      const n = Number(trimmed);
      if (!Number.isFinite(n) || n <= 0) return null;
      const dec = direction === "buy" ? collateralDec : tokenDec;
      return humanToRawFloor(n, dec);
    }
    const raw = Math.floor(Number(trimmed));
    return Number.isFinite(raw) && raw > 0 ? raw : null;
  }, [amountStr, collateralDec, direction, humanMode, market, tokenDec]);

  const debouncedRaw = useDebounced(rawAmountForQuote, 400);
  const quote = useRiseQuote({ address: market?.mint ?? null, amount: debouncedRaw, direction });
  const q = quote.data?.quote;

  const amountLabel =
    direction === "buy"
      ? humanMode
        ? `${t.tradeAmountBuyHuman} (${collateralLabel})`
        : t.tradeAmountBuyRaw
      : humanMode
        ? `${t.tradeAmountSellHuman} (${market?.symbol || "TOKEN"})`
        : t.tradeAmountSellRaw;

  const applyAmountPreset = useCallback(
    (preset: AmountPreset) => {
      const fraction = preset === "max" ? 1 : preset / 100;
      if (humanMode) {
        const human = spendableForPresets.human * fraction;
        setAmountStr(formatAmountInputValue(human, spendableForPresets.decimals));
        return;
      }
      const raw = Math.floor(spendableForPresets.raw * fraction);
      setAmountStr(raw > 0 ? String(raw) : "0");
    },
    [humanMode, spendableForPresets],
  );

  const presetsDisabled =
    !wallet ||
    spendableForPresets.loading ||
    spendableForPresets.human <= 0 ||
    (direction === "sell" && market?.disableSell);

  const onSubmit = useCallback(async () => {
    if (!market || !publicKey || rawAmountForQuote == null) return;
    setSubmitting(true);
    try {
      const minOut = applySlippageFloor(q?.amountOut ?? null, slippagePct);
      if (direction === "buy") {
        const res = await postRiseBuy(market.mint, {
          wallet: publicKey,
          cashIn: rawAmountForQuote,
          minTokenOut: minOut,
        });
        const sig = await submitBase64VersionedTx(res.transaction, signTransaction);
        const url = buildSolscanTxUrl(sig);
        toast.success(t.tradeSuccessBuy, url ? { action: { label: t.tradeViewSolscan, onClick: () => window.open(url, "_blank") } } : undefined);
      } else {
        const res = await postRiseSell(market.mint, {
          wallet: publicKey,
          tokenIn: rawAmountForQuote,
          minCashOut: minOut,
        });
        const sig = await submitBase64VersionedTx(res.transaction, signTransaction);
        const url = buildSolscanTxUrl(sig);
        toast.success(t.tradeSuccessSell, url ? { action: { label: t.tradeViewSolscan, onClick: () => window.open(url, "_blank") } } : undefined);
      }
      await queryClient.invalidateQueries({ queryKey: ["rise-portfolio-summary", publicKey] });
      await queryClient.invalidateQueries({ queryKey: ["rise-portfolio-positions", publicKey] });
      await queryClient.invalidateQueries({ queryKey: ["rise-portfolio-position-by-mint", publicKey, market.mint] });
      await queryClient.invalidateQueries({ queryKey: ["wallet-collateral-balance", publicKey] });
    } catch (e) {
      const msg = e instanceof RiseTradeApiError ? e.message : e instanceof Error ? e.message : t.tradeErrorGeneric;
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }, [direction, market, publicKey, q?.amountOut, queryClient, rawAmountForQuote, signTransaction, slippagePct, t]);

  if (!market) return null;

  const sellBlocked = market.disableSell && direction === "sell";
  const tokenSymbol = market.symbol ? `$${market.symbol}` : "TOKEN";

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <GlassCard className="border-uof/20 shadow-[0_12px_40px_-16px_hsl(var(--uof)_/_0.35)]">
        <div className="mb-4 border-b border-border/35 pb-3">
          <h3 className="font-display text-lg font-semibold tracking-tight text-foreground">{t.tradePanelTitle}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{t.tradeColumnIntro}</p>
        </div>

        <div className="space-y-4">
          {!publicKey ? (
            <div className="flex flex-col gap-2 rounded-xl border border-border/45 bg-background/35 p-4">
              <p className="text-sm text-muted-foreground">{t.tradeWalletRequired}</p>
              <ConnectWalletButton />
            </div>
          ) : (
            <div className="space-y-2 rounded-xl border border-border/45 bg-background/35 px-3 py-2.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">{t.tradeYourTokenBalance}</span>
                {positionQuery.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                ) : (
                  <span className="font-mono font-medium tabular-nums text-foreground">
                    {formatTokenBalance(tokenBalanceHuman, tokenDec)} {tokenSymbol}
                  </span>
                )}
              </div>
              {direction === "buy" ? (
                <div className="flex items-center justify-between gap-2 border-t border-border/30 pt-2">
                  <span className="text-muted-foreground">{t.tradeAvailableToSpend}</span>
                  {collateralQuery.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  ) : (
                    <span className="font-mono font-medium tabular-nums text-foreground">
                      {formatTokenBalance(collateralQuery.data?.human ?? 0, collateralDec)} {collateralLabel}
                    </span>
                  )}
                </div>
              ) : null}
            </div>
          )}

          <ToggleGroup
            type="single"
            value={direction}
            onValueChange={(v) => {
              if (v === "buy" || v === "sell") setDirection(v);
            }}
            className="grid w-full grid-cols-2 gap-1 rounded-lg border border-border/45 bg-muted/25 p-1"
          >
            <ToggleGroupItem
              value="buy"
              className="rounded-md px-3 py-2 text-sm font-semibold data-[state=on]:bg-emerald-500/20 data-[state=on]:text-emerald-400"
            >
              {t.quoteBuy}
            </ToggleGroupItem>
            <ToggleGroupItem
              value="sell"
              className="rounded-md px-3 py-2 text-sm font-semibold data-[state=on]:bg-red-500/15 data-[state=on]:text-red-400"
              disabled={market.disableSell}
            >
              {t.quoteSell}
            </ToggleGroupItem>
          </ToggleGroup>
          {market.disableSell ? <p className="text-[0.65rem] text-muted-foreground">{t.tradeSellDisabled}</p> : null}

          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="trade-human-mode" className="text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">
              {t.tradeHumanUnits}
            </Label>
            <div className="flex items-center gap-2">
              <Switch id="trade-human-mode" checked={humanMode} onCheckedChange={setHumanMode} />
              <span className="text-xs text-muted-foreground">{humanMode ? t.tradeOn : t.tradeOff}</span>
            </div>
          </div>

          <div>
            <Label className="text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">{amountLabel}</Label>
            <Input
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className="mt-1.5 font-mono tabular-nums"
              inputMode="decimal"
              aria-label={amountLabel}
            />
            <div className="mt-2 flex gap-1.5">
              {([25, 50, "max"] as const).map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 flex-1 border-border/50 px-2 text-xs font-medium tabular-nums"
                  disabled={presetsDisabled}
                  onClick={() => applyAmountPreset(preset)}
                >
                  {preset === "max" ? t.tradePctMax : preset === 25 ? t.tradePct25 : t.tradePct50}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{t.tradeSlippage}</p>
            <ToggleGroup
              type="single"
              value={String(slippagePct)}
              onValueChange={(v) => {
                if (v === "0.5") setSlippagePct(0.5);
                if (v === "1") setSlippagePct(1);
                if (v === "5") setSlippagePct(5);
              }}
              className="mt-2 justify-start gap-1"
            >
              <ToggleGroupItem value="0.5" className="px-3 text-xs">
                0.5%
              </ToggleGroupItem>
              <ToggleGroupItem value="1" className="px-3 text-xs">
                1%
              </ToggleGroupItem>
              <ToggleGroupItem value="5" className="px-3 text-xs">
                5%
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="rounded-xl border border-border/40 bg-background/35 p-4">
            {quote.isFetching ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                …
              </div>
            ) : quote.isError ? (
              <p className="text-sm text-destructive">{(quote.error as Error)?.message ?? "Quote failed"}</p>
            ) : (
              <dl className="grid gap-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">{t.quoteImpact}</dt>
                  <dd className="font-mono tabular-nums">{q?.priceImpact != null ? formatPct(q.priceImpact) : "—"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">{t.quoteAvgFill}</dt>
                  <dd className="font-mono tabular-nums">{formatPriceSmart(q?.averageFillPrice ?? null)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">{t.quoteFee}</dt>
                  <dd className="font-mono tabular-nums">{formatUsd(q?.feeAmountUsd ?? null, { compact: true })}</dd>
                </div>
                <div className="flex justify-between gap-2 border-t border-border/35 pt-2">
                  <dt className="text-muted-foreground">{DASHBOARD_COPY[language].terminal.price}</dt>
                  <dd className="font-mono tabular-nums">{formatPriceSmart(q?.newPrice ?? q?.currentPrice ?? null)}</dd>
                </div>
              </dl>
            )}
          </div>

          <Button
            type="button"
            className={cn(
              "w-full font-semibold",
              direction === "buy"
                ? "bg-emerald-600 hover:bg-emerald-600/90"
                : "bg-red-600 hover:bg-red-600/90",
            )}
            disabled={!publicKey || rawAmountForQuote == null || sellBlocked || submitting}
            onClick={() => void onSubmit()}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                …
              </>
            ) : direction === "buy" ? (
              t.tradeExecuteBuy
            ) : (
              t.tradeExecuteSell
            )}
          </Button>

          <Button asChild variant="outline" className="w-full border-border/55">
            <Link to={`/simulator?mint=${encodeURIComponent(market.mint)}`}>{t.openSimulator}</Link>
          </Button>
          <p className="text-[0.65rem] leading-relaxed text-muted-foreground">{t.tradeFooterRisk}</p>
        </div>
      </GlassCard>
    </div>
  );
}
