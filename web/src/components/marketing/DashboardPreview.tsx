import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { TrendingUp, Activity, Zap, Gem } from "lucide-react";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import { getApiHeaders, getSyraApiBase } from "@/lib/marketing/global";
import {
  buildPlaceholderSentimentPayload,
  daySentimentScore,
  fetchBinanceTicker,
  fetchPreviewNews,
  fetchPreviewSentiment,
  fetchPreviewSignal,
  formatPreviewSignalTokenLabel,
  PREVIEW_SIGNAL_TOKENS,
  resolveNewsArticleUrl,
  toChartScore,
  type SyraNewsArticle,
} from "@/lib/marketing/syraPreviewApi";

const SYRA_API_BASE = getSyraApiBase();

/** Headlines cycle quickly; AI signals stay longer and start offset so rows rarely animate together. */
const NEWS_ROTATE_MS = 5_000;
const SIGNAL_ROTATE_MS = 12_000;
const SIGNAL_ROTATE_START_DELAY_MS = 4_000;

export const DashboardPreview = () => {
  const [newsTick, setNewsTick] = useState(0);
  const [signalTick, setSignalTick] = useState(0);
  const apiHeaders = getApiHeaders();

  const { data: dataCryptoPrice = [] } = useQuery({
    queryKey: ["cryptoPrice", SYRA_API_BASE],
    queryFn: ({ signal }) => fetchBinanceTicker(SYRA_API_BASE, apiHeaders, signal),
    refetchInterval: 15_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const {
    isPending: isPendingNews,
    error: errorNews,
    data: newsItems = [],
  } = useQuery({
    queryKey: ["syra-preview-news", SYRA_API_BASE],
    queryFn: async ({ signal }) => {
      try {
        return await fetchPreviewNews(SYRA_API_BASE, apiHeaders, signal);
      } catch {
        return [];
      }
    },
    refetchInterval: 90_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const {
    isPending: isPendingSentiment,
    data: sentimentPayload,
  } = useQuery({
    queryKey: ["syra-preview-sentiment", SYRA_API_BASE],
    queryFn: async ({ signal }) => {
      try {
        return await fetchPreviewSentiment(SYRA_API_BASE, apiHeaders, signal);
      } catch {
        return buildPlaceholderSentimentPayload();
      }
    },
    refetchInterval: 120_000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const hasLiveSentiment =
    Object.keys(sentimentPayload?.data ?? {}).length > 0;
  const displaySentiment = hasLiveSentiment
    ? sentimentPayload
    : buildPlaceholderSentimentPayload();
  const sentimentUsesPlaceholder =
    !isPendingSentiment && !hasLiveSentiment;

  const sentimentData = displaySentiment?.data ?? {};
  const sentimentTotal = displaySentiment?.total;
  const sentimentDates = useMemo(
    () => Object.keys(sentimentData).sort(),
    [sentimentData],
  );

  const chartData = useMemo(() => {
    return sentimentDates
      .map((dateKey, i) => {
        const day = sentimentData[dateKey];
        return {
          index: i,
          dateKey,
          score: toChartScore(daySentimentScore(day)),
          positive: day?.Positive ?? 0,
          negative: day?.Negative ?? 0,
          neutral: day?.Neutral ?? 0,
        };
      })
      .reverse();
  }, [sentimentData, sentimentDates]);

  const maxNegative = Math.max(1, ...chartData.map((d) => d.negative));

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { dateKey?: string; score?: number; positive?: number; negative?: number; neutral?: number } }> }) => {
    if (active && payload && payload.length) {
      const dataKey = payload[0].payload.dateKey;
      const date = dataKey
        ? new Date(dataKey).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "";

      return (
        <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-2xl">
          {date && (
            <div className="mb-2 border-b border-border/60 pb-1 font-semibold text-foreground">
              {date}
            </div>
          )}
          <div className="mb-1 font-semibold text-foreground">
            Score: {(payload[0].payload.score ?? 0).toFixed(1)}%
          </div>
          <div className="text-foreground/90">
            Positive: {payload[0].payload.positive}
          </div>
          <div className="text-muted-foreground">
            Negative: {payload[0].payload.negative}
          </div>
          <div className="text-muted-foreground/90">
            Neutral: {payload[0].payload.neutral}
          </div>
        </div>
      );
    }
    return null;
  };

  const activeSignalToken =
    PREVIEW_SIGNAL_TOKENS[signalTick % PREVIEW_SIGNAL_TOKENS.length];

  const { data: dataSignals, isFetching: isFetchingSignal } = useQuery({
    queryKey: ["signals", SYRA_API_BASE, activeSignalToken],
    queryFn: ({ signal }) =>
      fetchPreviewSignal(SYRA_API_BASE, apiHeaders, activeSignalToken, signal),
    placeholderData: keepPreviousData,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const getSafePrice = (binanceSymbol: string) => {
    const binancePrice = dataCryptoPrice.find((item) => item.symbol === binanceSymbol)?.price;
    return binancePrice ? Number(binancePrice).toFixed(2) : "---";
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setNewsTick((prev) => prev + 1);
    }, NEWS_ROTATE_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const startDelayId = setTimeout(() => {
      const advance = () => setSignalTick((prev) => prev + 1);
      advance();
      intervalId = setInterval(advance, SIGNAL_ROTATE_MS);
    }, SIGNAL_ROTATE_START_DELAY_MS);

    return () => {
      clearTimeout(startDelayId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const activeNewsIndex =
    newsItems.length > 0 ? newsTick % newsItems.length : 0;
  const activeNews: SyraNewsArticle | undefined = newsItems[activeNewsIndex];
  const activeNewsTitle =
    typeof activeNews?.title === "string" ? activeNews.title : "";
  const activeNewsUrl = resolveNewsArticleUrl(activeNews);
  const activeNewsSource =
    typeof activeNews?.source_name === "string"
      ? activeNews.source_name
      : "";

  const btcPrice = getSafePrice("BTCUSDT");
  const ethPrice = getSafePrice("ETHUSDT");

  return (
    <div className="relative w-full">
      <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-3xl" />

      <div className="glass-card relative mx-auto min-w-0 w-full max-w-full rounded-2xl border border-accent/20 p-4 shadow-[0_0_40px_-12px_hsl(var(--accent)/0.14)] sm:mx-0 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
            <div className="w-3 h-3 bg-green-500 rounded-full" />
          </div>
          <span className="text-xs text-muted-foreground">
            SYRA Terminal v2.0
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="p-4 glass-card rounded-xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">BTC/USDT</span>
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-xl font-bold text-foreground">{`$${btcPrice}`}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="p-4 glass-card rounded-xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">ETH/USDT</span>
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-xl font-bold text-foreground">{`$${ethPrice}`}</div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="p-4 mb-4 glass-card rounded-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">AI Sentiment Score</span>
            <span className="text-xs text-primary">
              {isPendingSentiment
                ? "Loading"
                : sentimentUsesPlaceholder
                  ? "Syncing"
                  : "Live"}
            </span>
          </div>

          <motion.div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="p-2 border rounded-lg border-border bg-foreground/[0.04]">
              <div className="text-[10px] text-muted-foreground mb-0.5">
                Positive
              </div>
              <div className="text-sm font-bold text-foreground">
                {isPendingSentiment
                  ? "…"
                  : sentimentTotal?.["Total Positive"]?.toLocaleString() ?? "0"}
              </div>
            </div>
            <div className="p-2 border rounded-lg border-border bg-muted/60">
              <div className="text-[10px] text-muted-foreground mb-0.5">Negative</div>
              <div className="text-sm font-bold text-foreground/90">
                {isPendingSentiment
                  ? "…"
                  : sentimentTotal?.["Total Negative"]?.toLocaleString() ?? "0"}
              </div>
            </div>
            <div className="p-2 border rounded-lg border-border bg-muted/40">
              <div className="text-[10px] text-muted-foreground mb-0.5">Neutral</div>
              <div className="text-sm font-bold text-foreground/80">
                {isPendingSentiment
                  ? "…"
                  : sentimentTotal?.["Total Neutral"]?.toLocaleString() ?? "0"}
              </div>
            </div>
            <div className="p-2 border rounded-lg border-border bg-accent/30">
              <div className="text-[10px] text-muted-foreground mb-0.5">Score</div>
              <div className="text-sm font-bold text-primary">
                {isPendingSentiment
                  ? "…"
                  : `${toChartScore(sentimentTotal?.["Sentiment Score"]).toFixed(1)}%`}
              </div>
            </div>
          </motion.div>

          {sentimentUsesPlaceholder && (
            <p className="mb-3 text-[10px] text-muted-foreground">
              Live sentiment is syncing from the Syra news agent. Preview data shown until ready.
            </p>
          )}

          <ResponsiveContainer width="100%" height={128}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
              <defs>
                <linearGradient id="colorScorePos" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                </linearGradient>
              </defs>
              <XAxis dataKey="index" hide />
              <YAxis hide domain={[-100, 100]} allowDataOverflow />
              <YAxis yAxisId="negativeCount" hide domain={[0, maxNegative]} orientation="right" />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground) / 0.35)" strokeWidth={1} strokeDasharray="6 4" />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "hsl(var(--foreground) / 0.08)" }}
              />
              <Area
                type="monotone"
                dataKey={(d) => (d.score > 0 ? d.score : 0)}
                stroke="none"
                fill="url(#colorScorePos)"
                animationDuration={1000}
                baseValue={0}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                animationDuration={1000}
              />
              <Line
                type="monotone"
                dataKey="negative"
                yAxisId="negativeCount"
                stroke="hsl(var(--muted-foreground) / 0.6)"
                strokeWidth={1}
                strokeDasharray="4 4"
                dot={false}
                animationDuration={1000}
                name="Negative count"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <div className="space-y-2">
          {(() => {
            const newsLabel = activeNewsSource
              ? `${activeNewsSource}: ${activeNewsTitle}`
              : activeNewsTitle;

            return [
              {
                icon: Zap,
                text: isPendingNews
                  ? "Loading headlines from Syra news agent…"
                  : errorNews
                    ? "Headlines temporarily unavailable"
                    : newsLabel,
                newsUrl: activeNewsUrl,
                color: "text-neon-gold",
                isNews: true,
              },
              {
                icon: Activity,
                text: (() => {
                  const tokenLabel =
                    formatPreviewSignalTokenLabel(activeSignalToken);
                  const dataToken = dataSignals?.token?.toLowerCase();
                  const hasFreshData = dataToken === activeSignalToken;

                  if (!hasFreshData && isFetchingSignal) {
                    return `Loading AI signal for ${tokenLabel}…`;
                  }

                  const signal = dataSignals?.signal?.metadata?.TRADING_SIGNAL;
                  const strength =
                    dataSignals?.signal?.metadata?.SIGNAL_STRENGTH;
                  const displayLabel = dataSignals?.token
                    ? formatPreviewSignalTokenLabel(dataSignals.token)
                    : tokenLabel;

                  return hasFreshData && dataSignals?.signal?.metadata
                    ? `AI Signal: ${displayLabel} ${signal} with ${strength} confidence`
                    : `No signal available for ${tokenLabel}`;
                })(),
                color: "text-green-400",
                isNews: false,
                isSignal: true,
                signalKey: activeSignalToken,
              },
              {
                icon: Gem,
                text: "$SYRA:",
                color: "text-primary",
                isNews: false,
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + i * 0.1 }}
                className="flex flex-wrap items-center gap-2 sm:gap-3 p-3 rounded-lg glass-card min-w-0"
              >
                <item.icon className={`w-4 h-4 shrink-0 ${item.color}`} />

                {item.isNews ? (
                  <AnimatePresence mode="wait">
                    {item.newsUrl ? (
                      <motion.a
                        key={activeNewsIndex}
                        href={item.newsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="min-w-0 flex-1 truncate text-left text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-primary hover:underline"
                      >
                        {item.text || "Loading news..."}
                      </motion.a>
                    ) : (
                      <motion.span
                        key={activeNewsIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="min-w-0 flex-1 truncate text-xs text-muted-foreground"
                      >
                        {item.text || "Loading news..."}
                      </motion.span>
                    )}
                  </AnimatePresence>
                ) : "isSignal" in item && item.isSignal ? (
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={item.signalKey}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="min-w-0 flex-1 truncate text-xs text-muted-foreground"
                    >
                      {item.text}
                    </motion.span>
                  </AnimatePresence>
                ) : (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {item.text}
                  </span>
                )}

                {item.text === "$SYRA:" && (
                  <a
                    href="https://dexscreener.com/solana/ha56u92pmwnh9ksqf7wwhi2xh9aqdedqsazo6m6jdbqf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative z-10 min-w-0 flex-1 text-xs text-blue-100 text-muted-foreground break-all"
                  >
                    8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump
                  </a>
                )}
              </motion.div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
};
