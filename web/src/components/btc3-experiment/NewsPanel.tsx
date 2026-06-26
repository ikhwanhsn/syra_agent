import { Badge } from "@/components/ui/badge";
import { EmptyState, PanelShell } from "./shared/PanelShell";
import type { Btc3Article } from "@/lib/btc3/types";
import { formatRelativeTime } from "@/lib/btc3/format";

export function NewsPanel({ news, total }: { news: Btc3Article[]; total: number }) {
  return (
    <PanelShell
      kicker="News Feed"
      title="Global Macro & Crypto News"
      description={`${total} articles indexed from configured providers.`}
    >
      {news.length === 0 ? (
        <EmptyState message="No articles yet. Pipeline will collect on next scan (every 5 minutes)." />
      ) : (
        <ul className="divide-y divide-border/40">
          {news.map((article) => (
            <li key={article.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {article.title}
                  </a>
                  {article.summary ? (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {article.summary}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge variant="outline" className="text-[10px]">
                    {article.providerId}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {formatRelativeTime(article.publishedAt)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PanelShell>
  );
}
