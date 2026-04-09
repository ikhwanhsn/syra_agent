import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { API_BASE } from "../../config/global";

const statBarColors = ["bg-accent", "bg-neon-gold", "bg-success", "bg-accent"] as const;

const STAT_LABELS = [
  { key: "users", label: "Users", suffix: "+", decimals: 0 },
  { key: "chat", label: "Chat", suffix: "+", decimals: 0 },
  { key: "session", label: "Session", suffix: "+", decimals: 0 },
  { key: "tools", label: "Tools", suffix: "+", decimals: 0 },
] as const;

type StatKey = (typeof STAT_LABELS)[number]["key"];

const FALLBACK_STATS: Record<StatKey, number> = {
  users: 1000,
  chat: 1000,
  session: 10000,
  tools: 15,
};

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
  const [stats, setStats] = useState<Record<StatKey, number>>(FALLBACK_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/info/stats`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to fetch"))))
      .then((data: Record<string, unknown>) => {
        if (!cancelled && data && typeof data.users === "number") {
          setStats({
            users: data.users as number,
            chat: typeof data.chat === "number" ? (data.chat as number) : FALLBACK_STATS.chat,
            session:
              typeof data.session === "number" ? (data.session as number) : FALLBACK_STATS.session,
            tools: typeof data.tools === "number" ? (data.tools as number) : FALLBACK_STATS.tools,
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
      className="mx-auto mt-10 w-full max-w-lg glass-card p-4 sm:mt-12 sm:p-6 lg:mx-0 lg:max-w-none"
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
            <div
              className={cn(
                "mx-auto mt-2 h-1 w-10 rounded-full opacity-90",
                statBarColors[index % statBarColors.length],
              )}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
