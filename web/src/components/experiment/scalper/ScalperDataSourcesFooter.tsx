import { Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";

export interface ScalperDataSourcesFooterProps {
  dataSources: {
    btcPrice: string;
    equityPrices: string;
    fills: string;
    venue: string;
  } | undefined;
  className?: string;
}

export function ScalperDataSourcesFooter({ dataSources, className }: ScalperDataSourcesFooterProps) {
  if (!dataSources) return null;

  const items = [
    { label: "BTC price", value: dataSources.btcPrice },
    { label: "Equity prices", value: dataSources.equityPrices },
    { label: "Paper fills", value: dataSources.fills },
    { label: "Venue", value: dataSources.venue },
  ];

  return (
    <footer className={cn(overviewCardShell, "rounded-2xl p-4 sm:p-5", className)}>
      <div className="flex items-start gap-3">
        <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-500/80" aria-hidden />
        <div className="space-y-2">
          <p className="text-sm font-semibold tracking-tight">Onchain data only</p>
          <p className="text-xs text-muted-foreground">
            Paper trading uses real Jupiter swap quotes for fills. Ready to switch to live execution when results validate.
          </p>
          <dl className="grid gap-2 sm:grid-cols-2">
            {items.map((item) => (
              <div key={item.label} className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
                <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</dt>
                <dd className="text-xs font-medium">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </footer>
  );
}
