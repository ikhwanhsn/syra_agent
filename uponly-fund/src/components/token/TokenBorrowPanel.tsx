import { useEffect, useMemo, useState } from "react";
import { Banknote, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { GlassCard } from "@/components/rise/RiseShared";
import { ConnectWalletButton } from "@/components/dashboard/ConnectWalletButton";
import { useRiseBorrowQuote } from "@/lib/RiseDashboardContext";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import { formatUsd } from "@/lib/marketDisplayFormat";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY } from "@/lib/dashboardI18n";
import { useWallet } from "@/lib/WalletContext";
import { postRiseDepositAndBorrow, postRiseRepayAndWithdraw, RiseTradeApiError } from "@/lib/riseTradeApi";
import { submitBase64VersionedTx } from "@/lib/solanaTx";
import { collateralDecimalsForMint, humanToRawFloor } from "@/lib/riseAmounts";
import { buildSolscanTxUrl } from "@/lib/riseDashboardApi";
import { toast } from "@/components/ui/sonner";

type BorrowMode = "borrow" | "repay";

function useDebounced<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function TokenBorrowPanel({
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

  const [mode, setMode] = useState<BorrowMode>("borrow");
  const [amountStr, setAmountStr] = useState("0.05");
  const [submitting, setSubmitting] = useState(false);

  const collateralDec = collateralDecimalsForMint(market?.mintMain ?? null);
  const collateralLabel = market?.mintMain === "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" ? "USDC" : "SOL";

  const borrowHuman = useMemo(() => {
    const n = Number(amountStr.replace(/,/g, ""));
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [amountStr]);

  const debouncedBorrowHuman = useDebounced(borrowHuman, 400);
  const borrowRawForQuote =
    debouncedBorrowHuman != null ? humanToRawFloor(debouncedBorrowHuman, collateralDec) : 0;

  const quote = useRiseBorrowQuote({
    address: market?.mint ?? null,
    wallet: publicKey,
    amountToBorrow: mode === "borrow" ? borrowRawForQuote : 0,
  });
  const q = quote.data?.quote;

  const repayWithdrawRaw = useMemo(() => {
    if (mode !== "repay") return null;
    const n = Number(amountStr.replace(/,/g, ""));
    if (!Number.isFinite(n) || n <= 0) return null;
    return humanToRawFloor(n, collateralDec);
  }, [amountStr, collateralDec, mode]);

  const onSubmit = async () => {
    if (!market || !publicKey) return;
    setSubmitting(true);
    try {
      if (mode === "borrow") {
        const human = Number(amountStr.replace(/,/g, ""));
        if (!Number.isFinite(human) || human <= 0) {
          toast.error(t.borrowInvalidAmount);
          return;
        }
        const borrowAmount = humanToRawFloor(human, collateralDec);
        const res = await postRiseDepositAndBorrow(market.mint, { wallet: publicKey, borrowAmount });
        const sig = await submitBase64VersionedTx(res.transaction, signTransaction);
        const url = buildSolscanTxUrl(sig);
        toast.success(
          t.borrowSuccess,
          url ? { action: { label: t.tradeViewSolscan, onClick: () => window.open(url, "_blank") } } : undefined,
        );
      } else {
        if (repayWithdrawRaw == null) {
          toast.error(t.borrowInvalidAmount);
          return;
        }
        const res = await postRiseRepayAndWithdraw(market.mint, {
          wallet: publicKey,
          withdrawAmount: repayWithdrawRaw,
        });
        const sig = await submitBase64VersionedTx(res.transaction, signTransaction);
        const url = buildSolscanTxUrl(sig);
        toast.success(
          t.repaySuccess,
          url ? { action: { label: t.tradeViewSolscan, onClick: () => window.open(url, "_blank") } } : undefined,
        );
      }
      await queryClient.invalidateQueries({ queryKey: ["rise-portfolio-summary", publicKey] });
      await queryClient.invalidateQueries({ queryKey: ["rise-portfolio-positions", publicKey] });
      await queryClient.invalidateQueries({ queryKey: ["rise-borrow-quote"] });
    } catch (e) {
      const msg = e instanceof RiseTradeApiError ? e.message : e instanceof Error ? e.message : t.tradeErrorGeneric;
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!market) return null;

  return (
    <GlassCard className={cn("border-border/50", className)}>
      <div className="mb-4 border-b border-border/35 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/45 bg-background/40">
            <Banknote className="h-4 w-4 text-muted-foreground" aria-hidden />
          </span>
          <div>
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {t.borrowPanelEyebrow}
            </p>
            <h3 className="font-display text-lg font-semibold tracking-tight text-foreground">{t.borrowPanelTitle}</h3>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {!publicKey ? (
          <div className="flex flex-col gap-2 rounded-xl border border-border/45 bg-background/35 p-4">
            <p className="text-sm text-muted-foreground">{t.tradeWalletRequired}</p>
            <ConnectWalletButton />
          </div>
        ) : null}

        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(v) => {
            if (v === "borrow" || v === "repay") setMode(v);
          }}
          className="grid w-full grid-cols-2 gap-1 rounded-lg border border-border/45 bg-muted/25 p-1"
        >
          <ToggleGroupItem
            value="borrow"
            className="rounded-md px-3 py-2 text-sm font-semibold data-[state=on]:bg-amber-500/15 data-[state=on]:text-amber-300"
          >
            {t.borrowModeBorrow}
          </ToggleGroupItem>
          <ToggleGroupItem
            value="repay"
            className="rounded-md px-3 py-2 text-sm font-semibold data-[state=on]:bg-sky-500/15 data-[state=on]:text-sky-300"
          >
            {t.borrowModeRepay}
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="rounded-xl border border-border/40 bg-background/35 p-4">
          {quote.isFetching ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              …
            </div>
          ) : quote.isError ? (
            <p className="text-sm text-destructive">{(quote.error as Error)?.message ?? "Quote failed"}</p>
          ) : (
            <dl className="grid gap-2.5 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">{t.borrowMax}</dt>
                <dd className="font-mono tabular-nums font-medium">{formatUsd(q?.maxBorrowableUsd ?? null, { compact: true })}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">{t.borrowDebt}</dt>
                <dd className="font-mono tabular-nums">{q?.debt != null ? String(q.debt) : "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">{t.borrowFee}</dt>
                <dd className="font-mono tabular-nums">{q?.borrowFeePercent != null ? `${q.borrowFeePercent}%` : "—"}</dd>
              </div>
            </dl>
          )}
        </div>

        <div>
          <Label className="text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">
            {mode === "borrow" ? `${t.borrowAmountLabel} (${collateralLabel})` : `${t.repayWithdrawLabel} (${collateralLabel})`}
          </Label>
          <Input
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            className="mt-1.5 font-mono tabular-nums"
            inputMode="decimal"
          />
        </div>

        <Button
          type="button"
          className={cn(
            "w-full font-semibold",
            mode === "borrow"
              ? "bg-amber-600 hover:bg-amber-600/90"
              : "bg-sky-600 hover:bg-sky-600/90",
          )}
          disabled={!publicKey || submitting}
          onClick={() => void onSubmit()}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              …
            </>
          ) : mode === "borrow" ? (
            t.borrowExecute
          ) : (
            t.repayExecute
          )}
        </Button>
        <p className="text-[0.65rem] leading-relaxed text-muted-foreground">{t.borrowFooterRisk}</p>
      </div>
    </GlassCard>
  );
}
