import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  User,
  ThermometerSnowflakeIcon,
  Gem,
} from "lucide-react";
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
import { API_BASE, getApiHeaders } from "../../config/global";
import {
  daySentimentScore,
  fetchPreviewNews,
  fetchPreviewSentiment,
  resolveNewsArticleUrl,
  toChartScore,
  type SyraNewsArticle,
} from "@/lib/syraPreviewApi";

// API base for dashboard preview: env VITE_SYRA_API_URL or fallback to API_BASE (ensure trailing slash)
const SYRA_API_BASE = (import.meta.env.VITE_SYRA_API_URL || `${API_BASE}/`).replace(/\/?$/, "/");

export const DashboardPreview = () => {
  const [counter, setCounter] = useState(0);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const {
    isPending: isPendingCryptoPrice,
    error: errorCryptoPrice,
    data: dataCryptoPrice,
  } = useQuery({
    queryKey: ["cryptoPrice"],
    queryFn: () =>
      fetch(`${SYRA_API_BASE}binance-ticker`, {
        method: "GET",
        headers: { "Content-Type": "application/json", ...getApiHeaders() },
      }).then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      }),
    refetchInterval: 15_000, // 15s to avoid Binance request weight limit / IP ban (-1003)
  });

  const {
    isPending: isPendingCryptoChange,
    error: errorCryptoChange,
    data: dataCryptoChange,
  } = useQuery({
    queryKey: ["cryptoChange"],
    queryFn: () =>
      fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true`,
      ).then((res) => res.json()),
  });

  const apiHeaders = getApiHeaders();

  const {
    isPending: isPendingNews,
    error: errorNews,
    data: newsItems = [],
  } = useQuery({
    queryKey: ["syra-preview-news"],
    queryFn: ({ signal }) => fetchPreviewNews(SYRA_API_BASE, apiHeaders, signal),
    refetchInterval: 90_000,
    retry: 2,
  });

  const {
    isPending: isPendingSentiment,
    error: errorSentiment,
    data: sentimentPayload,
  } = useQuery({
    queryKey: ["syra-preview-sentiment"],
    queryFn: ({ signal }) => fetchPreviewSentiment(SYRA_API_BASE, apiHeaders, signal),
    refetchInterval: 120_000,
    retry: 2,
  });

  const sentimentData = sentimentPayload?.data ?? {};
  const sentimentTotal = sentimentPayload?.total;
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

  // Scale for negative count (so red line shows actual Negative count trend, not flat when score > 0)
  const maxNegative = Math.max(1, ...chartData.map((d) => d.negative));

  // Custom tooltip component
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

  const {
    isPending: isPendingSignals,
    error: errorSignals,
    data: dataSignals,
  } = useQuery({
    queryKey: ["signals"],
    queryFn: () =>
      fetch(`${SYRA_API_BASE}preview/signal?token=bitcoin`, {
        method: "GET",
        headers: { "Content-Type": "application/json", ...getApiHeaders() },
      }).then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      }),
  });

  const getSafePrice = (binanceSymbol, coingeckoPrice) => {
    const binancePrice = dataCryptoPrice?.find(
      (item) => item.symbol === binanceSymbol,
    )?.price;
    const price = binancePrice || coingeckoPrice;
    return price ? Number(price).toFixed(2) : "---";
  };
  const getSafeChange = (change) => {
    if (!change && change !== 0) return "---";
    const num = Number(change);
    return isNaN(num) ? "---" : `${num >= 0 ? "+" : ""}${num.toFixed(2)}%`;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCounter((prev) => prev + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const activeNewsIndex =
    newsItems.length > 0 ? counter % newsItems.length : 0;
  const activeNews: SyraNewsArticle | undefined = newsItems[activeNewsIndex];
  const activeNewsTitle =
    typeof activeNews?.title === "string" ? activeNews.title : "";
  const activeNewsUrl = resolveNewsArticleUrl(activeNews);
  const activeNewsSource =
    typeof activeNews?.source_name === "string"
      ? activeNews.source_name
      : "";

  return (
    <div className="relative w-full">
      {/* Glow effect behind dashboard */}
      <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-3xl" />

      <div className="glass-card relative mx-auto min-w-0 w-full max-w-full rounded-2xl border border-accent/20 p-4 shadow-[0_0_40px_-12px_hsl(var(--accent)/0.14)] sm:mx-0 sm:p-6">
        {/* Dashboard Header */}
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

        {/* Price Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="p-4 glass-card rounded-xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">BTC/USDT</span>
              {dataCryptoChange?.bitcoin?.usd_24h_change >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
            </div>
            <div className="text-xl font-bold text-foreground">{`$${getSafePrice("BTCUSDT", dataCryptoChange?.bitcoin?.usd)}`}</div>
            <div
              className={`text-xs ${
                dataCryptoChange?.bitcoin?.usd_24h_change >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {getSafeChange(dataCryptoChange?.bitcoin?.usd_24h_change)}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="p-4 glass-card rounded-xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">ETH/USDT</span>
              {dataCryptoChange?.ethereum?.usd_24h_change >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
            </div>
            <div className="text-xl font-bold text-foreground">{`$${getSafePrice("ETHUSDT", dataCryptoChange?.ethereum?.usd)}`}</div>
            <div
              className={`text-xs ${
                dataCryptoChange?.ethereum?.usd_24h_change >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {getSafeChange(dataCryptoChange?.ethereum?.usd_24h_change)}
            </div>
          </motion.div>
        </div>

        {/* Chart Area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="p-4 mb-4 glass-card rounded-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">AI Sentiment Score</span>
            <span className="text-xs text-primary">
              {isPendingSentiment ? "Loading" : errorSentiment ? "Unavailable" : "Live"}
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

          {errorSentiment && (
            <p className="mb-3 text-[10px] text-muted-foreground">
              Sentiment from Syra news agent is warming up. Headlines still refresh below.
            </p>
          )}

          {/* Chart: one blue line for score (-100..100); fill only above zero so negative isn’t weird. */}
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
              {/* Fill only when score > 0 (no red area below zero) */}
              <Area
                type="monotone"
                dataKey={(d) => (d.score > 0 ? d.score : 0)}
                stroke="none"
                fill="url(#colorScorePos)"
                animationDuration={1000}
                baseValue={0}
              />
              {/* Single blue line for full score so negative just dips below zero, no red */}
              <Line
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                animationDuration={1000}
              />
              {/* Negative count over time (right axis), muted so it doesn’t fight the score line */}
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

        {/* Activity Feed */}
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
                  const token = dataSignals?.token
                    ? dataSignals.token.charAt(0).toUpperCase() +
                      dataSignals.token.slice(1)
                    : "Crypto";
                  const signal = dataSignals?.signal?.metadata?.TRADING_SIGNAL;
                  const strength = dataSignals?.signal?.metadata?.SIGNAL_STRENGTH;

                  return dataSignals?.signal?.metadata
                    ? `AI Signal: ${token} ${signal} with ${strength} confidence`
                    : "No signal available";
                })(),
                color: "text-green-400",
                isNews: false,
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
