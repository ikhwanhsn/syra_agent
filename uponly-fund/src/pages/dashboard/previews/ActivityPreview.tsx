import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { GlassCard } from "@/components/rise/RiseShared";
import { formatUsd } from "@/lib/marketDisplayFormat";

const SAMPLE_TX = [
  { kind: "buy", wallet: "6F••••••e1Mz", amountUsd: 12600, priceUsd: 0.092, time: "11:02:15" },
  { kind: "sell", wallet: "AS••••••r9Qh", amountUsd: 8400, priceUsd: 0.091, time: "11:01:08" },
  { kind: "buy", wallet: "KP••••••p3Ty", amountUsd: 22750, priceUsd: 0.094, time: "10:59:47" },
  { kind: "buy", wallet: "J2••••••m8Ra", amountUsd: 5100, priceUsd: 0.093, time: "10:57:22" },
  { kind: "sell", wallet: "N7••••••w4Ld", amountUsd: 9300, priceUsd: 0.091, time: "10:56:11" },
  { kind: "buy", wallet: "Q4••••••k2Ps", amountUsd: 7800, priceUsd: 0.092, time: "10:54:03" },
  { kind: "sell", wallet: "T1••••••v6Ee", amountUsd: 11300, priceUsd: 0.09, time: "10:52:49" },
  { kind: "buy", wallet: "X8••••••b5Nc", amountUsd: 16900, priceUsd: 0.095, time: "10:51:31" },
];

export function ActivityPreview() {
  return (
    <div className="flex flex-col gap-6">
      <DashboardPageHeader
        title="Activity feed"
        description="Merged cross-market transaction stream from top-volume RISE markets."
        eyebrow="Insights"
        right={
          <div className="flex items-center gap-1 opacity-70">
            {(["ALL", "BUY", "SELL"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                disabled
                className="min-h-10 rounded-md border border-border/45 px-2.5 py-1.5 text-xs font-medium text-muted-foreground"
              >
                {filter}
              </button>
            ))}
          </div>
        }
      />
      <GlassCard>
        <div className="flex flex-col gap-1.5">
          {SAMPLE_TX.map((tx, index) => (
            <div
              key={`${tx.wallet}-${index}`}
              className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-1 rounded-lg border border-border/30 bg-background/20 px-3 py-2.5 text-xs sm:grid-cols-[3.25rem_minmax(0,1fr)_6rem_6rem_6.5rem]"
            >
              <span className="w-12 shrink-0 text-muted-foreground">{tx.kind.toUpperCase()}</span>
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{tx.wallet}</span>
              <span className="w-20 shrink-0 text-right text-foreground">{formatUsd(tx.amountUsd, { compact: true })}</span>
              <span className="w-20 shrink-0 text-right text-muted-foreground">{formatUsd(tx.priceUsd)}</span>
              <span className="w-24 shrink-0 text-right text-muted-foreground">{tx.time}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
