import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { TokenGate } from "@/components/dashboard/TokenGate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityLive } from "@/pages/dashboard/Activity";
import { WhalesLive } from "@/pages/dashboard/Whales";
import { SignalsLive } from "@/pages/dashboard/Signals";
import { NewsLive } from "@/pages/dashboard/News";
import { ActivityPreview } from "@/pages/dashboard/previews/ActivityPreview";
import { WhalesPreview } from "@/pages/dashboard/previews/WhalesPreview";
import { SignalsPreview } from "@/pages/dashboard/previews/SignalsPreview";
import { NewsPreview } from "@/pages/dashboard/previews/NewsPreview";

const TAB_VALUES = ["activity", "whales", "signals", "news"] as const;
type InsightsTab = (typeof TAB_VALUES)[number];

function parseTab(value: string | null): InsightsTab {
  if (value && TAB_VALUES.includes(value as InsightsTab)) return value as InsightsTab;
  return "activity";
}

function InsightsPreview() {
  return (
    <div className="flex flex-col gap-4">
      <ActivityPreview />
      <WhalesPreview />
      <SignalsPreview />
      <NewsPreview />
    </div>
  );
}

export default function InsightsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = useMemo(() => parseTab(searchParams.get("tab")), [searchParams]);

  const setActiveTab = (tab: string) => {
    const nextTab = parseTab(tab);
    const nextParams = new URLSearchParams(searchParams);
    if (nextTab === "activity") nextParams.delete("tab");
    else nextParams.set("tab", nextTab);
    const query = nextParams.toString();
    navigate({ pathname: "/dashboard/insights", search: query ? `?${query}` : "" }, { replace: true });
  };

  return (
    <TokenGate pageTitle="Insights dashboard" preview={<InsightsPreview />}>
      <div className="relative flex flex-col gap-8">
        <div
          className="pointer-events-none absolute inset-x-0 -top-32 z-0 h-[26rem] bg-[radial-gradient(ellipse_68%_54%_at_50%_-8%,hsl(var(--uof)_/_0.13),transparent_56%),radial-gradient(ellipse_44%_40%_at_86%_22%,hsl(215_85%_55%/0.07),transparent_52%),radial-gradient(ellipse_38%_34%_at_12%_28%,hsl(280_70%_50%/0.06),transparent_50%)]"
          aria-hidden
        />
        <div className="relative z-[1] flex flex-col gap-8">
          <DashboardPageHeader
            eyebrow="Premium intelligence"
            title="Insights dashboard"
            description="Activity feed, whales, signals, and news in one workspace."
          />
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl border border-border/50 bg-card/50 p-1">
              <TabsTrigger value="activity" className="rounded-lg px-3 py-2 text-xs sm:text-sm">
                Activity Feed
              </TabsTrigger>
              <TabsTrigger value="whales" className="rounded-lg px-3 py-2 text-xs sm:text-sm">
                Whales
              </TabsTrigger>
              <TabsTrigger value="signals" className="rounded-lg px-3 py-2 text-xs sm:text-sm">
                Signals
              </TabsTrigger>
              <TabsTrigger value="news" className="rounded-lg px-3 py-2 text-xs sm:text-sm">
                News
              </TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="mt-4">
              <ActivityLive />
            </TabsContent>
            <TabsContent value="whales" className="mt-4">
              <WhalesLive />
            </TabsContent>
            <TabsContent value="signals" className="mt-4">
              <SignalsLive />
            </TabsContent>
            <TabsContent value="news" className="mt-4">
              <NewsLive />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </TokenGate>
  );
}
