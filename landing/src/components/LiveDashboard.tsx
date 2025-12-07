import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { TrendingUp, Users, Activity, DollarSign } from "lucide-react";

const generateRandomData = () => Array.from({ length: 24 }, () => Math.random() * 100);

export const LiveDashboard = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [chartData, setChartData] = useState(generateRandomData());

  useEffect(() => {
    const interval = setInterval(() => {
      setChartData(prev => {
        const newData = [...prev.slice(1), Math.random() * 100];
        return newData;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={ref} className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block text-primary text-sm font-medium mb-4 tracking-wider uppercase"
          >
            Live Dashboard
          </motion.span>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6"
          >
            Real-time <span className="neon-text">Market Intelligence</span>
          </motion.h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="glass-card p-8 rounded-2xl"
        >
          {/* Dashboard Header */}
          <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm text-muted-foreground">Live Data Feed</span>
            </div>
            <div className="flex gap-2">
              {["1H", "4H", "1D", "1W"].map((period, i) => (
                <button
                  key={period}
                  className={`px-4 py-2 text-xs rounded-lg transition-colors ${
                    i === 2 ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { icon: TrendingUp, label: "24h Volume", value: "$2.4B", change: "+12.5%", positive: true },
              { icon: Users, label: "Active Traders", value: "14,823", change: "+8.2%", positive: true },
              { icon: Activity, label: "Whale Moves", value: "247", change: "+34%", positive: true },
              { icon: DollarSign, label: "TVL Tracked", value: "$48.7B", change: "-2.1%", positive: false },
            ].map((stat, i) => (
              <div key={stat.label} className="glass-card p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <div className="text-xl font-bold text-foreground">{stat.value}</div>
                <div className={`text-xs ${stat.positive ? "text-green-400" : "text-red-400"}`}>
                  {stat.change}
                </div>
              </div>
            ))}
          </div>

          {/* Live Chart */}
          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">Smart Money Flow Index</span>
              <span className="text-xs text-primary flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Updating live
              </span>
            </div>
            
            <div className="h-48 flex items-end gap-1">
              {chartData.map((value, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${value}%` }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 rounded-t"
                  style={{
                    background: value > 50 
                      ? `linear-gradient(to top, hsl(190, 100%, 50%), hsl(160, 100%, 50%))` 
                      : `linear-gradient(to top, hsl(270, 100%, 65%), hsl(220, 100%, 60%))`,
                    opacity: 0.6 + (value / 250),
                  }}
                />
              ))}
            </div>
            
            <div className="flex justify-between mt-4 text-xs text-muted-foreground">
              <span>24h ago</span>
              <span>12h ago</span>
              <span>Now</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
