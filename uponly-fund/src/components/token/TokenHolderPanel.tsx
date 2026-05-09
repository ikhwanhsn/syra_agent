import { useMemo } from "react";
import { Wallet } from "lucide-react";
import { ConnectWalletButton } from "@/components/dashboard/ConnectWalletButton";
import { GlassCard, SectionHeader, StatTile } from "@/components/rise/RiseShared";
import { useRisePortfolioPositionForMint } from "@/hooks/useRisePortfolioPositionForMint";
import { useWallet } from "@/lib/WalletContext";
import { useRiseQuote } from "@/lib/RiseDashboardContext";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import { formatPct, formatUsd } from "@/lib/marketDisplayFormat";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY } from "@/lib/dashboardI18n";
import { Skeleton } from "@/components/ui/skeleton";

/** Matches default on {@link TokenQuotePanel} so TanStack dedupes the quote request. */
const SUPPLY_PROBE_AMOUNT = 0.1;

function formatTokenHuman(n: number | null, decimals: number): string {
  if (n === null || !Number.isFinite(n)) return "—";
  const d = Number.isFinite(decimals) && decimals >= 0 ? Math.min(decimals, 12) : 6;
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: d,
    minimumFractionDigits: n !== 0 && Math.abs(n) < 1 ? Math.min(4, d) : 0,
  }).format(n);
}

function holderSharePct(balance: number, supply: number | null): number | null {
  if (supply === null || !Number.isFinite(supply) || supply <= 0 || !Number.isFinite(balance)) return null;
  return (balance / supply) * 100;
}

export function TokenHolderPanel({
  market,
  className,
}: {
  market: RiseMarketRow;
  className?: string;
}) {
  const { language } = useLanguage();
  const t = DASHBOARD_COPY[language].tokenDetail;
  const { publicKey } = useWallet();
  const wallet = publicKey?.trim() ?? null;

  const positionQuery = useRisePortfolioPositionForMint(wallet, market.mint);
  const supplyQuote = useRiseQuote({
    address: market.mint,
    amount: SUPPLY_PROBE_AMOUNT,
    direction: "buy",
  });

  const decimals = market.tokenDecimals ?? 6;
  const circulating = supplyQuote.data?.quote?.currentSupply ?? null;

  const balance = useMemo(() => {
    const raw = positionQuery.data?.balance;
    if (raw == null || !Number.isFinite(raw)) return 0;
    return raw;
  }, [positionQuery.data?.balance]);

  const balanceUsd = positionQuery.data?.balanceUsd ?? null;
  const sharePct = wallet ? holderSharePct(balance, circulating) : null;

  const supplyLoading = supplyQuote.isPending;
  const walletMetricsLoading = Boolean(wallet) && positionQuery.isPending;

  return (
    <section className={cn(className)}>
      <SectionHeader
        eyebrow={t.sectionHolder}
        title={t.holderTitle}
        description={t.holderDescription}
        right={wallet ? <ConnectWalletButton /> : undefined}
      />

      <GlassCard>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="min-h-[4.25rem]">
            {supplyLoading ? (
              <Skeleton className="h-full min-h-[4.25rem] w-full rounded-xl" />
            ) : (
              <StatTile
                label={t.holderCirculatingSupply}
                value={<span className="font-mono tabular-nums">{formatTokenHuman(circulating, decimals)}</span>}
                sub={market.symbol ? `$${market.symbol}` : undefined}
              />
            )}
          </div>

          <div className="min-h-[4.25rem]">
            {!wallet ? (
              <StatTile label={t.holderYourBalance} value="—" sub={t.holderConnectToSee} />
            ) : walletMetricsLoading ? (
              <Skeleton className="h-full min-h-[4.25rem] w-full rounded-xl" />
            ) : (
              <StatTile
                label={t.holderYourBalance}
                value={<span className="font-mono tabular-nums">{formatTokenHuman(balance, decimals)}</span>}
                sub={market.symbol ? `$${market.symbol}` : undefined}
              />
            )}
          </div>

          <div className="min-h-[4.25rem]">
            {!wallet ? (
              <StatTile label={t.holderShareOfSupply} value="—" sub={t.holderConnectToSee} />
            ) : walletMetricsLoading ? (
              <Skeleton className="h-full min-h-[4.25rem] w-full rounded-xl" />
            ) : (
              <StatTile
                label={t.holderShareOfSupply}
                value={sharePct != null ? formatPct(sharePct) : "—"}
                accent={sharePct != null && sharePct > 0}
              />
            )}
          </div>

          <div className="min-h-[4.25rem]">
            {!wallet ? (
              <StatTile label={t.holderUsdValue} value="—" sub={t.holderConnectToSee} />
            ) : walletMetricsLoading ? (
              <Skeleton className="h-full min-h-[4.25rem] w-full rounded-xl" />
            ) : (
              <StatTile label={t.holderUsdValue} value={formatUsd(balanceUsd, { compact: true })} />
            )}
          </div>
        </div>

        {!wallet ? (
          <div className="mt-4 flex flex-col gap-3 border-t border-border/35 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/45 bg-background/40">
                <Wallet className="h-5 w-5 text-muted-foreground" aria-hidden />
              </span>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">{t.holderConnectPrompt}</p>
            </div>
            <ConnectWalletButton />
          </div>
        ) : null}

        {(positionQuery.isError || supplyQuote.isError) && (
          <p className="mt-3 text-xs text-destructive">
            {positionQuery.isError
              ? ((positionQuery.error as Error)?.message ?? t.holderErrorPortfolio)
              : ((supplyQuote.error as Error)?.message ?? t.holderErrorSupply)}
          </p>
        )}

        <p className="mt-3 text-[0.68rem] leading-relaxed text-muted-foreground/90">{t.holderFootnote}</p>
      </GlassCard>
    </section>
  );
}
