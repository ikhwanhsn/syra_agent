import { Newspaper } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StocksNewsSignal } from "@/lib/stocksExperimentApi";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";

function sentimentLabel(score: number): { label: string; className: string } {
  if (score > 0.2) return { label: "Bullish", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300" };
  if (score < -0.2) return { label: "Bearish", className: "border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-300" };
  return { label: "Neutral", className: "border-border/50 bg-muted/40 text-muted-foreground" };
}

function scorePct(n: number): string {
  return `${Math.round(Math.max(0, Math.min(1, n)) * 100)}%`;
}

export interface StocksNewsPanelProps {
  news: StocksNewsSignal[];
  loading?: boolean;
  className?: string;
}

export function StocksNewsPanel({ news, loading, className }: StocksNewsPanelProps) {
  if (loading && news.length === 0) {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cn(overviewCardShell, "rounded-2xl p-4")}>
            <Skeleton className="mb-2 h-4 w-1/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div
        className={cn(
          overviewCardShell,
          "flex flex-col items-center justify-center gap-2 rounded-2xl px-6 py-12 text-center",
          className,
        )}
      >
        <Newspaper className="h-8 w-8 text-muted-foreground/50" aria-hidden />
        <p className="text-sm font-medium text-foreground/90">No headlines yet</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          News signals refresh automatically from live feeds for each xStock symbol.
        </p>
      </div>
    );
  }

  return (
    <ul className={cn("space-y-2", className)}>
      {news.map((item) => {
        const sent = sentimentLabel(item.sentimentScore);
        return (
          <li
            key={item.symbol}
            className={cn(
              overviewCardShell,
              "rounded-2xl p-4 transition-[border-color] duration-200 hover:border-border/70",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold tracking-tight text-foreground">{item.symbol}</span>
                  <Badge variant="outline" className={cn("rounded-md px-1.5 py-0 text-[10px] font-semibold", sent.className)}>
                    {sent.label}
                  </Badge>
                  <Badge variant="outline" className="rounded-md px-1.5 py-0 text-[10px] font-normal text-muted-foreground">
                    {item.newsCount} articles
                  </Badge>
                </div>
                {item.topHeadline ? (
                  <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{item.topHeadline}</p>
                ) : (
                  <p className="text-xs text-muted-foreground/70">No recent headline</p>
                )}
              </div>
              <div className="shrink-0 text-right text-[10px] text-muted-foreground">
                <p>Sentiment {scorePct((item.sentimentScore + 1) / 2)}</p>
                <p>Events {scorePct(item.eventScore)}</p>
                <p>Fresh {scorePct(item.freshnessScore)}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
