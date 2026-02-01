import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { TrendingUp, Users, Activity, DollarSign } from "lucide-react";

const generateRandomData = () =>
  Array.from({ length: 24 }, () => Math.random() * 100);

export const LiveDashboard = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [chartData, setChartData] = useState(generateRandomData());
  const [timeFrame, setTimeFrame] = useState("1D");

  useEffect(() => {
    const interval = setInterval(() => {
      setChartData((prev) => {
        const newData = [...prev.slice(1), Math.random() * 100];
        return newData;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-accent/6 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-neon-gold/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8 relative">
        <div ref={ref} className="mb-16 text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block mb-4 text-sm font-medium tracking-wider uppercase text-primary"
          >
            Live Dashboard
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 text-3xl font-bold sm:text-4xl lg:text-5xl"
          >
            Real-time <span className="neon-text">Market Intelligence</span>
          </motion.h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="p-8 glass-card rounded-2xl"
        >
          {/* Dashboard Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-muted-foreground">
                Live Data Feed
              </span>
            </div>
            <div className="flex gap-2">
              {["1H", "4H", "1D", "1W"].map((period, i) => (
                <button
                  key={period}
                  className={`px-4 py-2 text-xs rounded-lg transition-colors relative z-10 ${
                    timeFrame === period
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                  onClick={() => setTimeFrame(period)}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
            {[
              {
                icon: TrendingUp,
                label: "24h Volume",
                value:
                  timeFrame === "1H"
                    ? "$1.2M"
                    : timeFrame === "4H"
                    ? "$2.4M"
                    : timeFrame === "1D"
                    ? "$3.6M"
                    : "$4.8M",
                change:
                  timeFrame === "1H"
                    ? "+1.2%"
                    : timeFrame === "4H"
                    ? "+2.4%"
                    : timeFrame === "1D"
                    ? "+3.6%"
                    : "+4.8%",
                positive: true,
              },
              {
                icon: Users,
                label: "Active Traders",
                value:
                  timeFrame === "1H"
                    ? "1,234"
                    : timeFrame === "4H"
                    ? "4,567"
                    : timeFrame === "1D"
                    ? "8,901"
                    : "12,345",
                change:
                  timeFrame === "1H"
                    ? "+8.2%"
                    : timeFrame === "4H"
                    ? "+16.4%"
                    : timeFrame === "1D"
                    ? "+24.6%"
                    : "+32.8%",
                positive: true,
              },
              {
                icon: Activity,
                label: "Whale Moves",
                value:
                  timeFrame === "1H"
                    ? "247"
                    : timeFrame === "4H"
                    ? "987"
                    : timeFrame === "1D"
                    ? "2,345"
                    : "4,567",
                change:
                  timeFrame === "1H"
                    ? "+34%"
                    : timeFrame === "4H"
                    ? "+68%"
                    : timeFrame === "1D"
                    ? "+136%"
                    : "+224%",
                positive: true,
              },
              {
                icon: DollarSign,
                label: "TVL Tracked",
                value:
                  timeFrame === "1H"
                    ? "$4.8B"
                    : timeFrame === "4H"
                    ? "$9.7B"
                    : timeFrame === "1D"
                    ? "$19.4B"
                    : "$38.8B",
                change:
                  timeFrame === "1H"
                    ? "-2.1%"
                    : timeFrame === "4H"
                    ? "-4.2%"
                    : timeFrame === "1D"
                    ? "-8.4%"
                    : "-16.8%",
                positive: false,
              },
            ].map((stat, i) => (
              <div key={stat.label} className="p-4 glass-card rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {stat.label}
                  </span>
                </div>
                <div className="text-xl font-bold text-foreground">
                  {stat.value}
                </div>
                <div
                  className={`text-xs ${
                    stat.positive ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {stat.change}
                </div>
              </div>
            ))}
          </div>

          {/* Live Chart */}
          <div className="p-6 glass-card rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">
                Smart Money Flow Index
              </span>
              <span className="flex items-center gap-2 text-xs text-primary">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Updating live
              </span>
            </div>

            <div className="flex items-end h-48 gap-1">
              {chartData.map((value, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${value}%` }}
                  transition={{ duration: 0.5 }}
                  className="flex-1 rounded-t"
                  style={{
                    background:
                      value > 50
                        ? `linear-gradient(to top, hsl(190, 100%, 50%), hsl(160, 100%, 50%))`
                        : `linear-gradient(to top, hsl(270, 100%, 65%), hsl(220, 100%, 60%))`,
                    opacity: 0.6 + value / 250,
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
