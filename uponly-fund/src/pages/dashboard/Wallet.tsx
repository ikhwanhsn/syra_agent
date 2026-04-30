import { WalletLookup } from "@/components/rise/WalletLookup";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY } from "@/lib/dashboardI18n";

export default function WalletPage() {
  const { language } = useLanguage();
  const copy = DASHBOARD_COPY[language];

  return (
    <div className="relative flex flex-col gap-8">
      <div
        className="pointer-events-none absolute inset-x-0 -top-32 z-0 h-[26rem] bg-[radial-gradient(ellipse_68%_54%_at_50%_-8%,hsl(var(--uof)_/_0.13),transparent_56%),radial-gradient(ellipse_44%_40%_at_86%_22%,hsl(215_85%_55%/0.07),transparent_52%),radial-gradient(ellipse_38%_34%_at_12%_28%,hsl(280_70%_50%/0.06),transparent_50%)]"
        aria-hidden
      />
      <div className="relative z-[1] flex flex-col gap-8">
        <DashboardPageHeader
          eyebrow={copy.pages.walletEyebrow}
          title={copy.pages.walletTitle}
          description={copy.pages.walletDescription}
        />
        <WalletLookup />
      </div>
    </div>
  );
}
