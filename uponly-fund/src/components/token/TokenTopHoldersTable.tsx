import { ExternalLink } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, GlassCard, SectionHeader, shortenMint } from "@/components/rise/RiseShared";
import { buildSolscanAccountUrl } from "@/lib/riseDashboardApi";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import { useRiseTokenTopHolders } from "@/lib/RiseDashboardContext";
import { formatPct } from "@/lib/marketDisplayFormat";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY } from "@/lib/dashboardI18n";
import { useWallet } from "@/lib/WalletContext";

function formatBalanceHuman(n: number | null, decimals: number): string {
  if (n === null || !Number.isFinite(n)) return "—";
  const d = Number.isFinite(decimals) && decimals >= 0 ? Math.min(decimals, 12) : 6;
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: d,
    minimumFractionDigits: n !== 0 && Math.abs(n) < 1 ? Math.min(4, d) : 0,
  }).format(n);
}

export function TokenTopHoldersTable({
  market,
  className,
}: {
  market: RiseMarketRow;
  className?: string;
}) {
  const { language } = useLanguage();
  const t = DASHBOARD_COPY[language].tokenDetail;
  const { publicKey } = useWallet();
  const viewer = publicKey?.trim() ?? null;

  const address = market.marketAddress || market.mint;
  const holdersQuery = useRiseTokenTopHolders(address, 20);
  const decimals = market.tokenDecimals ?? 6;
  const rows = holdersQuery.data?.holders ?? [];
  const supplyHuman = holdersQuery.data?.supplyHuman ?? null;
  const top10 = holdersQuery.data?.top10ConcentrationPct ?? null;

  return (
    <GlassCard padded={false} className={className}>
      <div className="border-b border-border/40 px-4 py-4 sm:px-6">
        <SectionHeader
          eyebrow={t.sectionTopHolders}
          title={t.topHoldersTitle}
          description={t.topHoldersDescription}
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-border/40 bg-background/30 p-3">
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {t.topHoldersMintSupply}
            </p>
            <p className="mt-2 font-mono text-lg font-semibold tabular-nums text-foreground">
              {holdersQuery.isPending ? "…" : formatBalanceHuman(supplyHuman, decimals)}
            </p>
            {market.symbol ? (
              <p className="mt-0.5 text-[0.65rem] text-muted-foreground">${market.symbol}</p>
            ) : null}
          </div>
          <div className="rounded-xl border border-border/40 bg-background/30 p-3">
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {t.topHoldersTop10Conc}
            </p>
            <p className="mt-2 font-mono text-lg font-semibold tabular-nums text-foreground">
              {holdersQuery.isPending ? "…" : top10 != null ? formatPct(top10) : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-border/40 bg-background/30 p-3">
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {t.kpiHolders}
            </p>
            <p className="mt-2 font-mono text-lg font-semibold tabular-nums text-foreground">
              {market.holders != null ? new Intl.NumberFormat(undefined).format(market.holders) : "—"}
            </p>
            <p className="mt-0.5 text-[0.65rem] leading-snug text-muted-foreground">{t.topHoldersRiseHoldersHint}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6">
        {holdersQuery.isPending ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-lg" />
            ))}
          </div>
        ) : holdersQuery.isError ? (
          <p className="text-sm text-destructive">
            {(holdersQuery.error as Error)?.message ?? t.topHoldersError}
          </p>
        ) : rows.length === 0 ? (
          <EmptyState title={t.chartNoData} description={t.topHoldersEmpty} />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/40">
            <Table className="text-xs tabular-nums">
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/40">
                  <TableHead className="h-9 w-10 px-2 text-[0.65rem] uppercase tracking-wider">
                    {t.topHoldersRank}
                  </TableHead>
                  <TableHead className="h-9 px-2 text-[0.65rem] uppercase tracking-wider">
                    {t.topHoldersWallet}
                  </TableHead>
                  <TableHead className="h-9 px-2 text-right text-[0.65rem] uppercase tracking-wider">
                    {t.topHoldersBalance}
                  </TableHead>
                  <TableHead className="h-9 px-2 text-right text-[0.65rem] uppercase tracking-wider">
                    {t.topHoldersShare}
                  </TableHead>
                  <TableHead className="h-9 w-10 px-2 text-center text-[0.65rem] uppercase tracking-wider">
                    <span className="sr-only">{t.topHoldersExplorer}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const isYou = Boolean(viewer && row.wallet && viewer === row.wallet);
                  const walletUrl = row.wallet ? buildSolscanAccountUrl(row.wallet) : null;
                  const tokenAccUrl = buildSolscanAccountUrl(row.tokenAccount);
                  return (
                    <TableRow
                      key={row.tokenAccount}
                      className={cn("border-border/25", isYou && "bg-primary/[0.06]")}
                    >
                      <TableCell className="px-2 py-2 font-mono text-muted-foreground">{row.rank}</TableCell>
                      <TableCell className="px-2 py-2 font-mono text-[0.65rem]">
                        {row.wallet ? (
                          <span className="inline-flex flex-wrap items-center gap-1.5">
                            <a
                              href={walletUrl ?? undefined}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground hover:underline"
                              title={row.wallet}
                            >
                              {shortenMint(row.wallet, 4, 4)}
                            </a>
                            {isYou ? (
                              <span className="rounded border border-primary/35 bg-primary/10 px-1 py-0 text-[0.55rem] font-semibold uppercase tracking-wide text-primary">
                                {t.topHoldersYou}
                              </span>
                            ) : null}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">{t.topHoldersUnknownWallet}</span>
                        )}
                      </TableCell>
                      <TableCell className="px-2 py-2 text-right font-mono">
                        {formatBalanceHuman(row.balanceHuman, decimals)}
                      </TableCell>
                      <TableCell className="px-2 py-2 text-right font-mono">
                        {row.sharePct != null ? formatPct(row.sharePct) : "—"}
                      </TableCell>
                      <TableCell className="px-2 py-2 text-center">
                        {tokenAccUrl ? (
                          <a
                            href={tokenAccUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex text-muted-foreground hover:text-foreground"
                            title={t.topHoldersTokenAccountHint}
                            aria-label={t.topHoldersExplorer}
                          >
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                          </a>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <p className="mt-3 text-[0.68rem] leading-relaxed text-muted-foreground/90">{t.topHoldersFootnote}</p>
      </div>
    </GlassCard>
  );
}
