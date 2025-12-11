import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  User,
  ThermometerSnowflakeIcon,
  Gem,
} from "lucide-react";

const mockChartData = [40, 55, 35, 70, 45, 80, 65, 90, 75, 95, 85, 100];

export const DashboardPreview = () => {
  const {
    isPending: isPendingCryptoPrice,
    error: errorCryptoPrice,
    data: dataCryptoPrice,
  } = useQuery({
    queryKey: ["cryptoPrice"],
    queryFn: () =>
      fetch(`https://api.binance.com/api/v3/ticker/price`).then((res) =>
        res.json()
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
        `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true`
      ).then((res) => res.json()),
  });

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
            <div className="text-xl font-bold text-foreground">{`$${Number(
              dataCryptoPrice?.find((item) => item.symbol === "BTCUSDT")?.price
            ).toFixed(2)}`}</div>
            <div
              className={`text-xs ${
                dataCryptoChange?.bitcoin?.usd_24h_change >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >{`${
              dataCryptoChange?.bitcoin?.usd_24h_change >= 0 ? "+" : ""
            }${Number(dataCryptoChange?.bitcoin?.usd_24h_change).toFixed(
              2
            )}%`}</div>
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
            <div className="text-xl font-bold text-foreground">{`$${Number(
              dataCryptoPrice?.find((item) => item.symbol === "ETHUSDT")?.price
            ).toFixed(2)}`}</div>
            <div
              className={`text-xs ${
                dataCryptoChange?.ethereum?.usd_24h_change >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >{`${
              dataCryptoChange?.ethereum?.usd_24h_change >= 0 ? "+" : ""
            }${Number(dataCryptoChange?.ethereum?.usd_24h_change).toFixed(
              2
            )}%`}</div>
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

          {/* Simplified chart visualization */}
          <div className="flex items-end justify-between h-32 gap-1">
            {mockChartData.map((value, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${value}%` }}
                transition={{ delay: 0.8 + i * 0.05, duration: 0.5 }}
                className="flex-1 rounded-t-sm"
                style={{
                  background: `linear-gradient(to top, hsl(190, 100%, 50%), hsl(220, 100%, 60%))`,
                  opacity: 0.5 + value / 200,
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Activity Feed */}
        <div className="space-y-2">
          {[
            {
              icon: Zap,
              text: "Whale Alert: 500 BTC moved",
              color: "text-neon-gold",
            },
            {
              icon: Activity,
              text: "AI Signal: Strong Buy detected",
              color: "text-green-400",
            },
            {
              icon: Gem,
              text: "$SYRA:",
              color: "text-blue-400",
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
              <span className="text-xs text-muted-foreground">{item.text}</span>
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
