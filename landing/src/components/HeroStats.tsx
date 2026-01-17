import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const stats = [
  { label: "Users", value: 600, suffix: "+", prefix: "", decimals: 0 },
  { label: "Uptime", value: 99.99, suffix: "%", prefix: "", decimals: 2 },
  {
    label: "Signals",
    value: 1760,
    suffix: "+",
    prefix: "",
    decimals: 1,
  },
  {
    label: "Tools",
    value: 15,
    suffix: "+",
    prefix: "",
    decimals: 0,
  },
];

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
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6 }}
      className="w-4/5 p-6 mx-auto mt-12 sm:mx-0 sm:w-full glass-card"
    >
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
            className="text-center"
          >
            <div className="mb-1 text-2xl font-bold md:text-3xl neon-text">
              <AnimatedNumber
                value={stat.value}
                prefix={stat.prefix}
                suffix={stat.suffix}
                decimals={stat.decimals}
              />
            </div>
            <div className="text-xs tracking-wider uppercase md:text-sm text-muted-foreground">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
