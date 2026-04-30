import { Crown } from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { GlassCard } from "@/components/rise/RiseShared";
import { formatInt, formatUsd } from "@/lib/marketDisplayFormat";
import { useLanguage } from "@/lib/LanguageContext";

const SAMPLE_ROWS = [
  { wallet: "7H••••••e2pX", txCount: 42, volumeUsd: 1823450 },
  { wallet: "A9••••••mQ4s", txCount: 35, volumeUsd: 1510200 },
  { wallet: "C2••••••vN8k", txCount: 29, volumeUsd: 1265700 },
  { wallet: "F6••••••rJ1z", txCount: 23, volumeUsd: 984000 },
  { wallet: "K1••••••pT9m", txCount: 19, volumeUsd: 751300 },
  { wallet: "R3••••••dL7q", txCount: 17, volumeUsd: 603500 },
];

export function WhalesPreview() {
  const { language } = useLanguage();
  const isZh = language === "zh";
  return (
    <div className="flex flex-col gap-6">
      <DashboardPageHeader
        title={isZh ? "巨鲸" : "Whales"}
        description={
          isZh
            ? "基于近期交易量统计，展示 RISE 头部市场中最活跃的钱包。"
            : "Largest active wallets based on recent transaction volume across top RISE markets."
        }
        eyebrow={isZh ? "洞察" : "Insights"}
      />
      <GlassCard>
        <div className="flex flex-col gap-2">
          {SAMPLE_ROWS.map((row, index) => (
            <div
              key={row.wallet}
              className="flex items-center gap-2 rounded-lg border border-border/30 bg-background/20 px-3 py-2.5 text-xs"
            >
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border/55 bg-background/50 text-[10px] font-semibold tabular-nums text-muted-foreground">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 truncate font-mono text-foreground">{row.wallet}</span>
              {index < 3 ? <Crown className="h-3.5 w-3.5 text-amber-400" aria-hidden /> : null}
              <span className="w-24 shrink-0 text-right text-muted-foreground">{formatInt(row.txCount)} {isZh ? "笔" : "tx"}</span>
              <span className="w-24 shrink-0 text-right font-medium text-foreground">
                {formatUsd(row.volumeUsd, { compact: true })}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
