import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { resolveNewsArticleUrl } from "@/lib/marketing/syraPreviewApi";
import type { AssetIntelligencePayload } from "@/lib/tokensDossierApi";
import { IntelligenceEmptyMessage } from "@/components/assets/intelligence/IntelligenceEmptyMessage";

export function AssetNewsList({
  news,
  className,
}: {
  news: AssetIntelligencePayload["news"];
  className?: string;
}) {
  const items = news.items;
  const hasData = items.length > 0;

  return (
    <Card className={cn(overviewCardShell, className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold tracking-tight">News</CardTitle>
        <CardDescription className="text-xs">Headlines related to this asset</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-3">
            {items.map((item, i) => {
              const href = resolveNewsArticleUrl(item);
              const title = item.title?.trim() || "Untitled";
              const source = item.source_name?.trim();
              const date = item.date || item.published_at;
              return (
                <div
                  key={`${title}-${i}`}
                  className="flex items-start justify-between gap-3 border-b border-border/40 pb-3 last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium leading-snug hover:text-primary"
                      >
                        {title}
                      </a>
                    ) : (
                      <p className="text-sm font-medium leading-snug">{title}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[source, date].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                      aria-label="Open article"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <IntelligenceEmptyMessage>
            {news.error ?? "No headlines available for this asset yet."}
          </IntelligenceEmptyMessage>
        )}
      </CardContent>
    </Card>
  );
}
