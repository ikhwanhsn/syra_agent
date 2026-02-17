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
import { useEffect, useState } from "react";
import { API_BASE, getApiHeaders } from "../../config/global";

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
      fetch(`https://api.binance.com/api/v3/ticker/price`).then((res) =>
        res.json(),
      ),
    refetchInterval: 1000,
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

  const {
    isPending: isPendingNews,
    error: errorNews,
    data: dataNews,
  } = useQuery({
    queryKey: ["news"],
    queryFn: () =>
      fetch(`${SYRA_API_BASE}v1/regular/news`, {
        method: "GET",
        headers: { "Content-Type": "application/json", ...getApiHeaders() },
      }).then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      }),
  });

  const {
    isPending: isPendingSentiment,
    error: errorSentiment,
    data: dataSentiment,
  } = useQuery({
    queryKey: ["sentiment"],
    queryFn: () =>
      fetch(`${SYRA_API_BASE}v1/regular/sentiment`, {
        method: "GET",
        headers: { "Content-Type": "application/json", ...getApiHeaders() },
      }).then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      }),
  });
  const sentimentArray = Object.values(
    dataSentiment?.sentiment?.data || {},
  ).map((item: any) => item.sentiment_score);
  // Normalize score to 0–100 for display when API uses 0–1; support -1–1 as -100–100 so negative doesn't break the chart
  const toChartScore = (raw: number | undefined): number => {
    if (raw == null || Number.isNaN(Number(raw))) return 0;
    const v = Number(raw);
    if (v <= 1 && v >= -1) return v * 100; // -1..1 → -100..100
    if (v <= 100 && v >= 0) return v; // already 0–100
    return Math.max(-100, Math.min(100, v));
  };
  const chartData = sentimentArray
    .map((value, i) => ({
      index: i,
      score: toChartScore(value),
      positive:
        dataSentiment?.sentiment?.data?.[
          Object.keys(dataSentiment.sentiment.data)[i]
        ]?.Positive || 0,
      negative:
        dataSentiment?.sentiment?.data?.[
          Object.keys(dataSentiment.sentiment.data)[i]
        ]?.Negative || 0,
      neutral:
        dataSentiment?.sentiment?.data?.[
          Object.keys(dataSentiment.sentiment.data)[i]
        ]?.Neutral || 0,
    }))
    .reverse();

  // Scale for negative count (so red line shows actual Negative count trend, not flat when score > 0)
  const maxNegative = Math.max(1, ...chartData.map((d) => d.negative));

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataKey = Object.keys(dataSentiment?.sentiment?.data || {})[
        payload[0].payload.index
      ];
      const date = dataKey
        ? new Date(dataKey).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "";

      return (
        <div className="px-3 py-2 text-xs text-white border rounded-lg shadow-2xl bg-black/95 border-white/20">
          {date && (
            <div className="pb-1 mb-2 font-semibold text-blue-400 border-b border-white/10">
              {date}
            </div>
          )}
          <div className="mb-1 font-semibold">
            Score: {(payload[0].payload.score ?? 0).toFixed(1)}%
          </div>
          <div className="text-green-400">
            Positive: {payload[0].payload.positive}
          </div>
          <div className="text-red-400">
            Negative: {payload[0].payload.negative}
          </div>
          <div className="text-gray-400">
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
      fetch(`${SYRA_API_BASE}v1/regular/signal?token=bitcoin`, {
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
      setCounter((prev) => {
        // If the next value would be 101, reset to 0
        if (prev >= 99) {
          return 0;
        }
        return prev + 1;
      });
    }, 5000); // Updated to 3 seconds as per your comment

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full">
      {/* Glow effect behind dashboard */}
      <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-3xl" />

      <div className="relative w-full max-w-full p-4 sm:p-6 mx-auto sm:mx-0 glass-card rounded-2xl min-w-0">
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
            <span className="text-xs text-primary">Live</span>
          </div>

          {/* Total Sentiment Stats - Add this section */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="p-2 border rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
              <div className="text-[10px] text-green-400/70 mb-0.5">
                Positive
              </div>
              <div className="text-sm font-bold text-green-400">
                {dataSentiment?.sentiment?.total?.[
                  "Total Positive"
                ]?.toLocaleString() || "---"}
              </div>
            </div>
            <div className="p-2 border rounded-lg bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
              <div className="text-[10px] text-red-400/70 mb-0.5">Negative</div>
              <div className="text-sm font-bold text-red-400">
                {dataSentiment?.sentiment?.total?.[
                  "Total Negative"
                ]?.toLocaleString() || "---"}
              </div>
            </div>
            <div className="p-2 border rounded-lg bg-gradient-to-br from-gray-500/10 to-gray-500/5 border-gray-500/20">
              <div className="text-[10px] text-gray-400/70 mb-0.5">Neutral</div>
              <div className="text-sm font-bold text-gray-400">
                {dataSentiment?.sentiment?.total?.[
                  "Total Neutral"
                ]?.toLocaleString() || "---"}
              </div>
            </div>
            <div className="p-2 border rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
              <div className="text-[10px] text-blue-400/70 mb-0.5">Score</div>
              <div className="text-sm font-bold text-blue-400">
                {dataSentiment?.sentiment?.total?.["Sentiment Score"]
                  ? `${(dataSentiment.sentiment.total["Sentiment Score"] * 100).toFixed(1)}%`
                  : "---"}
              </div>
            </div>
          </div>

          {/* Chart: one blue line for score (-100..100); fill only above zero so negative isn’t weird. */}
          <ResponsiveContainer width="100%" height={128}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
              <defs>
                <linearGradient id="colorScorePos" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="hsl(190, 100%, 50%)" stopOpacity={0} />
                  <stop offset="100%" stopColor="hsl(220, 100%, 60%)" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <XAxis dataKey="index" hide />
              <YAxis hide domain={[-100, 100]} allowDataOverflow />
              <YAxis yAxisId="negativeCount" hide domain={[0, maxNegative]} orientation="right" />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground) / 0.35)" strokeWidth={1} strokeDasharray="6 4" />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(255, 255, 255, 0.1)" }}
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
                stroke="hsl(200, 100%, 55%)"
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
          {[
            {
              icon: Zap,
              text: dataNews?.news[counter]?.title,
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
              color: "text-blue-400",
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

              {/* Animated text for news only */}
              {item.isNews ? (
                <AnimatePresence mode="wait">
                  <motion.span
                    key={counter}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-xs text-muted-foreground min-w-0 flex-1"
                  >
                    {item.text || "Loading news..."}
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
          ))}
        </div>
      </div>
    </div>
  );
};
