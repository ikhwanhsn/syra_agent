import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { AlphaLeaderboard } from "@/components/terminal/AlphaLeaderboard";
import { RiskWatchlist } from "@/components/terminal/RiskWatchlist";
import { TerminalKpiStrip } from "@/components/terminal/TerminalKpiStrip";
import { TerminalScreener } from "@/components/terminal/TerminalScreener";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY } from "@/lib/dashboardI18n";
import { useNavigateToToken } from "@/lib/useNavigateToToken";

export default function TerminalPage() {
  const goToToken = useNavigateToToken();
  const { language } = useLanguage();
  const copy = DASHBOARD_COPY[language];

  return (
    <div className="relative flex flex-col gap-6 overflow-x-clip lg:gap-8">
      <div
        className="pointer-events-none absolute -inset-x-6 -top-4 bottom-0 -z-10 opacity-[0.55] dark:opacity-[0.35] sm:-inset-x-8"
        aria-hidden
      >
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-8%,hsl(var(--success)/0.09),transparent_55%)]"
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_100%_25%,hsl(var(--ring)/0.06),transparent_45%)]"
        />
      </div>

      <DashboardPageHeader
        emphasis="hero"
        eyebrow={copy.pages.terminalEyebrow}
        title={copy.pages.terminalTitle}
        description={copy.pages.terminalDescription}
      />
      <TerminalKpiStrip />
      <TerminalScreener onSelect={goToToken} />
      <div className="grid w-full min-w-0 gap-5 md:grid-cols-2 md:items-stretch lg:gap-6">
        <div className="flex min-h-0 h-full min-w-0">
          <AlphaLeaderboard onSelect={goToToken} />
        </div>
        <div className="flex min-h-0 h-full min-w-0">
          <RiskWatchlist onSelect={goToToken} />
        </div>
      </div>
    </div>
  );
}
