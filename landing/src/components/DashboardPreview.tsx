import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Activity, Zap } from "lucide-react";

const mockChartData = [40, 55, 35, 70, 45, 80, 65, 90, 75, 95, 85, 100];

export const DashboardPreview = () => {
  return (
    <div className="relative">
      {/* Glow effect behind dashboard */}
      <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-3xl" />
      
      <div className="relative glass-card p-6 rounded-2xl">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-xs text-muted-foreground">SYRA Terminal v2.0</span>
        </div>

        {/* Price Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-4 rounded-xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">BTC/USDT</span>
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-xl font-bold text-foreground">$67,245</div>
            <div className="text-xs text-green-400">+4.28%</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="glass-card p-4 rounded-xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">ETH/USDT</span>
              <TrendingDown className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-xl font-bold text-foreground">$3,892</div>
            <div className="text-xs text-red-400">-1.12%</div>
          </motion.div>
        </div>

        {/* Chart Area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="glass-card p-4 rounded-xl mb-4"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">AI Sentiment Score</span>
            <span className="text-xs text-primary">Live</span>
          </div>
          
          {/* Simplified chart visualization */}
          <div className="h-32 flex items-end justify-between gap-1">
            {mockChartData.map((value, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${value}%` }}
                transition={{ delay: 0.8 + i * 0.05, duration: 0.5 }}
                className="flex-1 rounded-t-sm"
                style={{
                  background: `linear-gradient(to top, hsl(190, 100%, 50%), hsl(220, 100%, 60%))`,
                  opacity: 0.5 + (value / 200),
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Activity Feed */}
        <div className="space-y-2">
          {[
            { icon: Zap, text: "Whale Alert: 500 BTC moved", color: "text-neon-gold" },
            { icon: Activity, text: "AI Signal: Strong Buy detected", color: "text-green-400" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 + i * 0.1 }}
              className="flex items-center gap-3 glass-card p-3 rounded-lg"
            >
              <item.icon className={`w-4 h-4 ${item.color}`} />
              <span className="text-xs text-muted-foreground">{item.text}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
