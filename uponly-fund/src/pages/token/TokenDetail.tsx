import { lazy, Suspense } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
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
import { EmptyState, GlassCard, shortenMint } from "@/components/rise/RiseShared";

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
    <div className="relative flex flex-col gap-8">
      <div
        className="pointer-events-none absolute inset-x-0 -top-32 z-0 h-[28rem] bg-[radial-gradient(ellipse_72%_56%_at_50%_-8%,hsl(var(--uof)_/_0.13),transparent_56%),radial-gradient(ellipse_48%_42%_at_85%_18%,hsl(215_85%_55%/0.07),transparent_52%),radial-gradient(ellipse_42%_38%_at_12%_28%,hsl(280_70%_50%/0.06),transparent_50%)]"
        aria-hidden
      />

      <div className="relative z-[1] flex flex-col gap-8">
        {isPending && !market ? (
          <>
            <header className="flex flex-col gap-3 border-b border-border/30 pb-5">
              <nav className="flex flex-wrap items-center gap-1.5 text-sm" aria-label="Breadcrumb">
                <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-muted-foreground hover:text-foreground">
                  <Link to="/market">
                    <ArrowLeft className="h-4 w-4" />
                    {t.back}
                  </Link>
                </Button>
                <ChevronRight className="h-4 w-4 text-muted-foreground/45" aria-hidden />
                <Link
                  to="/market"
                  className="rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                >
                  {pages.market}
                </Link>
                <ChevronRight className="h-4 w-4 text-muted-foreground/45" aria-hidden />
                <span className="font-mono text-muted-foreground">{shortenMint(normalizedAddress, 5, 5)}</span>
              </nav>
              <p className="text-sm text-muted-foreground">{t.loadingToken}</p>
            </header>
            <GlassCard>
              <Skeleton className="h-40 w-full rounded-xl" />
            </GlassCard>
          </>
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
            <header className="flex flex-col gap-3 border-b border-border/30 pb-5 sm:pb-6">
              <nav className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm" aria-label="Breadcrumb">
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
              <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{t.pageLayoutIntro}</p>
            </header>

            <TokenHeroHeader market={market} />

            <div className="grid gap-8 lg:grid-cols-3 lg:items-start">
              <div className="order-2 flex min-w-0 flex-col gap-10 lg:order-1 lg:col-span-2">
                <TokenScoreStrip market={market} />
                <Suspense
                  fallback={<Skeleton className="h-[28rem] w-full rounded-2xl" />}
                >
                  <TokenPriceChart market={market} />
                </Suspense>
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
              </div>

              <aside className="order-1 flex min-w-0 flex-col gap-3 lg:sticky lg:top-24 lg:order-2 lg:col-span-1 lg:self-start">
                <div>
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {t.sectionQuote}
                  </p>
                  <p className="mt-1 text-xs leading-snug text-muted-foreground/90">{t.tradeColumnIntro}</p>
                </div>
                <div className="flex flex-col gap-4">
                  <TokenTradePanel market={market} />
                  <TokenBorrowPanel market={market} />
                </div>
              </aside>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
