import { lazy, Suspense } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { TokenBorrowPanel } from "@/components/token/TokenBorrowPanel";
import { TokenDetailTabs } from "@/components/token/TokenDetailTabs";
import { TokenHeroHeader } from "@/components/token/TokenHeroHeader";
import { TokenInsightsBar } from "@/components/token/TokenInsightsBar";
import { TokenStatsBar } from "@/components/token/TokenStatsBar";
import { TokenTradePanel } from "@/components/token/TokenTradePanel";
import { EmptyState, GlassCard, shortenMint } from "@/components/rise/RiseShared";

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
  const pages = copy.pages;

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
    <div className="relative flex flex-col gap-5 sm:gap-6">
      <div
        className="pointer-events-none absolute inset-x-0 -top-32 z-0 h-[24rem] bg-[radial-gradient(ellipse_72%_56%_at_50%_-8%,hsl(var(--uof)_/_0.11),transparent_58%)]"
        aria-hidden
      />

      <div className="relative z-[1] flex flex-col gap-5 sm:gap-6">
        {isPending && !market ? (
          <header className="flex items-center gap-2 border-b border-border/30 pb-4">
            <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5 px-2">
              <Link to="/market">
                <ArrowLeft className="h-4 w-4" />
                {t.back}
              </Link>
            </Button>
            <Skeleton className="h-4 w-32" />
          </header>
        ) : null}

        {!isPending && !market ? (
          <>
            <DashboardPageHeader
              eyebrow={t.eyebrow}
              title={t.notFoundTitle}
              description={t.notFoundDescription}
              right={
                <Button asChild variant="outline" size="sm" className="gap-2 border-border/55">
                  <Link to="/market">
                    <ArrowLeft className="h-4 w-4" />
                    {t.back}
                  </Link>
                </Button>
              }
            />
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
          </>
        ) : null}

        {market ? (
          <>
            <nav className="flex min-w-0 flex-wrap items-center gap-1 text-sm" aria-label="Breadcrumb">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-8 shrink-0 gap-1.5 px-2 text-muted-foreground hover:text-foreground"
              >
                <Link to="/market">
                  <ArrowLeft className="h-4 w-4" />
                  {t.back}
                </Link>
              </Button>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/45" aria-hidden />
              <Link
                to="/market"
                className="truncate rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
              >
                {pages.market}
              </Link>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/45" aria-hidden />
              <span className="truncate font-medium text-foreground" aria-current="page">
                {market.symbol ? `$${market.symbol}` : market.name || shortenMint(market.mint)}
              </span>
            </nav>

            <TokenHeroHeader market={market} />
            <TokenStatsBar market={market} />
            <TokenInsightsBar market={market} />

            <div className="grid gap-5 lg:min-h-[min(44rem,calc(100vh-13rem))] lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:grid-rows-[auto_minmax(0,1fr)] lg:items-stretch lg:gap-6">
              <div className="min-w-0 lg:col-start-1 lg:row-start-1">
                <Suspense fallback={<Skeleton className="h-[22rem] w-full rounded-2xl sm:h-[26rem]" />}>
                  <TokenPriceChart market={market} />
                </Suspense>
              </div>

              <aside className="flex min-h-0 min-w-0 flex-col gap-3 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:sticky lg:top-20 lg:self-start">
                <TokenTradePanel market={market} />
                <TokenBorrowPanel market={market} />
              </aside>

              <div className="flex min-h-0 min-w-0 flex-col lg:col-start-1 lg:row-start-2">
                <TokenDetailTabs
                  market={market}
                  aggregate={aggregate.data}
                  all={universe}
                  className="flex min-h-0 flex-1 flex-col"
                />
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
