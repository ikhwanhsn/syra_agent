import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calculator, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { GlassCard, formatPriceSmart } from "@/components/rise/RiseShared";
import { useRiseQuote } from "@/lib/RiseDashboardContext";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import { formatPct, formatUsd } from "@/lib/marketDisplayFormat";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY } from "@/lib/dashboardI18n";

type Direction = "buy" | "sell";

function useDebounced<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function TokenQuotePanel({
  market,
  className,
}: {
  market: RiseMarketRow | null;
  className?: string;
}) {
  const { language } = useLanguage();
  const t = DASHBOARD_COPY[language].tokenDetail;
  const [direction, setDirection] = useState<Direction>("buy");
  const [amountStr, setAmountStr] = useState("0.1");

  const amount = useMemo(() => {
    const n = Number(amountStr.replace(/,/g, ""));
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [amountStr]);

  const debouncedAmount = useDebounced(amount, 400);
  const quote = useRiseQuote({ address: market?.mint ?? null, amount: debouncedAmount, direction });
  const q = quote.data?.quote;

  if (!market) return null;

  return (
    <GlassCard className={cn(className)}>
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/45 bg-background/40">
          <Calculator className="h-4 w-4 text-muted-foreground" />
        </span>
        <div className="min-w-0">
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">{t.sectionQuote}</p>
          <h3 className="mt-1 font-display text-lg font-semibold tracking-tight text-foreground">{t.quoteAmount}</h3>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">{t.quoteAmount}</Label>
          <Input
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            className="mt-1.5 font-mono tabular-nums"
            inputMode="decimal"
            aria-label={t.quoteAmount}
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
            <ToggleGroupItem value="sell" className="px-3 text-xs">
              {t.quoteSell}
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

        <Button asChild variant="outline" className="w-full border-border/55">
          <Link to={`/simulator?mint=${encodeURIComponent(market.mint)}`}>{t.openSimulator}</Link>
        </Button>
        <p className="text-[0.65rem] leading-relaxed text-muted-foreground">{t.quoteFooter}</p>
      </div>
    </GlassCard>
  );
}
