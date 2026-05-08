import { lazy, Suspense, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { QuoteCalculator } from "@/components/rise/QuoteCalculator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY } from "@/lib/dashboardI18n";

/** Both simulators pull recharts via their child price/curve graphs — defer to keep the simulator route bundle lean. */
const BorrowSimulator = lazy(() =>
  import("@/components/rise/BorrowSimulator").then((mod) => ({ default: mod.BorrowSimulator })),
);
const DcaSimulator = lazy(() =>
  import("@/pages/dashboard/DCA").then((mod) => ({ default: mod.DcaSimulator })),
);

function SimulatorTabFallback() {
  return <Skeleton className="h-[28rem] w-full rounded-2xl" />;
}

const TAB_VALUES = ["quote", "borrow", "dca"] as const;
type SimulatorTab = (typeof TAB_VALUES)[number];

function parseTab(value: string | null): SimulatorTab {
  if (value && TAB_VALUES.includes(value as SimulatorTab)) return value as SimulatorTab;
  return "quote";
}

export default function SimulatorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = useMemo(() => parseTab(searchParams.get("tab")), [searchParams]);
  const { language } = useLanguage();
  const copy = DASHBOARD_COPY[language];

  const setActiveTab = (tab: string) => {
    const nextTab = parseTab(tab);
    const nextParams = new URLSearchParams(searchParams);
    if (nextTab === "quote") nextParams.delete("tab");
    else nextParams.set("tab", nextTab);
    const query = nextParams.toString();
    navigate({ pathname: "/simulator", search: query ? `?${query}` : "" }, { replace: true });
  };

  return (
    <div className="relative flex flex-col gap-8">
      <div
        className="pointer-events-none absolute inset-x-0 -top-32 z-0 h-[26rem] bg-[radial-gradient(ellipse_68%_54%_at_50%_-8%,hsl(var(--uof)_/_0.13),transparent_56%),radial-gradient(ellipse_44%_40%_at_86%_22%,hsl(215_85%_55%/0.07),transparent_52%),radial-gradient(ellipse_38%_34%_at_12%_28%,hsl(280_70%_50%/0.06),transparent_50%)]"
        aria-hidden
      />
      <div className="relative z-[1] flex flex-col gap-8">
        <DashboardPageHeader
          eyebrow={copy.pages.simulatorEyebrow}
          title={copy.pages.simulatorTitle}
          description={copy.pages.simulatorDescription}
        />
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl border border-border/50 bg-card/50 p-1">
            <TabsTrigger value="quote" className="rounded-lg px-3 py-2 text-xs sm:text-sm">
              {copy.tabs.quoteCalculator}
            </TabsTrigger>
            <TabsTrigger value="borrow" className="rounded-lg px-3 py-2 text-xs sm:text-sm">
              {copy.tabs.borrowSimulator}
            </TabsTrigger>
            <TabsTrigger value="dca" className="rounded-lg px-3 py-2 text-xs sm:text-sm">
              {copy.tabs.dcaSimulator}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="quote" className="mt-4">
            <QuoteCalculator />
          </TabsContent>
          <TabsContent value="borrow" className="mt-4">
            <Suspense fallback={<SimulatorTabFallback />}>
              <BorrowSimulator />
            </Suspense>
          </TabsContent>
          <TabsContent value="dca" className="mt-4">
            <Suspense fallback={<SimulatorTabFallback />}>
              <DcaSimulator />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
