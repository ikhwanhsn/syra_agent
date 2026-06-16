import { cn } from "@/lib/utils";
import type { AssetIntelligencePayload } from "@/lib/tokensDossierApi";
import { AssetIntelligenceSkeleton } from "@/components/assets/intelligence/AssetIntelligenceSkeleton";
import { AssetNewsList } from "@/components/assets/intelligence/AssetNewsList";
import { AssetSentimentCard } from "@/components/assets/intelligence/AssetSentimentCard";
import { AssetEventsList } from "@/components/assets/intelligence/AssetEventsList";
import { AssetSignalCard } from "@/components/assets/intelligence/AssetSignalCard";

const EMPTY_SENTIMENT: AssetIntelligencePayload["sentiment"] = {
  ok: false,
  data: {},
  total: {
    "Total Positive": 0,
    "Total Negative": 0,
    "Total Neutral": 0,
    "Sentiment Score": 0,
  },
};

const EMPTY_NEWS: AssetIntelligencePayload["news"] = {
  ok: false,
  items: [],
};

const EMPTY_EVENTS: AssetIntelligencePayload["events"] = {
  ok: false,
  items: [],
};

const EMPTY_SIGNAL: AssetIntelligencePayload["signal"] = {
  ok: false,
  tradingSignal: null,
  strength: null,
  source: null,
};

function resolveBlocks(
  data: AssetIntelligencePayload | undefined,
  isError: boolean,
): {
  sentiment: AssetIntelligencePayload["sentiment"];
  news: AssetIntelligencePayload["news"];
  events: AssetIntelligencePayload["events"];
  signal: AssetIntelligencePayload["signal"];
} {
  if (data) {
    return {
      sentiment: data.sentiment,
      news: data.news,
      events: data.events,
      signal: data.signal,
    };
  }

  const loadError = isError
    ? "Intelligence data could not be loaded."
    : "No data available yet.";

  return {
    sentiment: { ...EMPTY_SENTIMENT, error: loadError },
    news: { ...EMPTY_NEWS, error: loadError },
    events: { ...EMPTY_EVENTS, error: loadError },
    signal: { ...EMPTY_SIGNAL, error: loadError },
  };
}

export function AssetIntelligenceSection({
  data,
  isLoading,
  isError,
  className,
}: {
  data?: AssetIntelligencePayload;
  isLoading: boolean;
  isError: boolean;
  className?: string;
}) {
  if (isLoading) return <AssetIntelligenceSkeleton className={className} />;

  const blocks = resolveBlocks(data, isError);

  return (
    <div className={cn("space-y-4 animate-in fade-in duration-300", className)}>
      <div className="grid gap-4 md:grid-cols-2 md:items-stretch">
        <AssetSentimentCard sentiment={blocks.sentiment} />
        <AssetSignalCard signal={blocks.signal} />
      </div>
      <AssetNewsList news={blocks.news} />
      <AssetEventsList events={blocks.events} />
    </div>
  );
}
