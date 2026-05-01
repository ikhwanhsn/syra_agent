import { useState } from "react";
import { Newspaper, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { TokenGate } from "@/components/dashboard/TokenGate";
import { EmptyState, GlassCard } from "@/components/rise/RiseShared";
import { getNews } from "@/lib/cryptoNewsApi";
import { Input } from "@/components/ui/input";
import { NewsPreview } from "./previews/NewsPreview";
import { useLanguage } from "@/lib/LanguageContext";

export function NewsLive() {
  const { language } = useLanguage();
  const isZh = language === "zh";
  const [ticker, setTicker] = useState("general");
  const news = useQuery({
    queryKey: ["preview-news", ticker],
    queryFn: ({ signal }) => getNews(ticker, signal),
    staleTime: 120_000,
    retry: 1,
  });

  return (
    <div className="flex flex-col gap-6">
      <DashboardPageHeader
        title={isZh ? "新闻" : "News"}
        description={
          isZh
            ? "来自预览新闻接口的免费市场头条，帮助保持仪表盘上下文。"
            : "Free market headlines from the preview news endpoint to keep dashboard context-aware."
        }
        eyebrow={isZh ? "洞察" : "Insights"}
      />
      <GlassCard>
        <label htmlFor="news-ticker" className="mb-1 block text-xs font-medium text-muted-foreground">
          {isZh ? "Ticker（例如 general、sol、btc）" : "Ticker (e.g. general, sol, btc)"}
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            id="news-ticker"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            className="h-10 max-w-xs"
            autoComplete="off"
          />
          {news.isFetching ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3 animate-spin" /> {isZh ? "更新中" : "Updating"}
            </span>
          ) : null}
        </div>
      </GlassCard>
      <GlassCard>
        {news.isError ? (
          <EmptyState
            title={isZh ? "无法加载新闻" : "Could not load news"}
            description={(news.error as Error)?.message || (isZh ? "请尝试其他 ticker 或重试。" : "Try another ticker or retry.")}
            action={
              <Button size="sm" variant="secondary" onClick={() => news.refetch()}>
                {isZh ? "重试" : "Retry"}
              </Button>
            }
          />
        ) : news.isPending ? (
          <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" /> {isZh ? "新闻加载中..." : "Loading news..."}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {(news.data ?? []).slice(0, 40).map((item, index) => (
              <a
                key={`${item.news_url ?? index}-${index}`}
                href={item.news_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-border/40 bg-background/20 p-3 transition-colors hover:bg-background/40"
              >
                <p className="text-sm font-medium text-foreground">{item.title ?? (isZh ? "未命名文章" : "Untitled article")}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.source_name ?? (isZh ? "未知来源" : "Unknown source")} · {item.date ?? "n/a"} · {item.sentiment ?? "n/a"}
                </p>
              </a>
            ))}
            {(news.data ?? []).length === 0 ? (
              <EmptyState
                icon={Newspaper}
                title={isZh ? "该 ticker 暂无头条" : "No headlines for this ticker"}
                description={isZh ? "尝试更宽泛关键词，如 general、btc 或 sol。" : "Try a broader keyword like general, btc, or sol."}
              />
            ) : null}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

export default function NewsPage() {
  const { language } = useLanguage();
  const isZh = language === "zh";
  return (
    <TokenGate pageTitle={isZh ? "新闻" : "News"} preview={<NewsPreview />}>
      <NewsLive />
    </TokenGate>
  );
}
