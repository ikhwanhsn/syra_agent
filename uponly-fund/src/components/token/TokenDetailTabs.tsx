import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TokenAboutPanel } from "@/components/token/TokenAboutPanel";
import { TokenEcosystemRank } from "@/components/token/TokenEcosystemRank";
import { TokenHolderPanel } from "@/components/token/TokenHolderPanel";
import { TokenKpiGrid } from "@/components/token/TokenKpiGrid";
import { TokenLiquidityPanel } from "@/components/token/TokenLiquidityPanel";
import { TokenSimilarMarkets } from "@/components/token/TokenSimilarMarkets";
import { TokenTopHoldersTable } from "@/components/token/TokenTopHoldersTable";
import { TokenTradesPanel } from "@/components/token/TokenTradesPanel";
import type { RiseAggregateResponse, RiseMarketRow } from "@/lib/riseDashboardTypes";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY } from "@/lib/dashboardI18n";

const tabTriggerClass =
  "rounded-lg px-4 py-2 text-xs font-medium transition-colors data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm sm:text-sm";

export function TokenDetailTabs({
  market,
  aggregate,
  all,
  className,
}: {
  market: RiseMarketRow;
  aggregate: RiseAggregateResponse | null | undefined;
  all: RiseMarketRow[];
  className?: string;
}) {
  const { language } = useLanguage();
  const t = DASHBOARD_COPY[language].tokenDetail;

  return (
    <Tabs defaultValue="activity" className={cn("flex h-full min-h-0 w-full flex-col", className)}>
      <TabsList className="h-auto w-full shrink-0 justify-start gap-0.5 overflow-x-auto rounded-xl border border-border/50 bg-muted/30 p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <TabsTrigger value="activity" className={tabTriggerClass}>
          {t.tabActivity}
        </TabsTrigger>
        <TabsTrigger value="holders" className={tabTriggerClass}>
          {t.tabHolders}
        </TabsTrigger>
        <TabsTrigger value="details" className={tabTriggerClass}>
          {t.tabDetails}
        </TabsTrigger>
      </TabsList>

      <TabsContent
        value="activity"
        className="mt-3 flex h-full min-h-0 flex-1 flex-col overflow-hidden focus-visible:outline-none data-[state=inactive]:hidden"
      >
        <TokenTradesPanel market={market} embedded fillHeight />
      </TabsContent>

      <TabsContent value="holders" className="mt-3 space-y-4 focus-visible:outline-none data-[state=inactive]:hidden">
        <TokenHolderPanel market={market} />
        <TokenTopHoldersTable market={market} />
      </TabsContent>

      <TabsContent value="details" className="mt-3 space-y-4 focus-visible:outline-none data-[state=inactive]:hidden">
        <TokenKpiGrid market={market} />
        <div className="grid gap-4 lg:grid-cols-2">
          <TokenLiquidityPanel market={market} aggregate={aggregate} />
          <TokenEcosystemRank market={market} all={all} />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <TokenAboutPanel market={market} className="lg:col-span-1" />
          <TokenSimilarMarkets market={market} all={all} className="lg:col-span-2" />
        </div>
      </TabsContent>
    </Tabs>
  );
}
