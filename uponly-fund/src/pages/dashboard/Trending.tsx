import { lazy, Suspense } from "react";
import { RiseTrendingMarkets } from "@/components/rise/RiseTrendingMarkets";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY } from "@/lib/dashboardI18n";
import { useNavigateToToken } from "@/lib/useNavigateToToken";

/** Bubble map is heavy (canvas + simulation hook + image loader) — defer so the
 *  trending table paints first and the user sees data immediately. */
const RiseBubbleMap = lazy(() =>
  import("@/components/rise/BubbleMap").then((mod) => ({ default: mod.RiseBubbleMap })),
);

function BubbleMapFallback() {
  return <Skeleton className="aspect-[4/5] w-full rounded-2xl sm:aspect-video" aria-hidden />;
}

export default function TrendingPage() {
  const goToToken = useNavigateToToken();
  const { language } = useLanguage();
  const copy = DASHBOARD_COPY[language];

  return (
    <div className="relative flex flex-col gap-8">
      <div
        className="pointer-events-none absolute inset-x-0 -top-32 z-0 h-[26rem] bg-[radial-gradient(ellipse_72%_56%_at_50%_-8%,hsl(var(--uof)_/_0.13),transparent_56%),radial-gradient(ellipse_48%_42%_at_85%_18%,hsl(215_85%_55%/0.07),transparent_52%),radial-gradient(ellipse_42%_38%_at_12%_28%,hsl(280_70%_50%/0.06),transparent_50%)]"
        aria-hidden
      />
      <div className="relative z-[1] flex flex-col gap-8">
        <DashboardPageHeader
          eyebrow={copy.pages.overviewEyebrow}
          title={copy.pages.overviewTitle}
          description={copy.pages.overviewDescription}
        />
        <RiseTrendingMarkets onSelect={goToToken} />
        <Suspense fallback={<BubbleMapFallback />}>
          <RiseBubbleMap onSelect={goToToken} />
        </Suspense>
      </div>
    </div>
  );
}
