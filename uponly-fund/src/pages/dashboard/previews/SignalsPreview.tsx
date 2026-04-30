import { TrendingUp } from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { GlassCard } from "@/components/rise/RiseShared";
import { useLanguage } from "@/lib/LanguageContext";

const SAMPLE_MACRO = [
  { token: "bitcoin", trend: "Bullish bias", score: "0.68", risk: "Medium" },
  { token: "solana", trend: "Momentum breakout", score: "0.74", risk: "High" },
  { token: "ethereum", trend: "Range recovery", score: "0.59", risk: "Medium" },
];

export function SignalsPreview() {
  const { language } = useLanguage();
  const isZh = language === "zh";
  return (
    <div className="flex flex-col gap-6">
      <DashboardPageHeader
        title={isZh ? "信号" : "Signals"}
        description={
          isZh
            ? "将 Syra 宏观方向信号与 RISE 本地技术指标结合。"
            : "Blend macro directional context from Syra signal endpoints with RISE-native technical indicators."
        }
        eyebrow={isZh ? "洞察" : "Insights"}
      />
      <div className="grid gap-3 lg:grid-cols-3">
        {SAMPLE_MACRO.map((row) => (
          <GlassCard key={row.token}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{row.token}</p>
            </div>
            <div className="mt-2 space-y-1.5 text-xs">
              <p className="flex items-center justify-between gap-2 rounded-md border border-border/40 bg-background/25 px-2 py-1.5">
                <span className="text-muted-foreground">{isZh ? "趋势" : "trend"}</span>
                <span className="font-medium text-foreground">{row.trend}</span>
              </p>
              <p className="flex items-center justify-between gap-2 rounded-md border border-border/40 bg-background/25 px-2 py-1.5">
                <span className="text-muted-foreground">{isZh ? "评分" : "score"}</span>
                <span className="font-medium text-foreground">{row.score}</span>
              </p>
              <p className="flex items-center justify-between gap-2 rounded-md border border-border/40 bg-background/25 px-2 py-1.5">
                <span className="text-muted-foreground">{isZh ? "风险" : "risk"}</span>
                <span className="font-medium text-foreground">{row.risk}</span>
              </p>
            </div>
          </GlassCard>
        ))}
      </div>
      <GlassCard>
        <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <TrendingUp className="h-4 w-4 text-success" /> {isZh ? "UPONLY 技术快照（1h K线）" : "UPONLY technical snapshot (1h candles)"}
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <p className="rounded-lg border border-border/40 bg-background/20 px-3 py-2 text-sm">
            RSI(14): <span className="font-medium text-foreground">58.2</span>
          </p>
          <p className="rounded-lg border border-border/40 bg-background/20 px-3 py-2 text-sm">
            {isZh ? "动量(24)" : "Momentum(24)"}: <span className="font-medium text-foreground">+6.9%</span>
          </p>
          <p className="rounded-lg border border-border/40 bg-background/20 px-3 py-2 text-sm">
            {isZh ? "波动率" : "Volatility"}: <span className="font-medium text-foreground">3.4%</span>
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
