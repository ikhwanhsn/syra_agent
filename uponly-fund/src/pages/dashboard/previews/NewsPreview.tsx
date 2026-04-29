import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { GlassCard } from "@/components/rise/RiseShared";

const SAMPLE_NEWS = [
  { title: "Solana ecosystem sees liquidity rebound as memecoin floors stabilize", source: "Blockwire", date: "2026-04-28", sentiment: "positive" },
  { title: "Macro desk flags rotation into high-beta crypto assets after CPI print", source: "Atlas Crypto", date: "2026-04-28", sentiment: "neutral" },
  { title: "Whale wallets increase exposure to floor-backed tokens amid risk-on mood", source: "Token Journal", date: "2026-04-27", sentiment: "positive" },
  { title: "Market makers tighten spreads on top Solana pairs during US session", source: "Depth Report", date: "2026-04-27", sentiment: "neutral" },
  { title: "Borrow demand climbs as traders seek leverage without spot exits", source: "Chain Ledger", date: "2026-04-26", sentiment: "positive" },
];

export function NewsPreview() {
  return (
    <div className="flex flex-col gap-6">
      <DashboardPageHeader
        title="News"
        description="Free market headlines from Syra preview news endpoint to keep dashboard context-aware."
        eyebrow="Insights"
      />
      <GlassCard>
        <label htmlFor="news-preview" className="mb-1 block text-xs font-medium text-muted-foreground">
          Ticker (e.g. general, sol, btc)
        </label>
        <input
          id="news-preview"
          disabled
          value="general"
          readOnly
          className="h-10 w-full max-w-xs rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground"
        />
      </GlassCard>
      <GlassCard>
        <div className="flex flex-col gap-2">
          {SAMPLE_NEWS.map((item) => (
            <div key={item.title} className="rounded-lg border border-border/40 bg-background/20 p-3">
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.source} · {item.date} · {item.sentiment}
              </p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
