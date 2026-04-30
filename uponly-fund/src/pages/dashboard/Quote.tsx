import { QuoteCalculator } from "@/components/rise/QuoteCalculator";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { useLanguage } from "@/lib/LanguageContext";

export default function QuotePage() {
  const { language } = useLanguage();
  const isZh = language === "zh";

  return (
    <div className="relative flex flex-col gap-8">
      <div
        className="pointer-events-none absolute inset-x-0 -top-32 z-0 h-[26rem] bg-[radial-gradient(ellipse_68%_54%_at_50%_-8%,hsl(var(--uof)_/_0.13),transparent_56%),radial-gradient(ellipse_44%_40%_at_86%_22%,hsl(215_85%_55%/0.07),transparent_52%),radial-gradient(ellipse_38%_34%_at_12%_28%,hsl(280_70%_50%/0.06),transparent_50%)]"
        aria-hidden
      />
      <div className="relative z-[1] flex flex-col gap-8">
        <DashboardPageHeader
          eyebrow={isZh ? "执行预览" : "Execution preview"}
          title={isZh ? "报价计算器" : "Quote calculator"}
          description={
            isZh
              ? "在绑定曲线上模拟买卖成交：手续费、平均成交价与价格影响，全程无需签名。实盘请在 RISE 执行。"
              : "Model buy and sell fills against the bonding curve-fees, average fill, and price impact-without signing. Use RISE for live execution."
          }
        />
        <QuoteCalculator />
      </div>
    </div>
  );
}
