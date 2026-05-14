import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calculator, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { GlassCard, formatPriceSmart } from "@/components/rise/RiseShared";
import { ConnectWalletButton } from "@/components/dashboard/ConnectWalletButton";
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
  applySlippageFloor,
  collateralDecimalsForMint,
  humanToRawFloor,
  tokenDecimalsOrDefault,
} from "@/lib/riseAmounts";
import { buildSolscanTxUrl } from "@/lib/riseDashboardApi";
import { toast } from "@/components/ui/sonner";

type Direction = "buy" | "sell";

function useDebounced<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
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

  const [direction, setDirection] = useState<Direction>("buy");
  const [amountStr, setAmountStr] = useState("0.1");
  const [humanMode, setHumanMode] = useState(true);
  const [slippagePct, setSlippagePct] = useState<0.5 | 1 | 5>(1);
  const [submitting, setSubmitting] = useState(false);

  const collateralDec = collateralDecimalsForMint(market?.mintMain ?? null);
  const tokenDec = tokenDecimalsOrDefault(market?.tokenDecimals ?? null);

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

  const collateralLabel = market?.mintMain === "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" ? "USDC" : "SOL";
  const amountLabel =
    direction === "buy"
      ? humanMode
        ? `${t.tradeAmountBuyHuman} (${collateralLabel})`
        : t.tradeAmountBuyRaw
      : humanMode
        ? `${t.tradeAmountSellHuman} (${market?.symbol || "TOKEN"})`
        : t.tradeAmountSellRaw;

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
    } catch (e) {
      const msg = e instanceof RiseTradeApiError ? e.message : e instanceof Error ? e.message : t.tradeErrorGeneric;
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }, [direction, market, publicKey, q?.amountOut, queryClient, rawAmountForQuote, signTransaction, slippagePct, t]);

  if (!market) return null;

  const sellBlocked = market.disableSell && direction === "sell";

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <GlassCard>
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/45 bg-background/40">
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </span>
          <div className="min-w-0">
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">{t.sectionQuote}</p>
            <h3 className="mt-1 font-display text-lg font-semibold tracking-tight text-foreground">{t.tradePanelTitle}</h3>
          </div>
        </div>

        <div className="space-y-4">
          {!publicKey ? (
            <div className="flex flex-col gap-2 rounded-xl border border-border/45 bg-background/35 p-4">
              <p className="text-sm text-muted-foreground">{t.tradeWalletRequired}</p>
              <ConnectWalletButton />
            </div>
          ) : null}

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
          </div>

          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {DASHBOARD_COPY[language].terminal.trade}
            </p>
            <ToggleGroup
              type="single"
              value={direction}
              onValueChange={(v) => {
                if (v === "buy" || v === "sell") setDirection(v);
              }}
              className="mt-2 justify-start gap-1"
            >
              <ToggleGroupItem value="buy" className="px-3 text-xs">
                {t.quoteBuy}
              </ToggleGroupItem>
              <ToggleGroupItem value="sell" className="px-3 text-xs" disabled={market.disableSell}>
                {t.quoteSell}
              </ToggleGroupItem>
            </ToggleGroup>
            {market.disableSell ? <p className="mt-1 text-[0.65rem] text-muted-foreground">{t.tradeSellDisabled}</p> : null}
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
            className="w-full"
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
