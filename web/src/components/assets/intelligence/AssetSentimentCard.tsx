import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { overviewMetricValueClass } from "@/components/dashboard/overview/overviewStyles";
import type { AssetIntelligencePayload } from "@/lib/tokensDossierApi";
import { IntelligenceEmptyMessage } from "@/components/assets/intelligence/IntelligenceEmptyMessage";
import {
  intelligenceAccentGlow,
  intelligenceGlowClass,
  intelligencePanelShell,
} from "@/components/assets/intelligence/intelligenceStyles";

function normalizeSentimentScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  if (Math.abs(score) <= 1) return score;
  return score / 100;
}

function formatSentimentScore(score: number): string {
  const normalized = normalizeSentimentScore(score);
  const pct = normalized * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

function sentimentMeta(score: number): {
  label: string;
  tone: "bullish" | "bearish" | "neutral";
  badgeClass: string;
  icon: typeof TrendingUp;
} {
  const normalized = normalizeSentimentScore(score);
  if (normalized > 0.15) {
    return {
      label: "Bullish",
      tone: "bullish",
      badgeClass: "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      icon: TrendingUp,
    };
  }
  if (normalized < -0.15) {
    return {
      label: "Bearish",
      tone: "bearish",
      badgeClass: "border-red-500/35 bg-red-500/10 text-red-700 dark:text-red-300",
      icon: TrendingDown,
    };
  }
  return {
    label: "Neutral",
    tone: "neutral",
    badgeClass: "border-border/60 bg-muted/40 text-muted-foreground",
    icon: Minus,
  };
}

function SentimentBar({
  positive,
  neutral,
  negative,
}: {
  positive: number;
  neutral: number;
  negative: number;
}) {
  const total = positive + neutral + negative || 1;
  const posPct = (positive / total) * 100;
  const neuPct = (neutral / total) * 100;
  const negPct = (negative / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex h-2 overflow-hidden rounded-full bg-muted/50 ring-1 ring-border/40">
        {posPct > 0 ? (
          <div
            className="bg-emerald-500/80 transition-all duration-500"
            style={{ width: `${posPct}%` }}
            title={`${positive} positive`}
          />
        ) : null}
        {neuPct > 0 ? (
          <div
            className="bg-muted-foreground/35 transition-all duration-500"
            style={{ width: `${neuPct}%` }}
            title={`${neutral} neutral`}
          />
        ) : null}
        {negPct > 0 ? (
          <div
            className="bg-red-500/75 transition-all duration-500"
            style={{ width: `${negPct}%` }}
            title={`${negative} negative`}
          />
        ) : null}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
        <div className="rounded-lg border border-border/40 bg-background/40 px-2 py-1.5">
          <p className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{positive}</p>
          <p className="text-muted-foreground">Positive</p>
        </div>
        <div className="rounded-lg border border-border/40 bg-background/40 px-2 py-1.5">
          <p className="font-semibold tabular-nums text-muted-foreground">{neutral}</p>
          <p className="text-muted-foreground">Neutral</p>
        </div>
        <div className="rounded-lg border border-border/40 bg-background/40 px-2 py-1.5">
          <p className="font-semibold tabular-nums text-red-600 dark:text-red-400">{negative}</p>
          <p className="text-muted-foreground">Negative</p>
        </div>
      </div>
    </div>
  );
}

export function AssetSentimentCard({
  sentiment,
  className,
}: {
  sentiment: AssetIntelligencePayload["sentiment"];
  className?: string;
}) {
  const hasData = sentiment.ok;
  const total = sentiment.total;
  const score = total["Sentiment Score"];
  const meta = sentimentMeta(score);
  const Icon = meta.icon;

  return (
    <Card className={cn(intelligencePanelShell, className)}>
      <div
        className={intelligenceGlowClass}
        style={{ background: intelligenceAccentGlow(hasData ? meta.tone : "neutral") }}
        aria-hidden
      />
      <CardHeader className="relative space-y-0 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold tracking-tight">Sentiment</CardTitle>
            <CardDescription className="text-xs">News sentiment for this asset</CardDescription>
          </div>
          {hasData ? (
            <Badge variant="outline" className={cn("shrink-0 gap-1 text-[11px] font-medium", meta.badgeClass)}>
              <Icon className="h-3 w-3" aria-hidden />
              {meta.label}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="relative flex flex-1 flex-col gap-5 pt-0">
        {hasData ? (
          <>
            <div>
              <p
                className={cn(
                  overviewMetricValueClass,
                  normalizeSentimentScore(score) > 0.15
                    ? "text-emerald-600 dark:text-emerald-400"
                    : normalizeSentimentScore(score) < -0.15
                      ? "text-red-600 dark:text-red-400"
                      : "text-foreground",
                )}
              >
                {formatSentimentScore(score)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Aggregate score from recent headlines</p>
            </div>
            <SentimentBar
              positive={total["Total Positive"]}
              neutral={total["Total Neutral"]}
              negative={total["Total Negative"]}
            />
          </>
        ) : (
          <IntelligenceEmptyMessage>
            {sentiment.error ?? "No sentiment data available for this asset yet."}
          </IntelligenceEmptyMessage>
        )}
      </CardContent>
    </Card>
  );
}
