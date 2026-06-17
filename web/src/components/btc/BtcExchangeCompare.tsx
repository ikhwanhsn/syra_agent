import { ArrowLeftRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatBtcPct, formatBtcUsd, type BtcOverview } from "@/lib/btcApi";
import { btcCardInset, btcKickerClass } from "@/components/btc/btcStyles";
import { cn } from "@/lib/utils";
import { BtcShareableSection } from "@/components/btc/share/BtcShareableSection";

function ExchangeTile({
  name,
  pair,
  price,
  loading,
  accent,
}: {
  name: string;
  pair: string;
  price: number | null;
  loading?: boolean;
  accent: "binance" | "coinbase";
}) {
  return (
    <div className={cn(btcCardInset, "relative overflow-hidden p-4 sm:p-5")}>
      <div
        className={cn(
          "pointer-events-none absolute inset-0 opacity-60",
          accent === "binance"
            ? "bg-gradient-to-br from-[#F3BA2F]/8 to-transparent"
            : "bg-gradient-to-br from-[#2563eb]/8 to-transparent",
        )}
        aria-hidden
      />
      <div className="relative">
        <div className="flex items-center justify-between gap-2">
          <p className={btcKickerClass}>{name}</p>
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              accent === "binance" ? "bg-[#F3BA2F]" : "bg-[#2563eb]",
            )}
            aria-hidden
          />
        </div>
        {loading ? (
          <div className="mt-3 h-8 w-36 animate-pulse rounded-lg bg-muted/35" />
        ) : (
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums tracking-tight text-foreground">
            {formatBtcUsd(price, 2)}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">{pair}</p>
      </div>
    </div>
  );
}

export function BtcExchangeCompare({
  overview,
  loading,
}: {
  overview: BtcOverview | undefined;
  loading?: boolean;
}) {
  const binance = overview?.exchanges.binance.priceUsd ?? null;
  const coinbase = overview?.exchanges.coinbase.priceUsd ?? null;
  const premium = overview?.exchanges.coinbasePremiumPct ?? null;
  const premiumUp = premium != null && premium > 0;
  const premiumDown = premium != null && premium < 0;

  const mid =
    binance != null && coinbase != null ? (binance + coinbase) / 2 : null;
  const spreadWidth =
    binance != null && coinbase != null && mid != null && mid > 0
      ? Math.min(100, (Math.abs(coinbase - binance) / mid) * 100 * 40)
      : 0;

  return (
    <BtcShareableSection
      id="section-exchanges"
      kicker="Venues"
      title="Exchange price compare"
      description="Spot BTC on Binance vs Coinbase — premium shows Coinbase relative to Binance."
      shareSlug="exchange-compare"
      loading={loading}
      empty={binance == null && coinbase == null}
      capturedAt={overview?.computedAt}
      accent="blue"
      shareLines={[
        binance != null ? `Binance: ${formatBtcUsd(binance, 2)}` : "",
        coinbase != null ? `Coinbase: ${formatBtcUsd(coinbase, 2)}` : "",
        premium != null ? `Premium: ${formatBtcPct(premium)}` : "",
      ].filter(Boolean)}
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-background/40">
          <ArrowLeftRight className="h-4 w-4 text-primary" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">Cross-exchange spot</p>
          <p className="text-xs text-muted-foreground">Real-time venue divergence</p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
        <ExchangeTile name="Binance" pair="BTCUSDT" price={binance} loading={loading} accent="binance" />

        <div className="flex flex-col items-center justify-center gap-2 px-2 py-3 lg:py-0">
          <div className="hidden h-px w-full bg-border/50 lg:block" />
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-border/45 bg-background/30 px-4 py-3 text-center backdrop-blur-sm">
            <p className={btcKickerClass}>Premium</p>
            {loading ? (
              <div className="h-7 w-16 animate-pulse rounded-md bg-muted/35" />
            ) : (
              <p
                className={cn(
                  "font-mono text-xl font-semibold tabular-nums",
                  premiumUp && "text-emerald-600 dark:text-emerald-400",
                  premiumDown && "text-red-600 dark:text-red-400",
                )}
              >
                {formatBtcPct(premium)}
              </p>
            )}
            {premium != null ? (
              <Badge variant="outline" className="rounded-full text-[10px]">
                {premiumUp ? "Coinbase premium" : premiumDown ? "Coinbase discount" : "Parity"}
              </Badge>
            ) : null}
          </div>
          <div className="relative h-1.5 w-full max-w-[120px] overflow-hidden rounded-full bg-muted/40 lg:max-w-none">
            <div
              className={cn(
                "absolute inset-y-0 left-1/2 -translate-x-1/2 rounded-full",
                premiumUp ? "bg-emerald-500/70" : premiumDown ? "bg-red-500/70" : "bg-muted-foreground/40",
              )}
              style={{ width: `${Math.max(8, spreadWidth)}%` }}
            />
          </div>
          <div className="hidden h-px w-full bg-border/50 lg:block" />
        </div>

        <ExchangeTile name="Coinbase" pair="BTC-USD" price={coinbase} loading={loading} accent="coinbase" />
      </div>
    </BtcShareableSection>
  );
}
