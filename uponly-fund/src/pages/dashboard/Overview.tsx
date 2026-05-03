import { TopMoversRails } from "@/components/rise/TopMoversRails";
import { UponlySpotlight } from "@/components/rise/UponlySpotlight";
import { FundCommandHero } from "@/components/dashboard/FundCommandHero";
import { AllocationPanel } from "@/components/dashboard/AllocationPanel";
import { AgentActivityFeed } from "@/components/dashboard/AgentActivityFeed";
import { useLanguage } from "@/lib/LanguageContext";
import { useNavigateToToken } from "@/lib/useNavigateToToken";

export default function DashboardOverview() {
  const { language } = useLanguage();
  const isZh = language === "zh";
  const goToToken = useNavigateToToken();

  return (
    <div className="flex flex-col gap-6">
      <FundCommandHero />
      <div className="grid gap-4 lg:grid-cols-3">
        <AllocationPanel className="lg:col-span-2" onSelect={goToToken} />
        <AgentActivityFeed />
      </div>
      <TopMoversRails
        onSelect={goToToken}
        eyebrow={isZh ? "ALPHA 轨道" : "ALPHA RAILS"}
        title={isZh ? "今日 Alpha 候选" : "Today's alpha picks"}
        description={isZh ? "按 24h 信号评分对 RISE 全市场排序。" : "Ranked by 24h signal score across the RISE universe."}
      />
      <UponlySpotlight />
    </div>
  );
}
