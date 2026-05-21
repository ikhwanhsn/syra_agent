import { lazy, Suspense, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { RiseTrendingMarkets } from "@/components/rise/RiseTrendingMarkets";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigateToToken } from "@/lib/useNavigateToToken";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY } from "@/lib/dashboardI18n";
import { usePersistentState } from "@/lib/usePersistentState";

/**
 * Bubble map is canvas + simulation + image loader — gated behind an opt-in
 * toggle (default: closed). Cuts JS evaluation + first-paint time on the
 * highest-traffic dashboard route. State persists per-device so power users
 * keep the map open across sessions.
 */
const RiseBubbleMap = lazy(() =>
  import("@/components/rise/BubbleMap").then((mod) => ({ default: mod.RiseBubbleMap })),
);

function BubbleMapFallback() {
  return (
    <div
      className="flex aspect-[4/5] w-full items-center justify-center rounded-2xl border border-border/70 bg-card sm:aspect-video"
      aria-hidden
    >
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/70" />
    </div>
  );
}

export default function TrendingPage() {
  const goToToken = useNavigateToToken();
  const { language } = useLanguage();
  const copy = DASHBOARD_COPY[language];
  const [showBubbleMap, setShowBubbleMap] = usePersistentState<boolean>(
    "trending-show-bubble-map",
    false,
    (raw): raw is boolean => typeof raw === "boolean",
  );

  // Once the user has opened the map we keep it mounted for the rest of the
  // session — closing only hides it. Avoids re-running the simulation on
  // every toggle and matches floorsniffer's pattern (filters stay live).
  const [hasOpened, setHasOpened] = useState<boolean>(showBubbleMap);
  const handleToggle = () => {
    setShowBubbleMap((v) => {
      const next = !v;
      if (next) setHasOpened(true);
      return next;
    });
  };

  const isOpen = showBubbleMap;
  const isMounted = hasOpened;

  return (
    <div className="flex flex-col gap-6 sm:gap-7">
      <DashboardPageHeader
        eyebrow={copy.pages.overviewEyebrow}
        title={copy.pages.overviewTitle}
        description={copy.pages.overviewDescription}
      />
      <RiseTrendingMarkets onSelect={goToToken} />

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:text-xs">
              Bubble map
            </p>
            <p className="mt-0.5 truncate text-[0.7rem] text-muted-foreground/75 sm:text-xs">
              Visual flow of trending markets — opt-in to save first paint.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 px-2.5 text-xs"
            onClick={handleToggle}
            aria-expanded={isOpen}
          >
            {isOpen ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {isOpen ? "Hide" : "Show"}
          </Button>
        </div>

        {isMounted ? (
          <div hidden={!isOpen}>
            <Suspense fallback={<BubbleMapFallback />}>
              <RiseBubbleMap onSelect={goToToken} />
            </Suspense>
          </div>
        ) : null}
      </section>
    </div>
  );
}
