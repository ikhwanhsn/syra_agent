import { Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";

export interface MmDataSourcesFooterProps {
  dataSources: {
    prices: string;
    fills: string;
    venue: string;
    token: string;
  } | undefined;
  className?: string;
}

export function MmDataSourcesFooter({ dataSources, className }: MmDataSourcesFooterProps) {
  if (!dataSources) return null;

  const items = [
    { label: "Prices", value: dataSources.prices },
    { label: "Paper fills", value: dataSources.fills },
    { label: "Venue", value: dataSources.venue },
    { label: "Token", value: dataSources.token },
  ];

  return (
    <footer className={cn(overviewCardShell, "rounded-2xl p-4 sm:p-5", className)}>
      <div className="flex items-start gap-3">
        <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-500/80" aria-hidden />
        <div className="space-y-2">
          <p className="text-sm font-semibold tracking-tight">SYRA paper market maker</p>
          <p className="text-xs text-muted-foreground">
            Paper trading uses real Jupiter swap quotes. Volume and creator-fee projections assume
            the same fills on-chain. Real execution adapter is stubbed for a later phase.
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
