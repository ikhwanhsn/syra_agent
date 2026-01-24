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
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";

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
      fetch(`${import.meta.env.VITE_SYRA_API_URL}v1/regular/news`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Replace 'x-api-key' with the specific header name your API expects
          "api-key": import.meta.env.VITE_SYRA_API_KEY,
        },
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
      fetch(`${import.meta.env.VITE_SYRA_API_URL}v1/regular/sentiment`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Replace 'x-api-key' with the specific header name your API expects
          "api-key": import.meta.env.VITE_SYRA_API_KEY,
        },
      }).then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      }),
  });
  const sentimentArray = Object.values(
    dataSentiment?.sentiment?.data || {},
  ).map((item: any) => item.sentiment_score);
  const chartData = sentimentArray
    .map((value, i) => ({
      index: i,
      score: value * 100,
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
            Score: {payload[0].value.toFixed(1)}%
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
      fetch(
        `${import.meta.env.VITE_SYRA_API_URL}v1/regular/signal?token=bitcoin`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            // Replace 'x-api-key' with the specific header name your API expects
            "api-key": import.meta.env.VITE_SYRA_API_KEY,
          },
        },
      ).then((res) => {
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

      <div className="relative w-4/5 p-6 mx-auto sm:mx-0 sm:w-full glass-card rounded-2xl">
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

          {/* Chart */}
          <ResponsiveContainer width="100%" height={128}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(220, 100%, 60%)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(190, 100%, 50%)"
                    stopOpacity={0.3}
                  />
                </linearGradient>
              </defs>
              <XAxis dataKey="index" hide />
              <YAxis hide domain={[0, 100]} />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(255, 255, 255, 0.1)" }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="hsl(200, 100%, 55%)"
                strokeWidth={2}
                fill="url(#colorScore)"
                animationDuration={1000}
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
              className="flex items-center gap-3 p-3 rounded-lg glass-card"
            >
              <item.icon className={`w-4 h-4 ${item.color}`} />

              {/* Animated text for news only */}
              {item.isNews ? (
                <AnimatePresence mode="wait">
                  <motion.span
                    key={counter}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-xs text-muted-foreground"
                  >
                    {item.text || "Loading news..."}
                  </motion.span>
                </AnimatePresence>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {item.text}
                </span>
              )}

              {item.text === "$SYRA:" && (
                <a
                  href="https://dexscreener.com/solana/ha56u92pmwnh9ksqf7wwhi2xh9aqdedqsazo6m6jdbqf"
                  target="_blank"
                  className="relative z-10 text-xs text-blue-100 text-muted-foreground"
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
