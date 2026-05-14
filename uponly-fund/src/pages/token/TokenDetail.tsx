import { lazy, Suspense } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { TokenAboutPanel } from "@/components/token/TokenAboutPanel";
import { TokenEcosystemRank } from "@/components/token/TokenEcosystemRank";
import { TokenHeroHeader } from "@/components/token/TokenHeroHeader";
import { TokenHolderPanel } from "@/components/token/TokenHolderPanel";
import { TokenKpiGrid } from "@/components/token/TokenKpiGrid";
import { TokenLiquidityPanel } from "@/components/token/TokenLiquidityPanel";
import { TokenBorrowPanel } from "@/components/token/TokenBorrowPanel";
import { TokenTradePanel } from "@/components/token/TokenTradePanel";
import { TokenScoreStrip } from "@/components/token/TokenScoreStrip";
import { TokenSimilarMarkets } from "@/components/token/TokenSimilarMarkets";
import { TokenTopHoldersTable } from "@/components/token/TokenTopHoldersTable";
import { TokenTradesPanel } from "@/components/token/TokenTradesPanel";
import { EmptyState, GlassCard } from "@/components/rise/RiseShared";

/** Recharts is ~120 KB gz; lazy-load so the rest of the token page paints immediately. */
const TokenPriceChart = lazy(() =>
  import("@/components/token/TokenPriceChart").then((mod) => ({ default: mod.TokenPriceChart })),
);
import { useResolveRiseMarket } from "@/hooks/useResolveRiseMarket";
import { useRiseDashboard, useRiseMarketsAll } from "@/lib/RiseDashboardContext";
import { useDocumentMeta } from "@/lib/useDocumentMeta";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY } from "@/lib/dashboardI18n";

export default function TokenDetailPage() {
  const { address } = useParams<{ address: string }>();
  const normalizedAddress = (address ?? "").trim();
  const { language } = useLanguage();
  const copy = DASHBOARD_COPY[language];
  const t = copy.tokenDetail;

  const { market, isPending, marketsQuery } = useResolveRiseMarket(normalizedAddress);
  const { aggregate } = useRiseDashboard();
  const cohort = useRiseMarketsAll(250);

  const titleSymbol = market?.symbol ? `$${market.symbol}` : t.pageTitle;
  useDocumentMeta({
    title: `${titleSymbol} · Up Only Fund`,
    description: t.pageDescription,
    canonicalPath: normalizedAddress ? `/token/${normalizedAddress}` : "/token",
  });

  if (!normalizedAddress) {
    return (
      <div className="relative flex flex-col gap-6">
        <DashboardPageHeader title={t.notFoundTitle} description={t.notFoundDescription} eyebrow={t.eyebrow} />
      </div>
    );
  }

  const universe = cohort.data ?? marketsQuery.data ?? [];

  return (
    <div className="relative flex flex-col gap-6">
      <div
        className="pointer-events-none absolute inset-x-0 -top-32 z-0 h-[28rem] bg-[radial-gradient(ellipse_72%_56%_at_50%_-8%,hsl(var(--uof)_/_0.13),transparent_56%),radial-gradient(ellipse_48%_42%_at_85%_18%,hsl(215_85%_55%/0.07),transparent_52%),radial-gradient(ellipse_42%_38%_at_12%_28%,hsl(280_70%_50%/0.06),transparent_50%)]"
        aria-hidden
      />

      <div className="relative z-[1] flex flex-col gap-6">
        <DashboardPageHeader
          eyebrow={t.eyebrow}
          title={market?.name ?? (isPending ? t.loadingToken : t.notFoundTitle)}
          description={market ? t.pageDescription : t.notFoundDescription}
          right={
            <Button asChild variant="outline" size="sm" className="gap-2 border-border/55">
              <Link to="/market">
                <ArrowLeft className="h-4 w-4" />
                {t.back}
              </Link>
            </Button>
          }
        />

        {isPending && !market ? (
          <GlassCard>
            <Skeleton className="h-40 w-full rounded-xl" />
          </GlassCard>
        ) : null}

        {!isPending && !market ? (
          <GlassCard>
            <EmptyState
              title={t.notFoundTitle}
              description={t.notFoundDescription}
              action={
                <Button asChild>
                  <Link to="/market">{t.browseMarkets}</Link>
                </Button>
              }
            />
          </GlassCard>
        ) : null}

        {market ? (
          <>
            <TokenHeroHeader market={market} />
            <TokenScoreStrip market={market} />
            <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
              <Suspense
                fallback={
                  <div className="lg:col-span-2">
                    <Skeleton className="h-[28rem] w-full rounded-2xl" />
                  </div>
                }
              >
                <TokenPriceChart market={market} className="lg:col-span-2" />
              </Suspense>
              <div className="flex flex-col gap-4 lg:col-span-1">
                <TokenTradePanel market={market} />
                <TokenBorrowPanel market={market} />
              </div>
            </div>
            <TokenKpiGrid market={market} />
            <TokenHolderPanel market={market} />
            <TokenTopHoldersTable market={market} />
            <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
              <TokenLiquidityPanel market={market} aggregate={aggregate.data} />
              <TokenEcosystemRank market={market} all={universe} />
            </div>
            <TokenTradesPanel market={market} />
            <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
              <TokenAboutPanel market={market} className="lg:col-span-1" />
              <TokenSimilarMarkets market={market} all={universe} className="lg:col-span-2" />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
