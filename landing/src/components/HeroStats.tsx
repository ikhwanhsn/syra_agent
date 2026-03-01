import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { API_BASE } from "../../config/global";

const STAT_LABELS = [
  { key: "users", label: "Users", suffix: "+", decimals: 0 },
  { key: "uptime", label: "Uptime", suffix: "%", decimals: 1 },
  { key: "signals", label: "Signals", suffix: "+", decimals: 0 },
  { key: "tools", label: "Tools", suffix: "+", decimals: 0 },
] as const;

const FALLBACK_STATS = { users: 0, uptime: 99.9, signals: 0, tools: 15 };

const AnimatedNumber = ({
  value,
  prefix,
  suffix,
  decimals,
}: {
  value: number;
  prefix: string;
  suffix: string;
  decimals: number;
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const stepValue = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return num.toLocaleString("en-US", { maximumFractionDigits: 0 });
    }
    return num.toFixed(decimals);
  };

  return (
    <span>
      {prefix}
      {formatNumber(displayValue)}
      {suffix}
    </span>
  );
};

export const HeroStats = () => {
  const [stats, setStats] = useState<Record<string, number>>(FALLBACK_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/info/stats`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to fetch"))))
      .then((data) => {
        if (!cancelled && data && typeof data.users === "number") {
          setStats({
            users: data.users,
            uptime: typeof data.uptime === "number" ? data.uptime : FALLBACK_STATS.uptime,
            signals: typeof data.signals === "number" ? data.signals : FALLBACK_STATS.signals,
            tools: typeof data.tools === "number" ? data.tools : FALLBACK_STATS.tools,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setStats(FALLBACK_STATS);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6 }}
      className="w-4/5 p-6 mx-auto mt-12 sm:mx-0 sm:w-full glass-card"
    >
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {STAT_LABELS.map(({ key, label, suffix, decimals }, index) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
            className="text-center"
          >
            <div className="mb-1 text-2xl font-bold md:text-3xl neon-text">
              {loading ? (
                <span>—</span>
              ) : key === "signals" && (stats.signals ?? 0) < 1000 ? (
                <AnimatedNumber
                  value={1000}
                  prefix=""
                  suffix={suffix}
                  decimals={decimals}
                />
              ) : (
                <AnimatedNumber
                  value={stats[key] ?? 0}
                  prefix=""
                  suffix={suffix}
                  decimals={decimals}
                />
              )}
            </div>
            <div className="text-xs tracking-wider uppercase md:text-sm text-muted-foreground">
              {label}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
