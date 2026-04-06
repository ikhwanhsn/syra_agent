import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { MessageSquare, AlertTriangle, Waves, Newspaper, Bot } from "lucide-react";

const modules = [
  {
    icon: MessageSquare,
    title: "Sentiment Analysis API",
    description: "Real-time sentiment scoring from social media, news, and on-chain signals. Our AI processes millions of data points to gauge market mood.",
    features: ["Twitter/X Integration", "Fear & Greed Index", "Custom Alerts"], // "Telegram Monitoring" hidden: focus on website
    gradient: "from-neon-cyan to-neon-blue",
  },
  {
    icon: AlertTriangle,
    title: "Risk Scoring Engine",
    description: "Comprehensive risk assessment for tokens, protocols, and wallets. Identify rug pulls and security threats before they impact your portfolio.",
    features: ["Token Audits", "Liquidity Analysis", "Holder Distribution", "Contract Verification"],
    gradient: "from-neon-blue to-neon-purple",
  },
  {
    icon: Waves,
    title: "Whale Tracker & Smart Money Flow",
    description: "Track institutional wallets and smart money movements in real-time. Know where the whales are moving before the market reacts.",
    features: ["Top 100 Wallets", "DEX Flow Analysis", "Accumulation Zones", "Exit Signals"],
    gradient: "from-neon-purple to-neon-cyan",
  },
  {
    icon: Newspaper,
    title: "On-chain News Intelligence",
    description: "AI-curated news aggregation with impact scoring. Cut through the noise and focus on events that actually move markets.",
    features: ["Breaking News Alerts", "Impact Scoring", "Source Verification", "Trend Detection"],
    gradient: "from-neon-gold to-accent",
  },
  {
    icon: Bot,
    title: "AI Execution Agent",
    description: "Automated trade execution based on your custom strategies. Set it and forget it with our battle-tested execution engine.",
    features: ["Strategy Builder", "Multi-DEX Routing", "Gas Optimization", "Slippage Protection"],
    gradient: "from-neon-cyan to-neon-gold",
  },
];

const iconColors = [
  "text-primary",
  "text-foreground",
  "text-foreground",
  "text-foreground",
  "text-primary",
];

/** Shared border uses foreground so dark mode isn’t washed out (accent/30 on ~16% L accent is nearly invisible). */
const chipStyles = [
  "border border-foreground/22 bg-accent/12 text-accent-foreground",
  "border border-foreground/22 bg-neon-gold/12 text-foreground",
  "border border-foreground/22 bg-success/12 text-foreground",
];

const hoverStyles = [
  "hover:border-accent/35 hover:shadow-[0_0_36px_-8px_hsl(var(--accent)/0.18)]",
  "hover:border-neon-gold/35 hover:shadow-[0_0_36px_-8px_hsl(var(--neon-gold)/0.16)]",
  "hover:border-success/35 hover:shadow-[0_0_36px_-8px_hsl(var(--success)/0.16)]",
  "hover:border-neon-gold/30 hover:shadow-[0_0_36px_-8px_hsl(var(--neon-gold)/0.14)]",
  "hover:border-accent/30 hover:shadow-[0_0_36px_-8px_hsl(var(--accent)/0.14)]",
];

export const ProductModules = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="product" className="relative py-24 overflow-hidden">
      {/* Background gradients - theme colors */}
      <div className="absolute top-1/2 left-0 w-[520px] h-[520px] bg-foreground/[0.06] rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[480px] h-[480px] bg-muted/60 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[340px] h-[340px] bg-accent/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[280px] h-[280px] bg-success/8 rounded-full blur-[90px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div ref={ref} className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="section-eyebrow-gradient inline-block text-sm font-medium mb-4 tracking-wider uppercase"
          >
            Core Infrastructure
          </motion.span>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6"
          >
            Powerful <span className="neon-text">AI Modules</span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto max-w-3xl text-base text-muted-foreground sm:text-lg"
          >
            Each module is designed to work independently or in concert, giving you 
            the flexibility to build custom trading strategies.
          </motion.p>
        </div>

        <div className="space-y-8">
          {modules.map((module, index) => (
            <motion.div
              key={module.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.15 }}
              className={`glass-card rounded-2xl p-8 transition-all duration-300 ${hoverStyles[index % hoverStyles.length]} ${
                index % 2 === 0 ? "" : "lg:flex-row-reverse"
              }`}
            >
              <div className={`flex flex-col lg:flex-row gap-8 items-center ${
                index % 2 !== 0 ? "lg:flex-row-reverse" : ""
              }`}>
                {/* Icon & Visual */}
                <div className="lg:w-1/3 flex justify-center">
                  <div className={`relative w-32 h-32 rounded-2xl bg-gradient-to-br ${module.gradient} p-0.5`}>
                    <div className="w-full h-full rounded-2xl bg-card flex items-center justify-center">
                      <module.icon
                        className={`w-16 h-16 ${iconColors[index % iconColors.length]}`}
                        strokeWidth={2}
                      />
                    </div>
                    {/* Glow */}
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${module.gradient} opacity-20 blur-xl -z-10`} />
                  </div>
                </div>

                {/* Content */}
                <div className="lg:w-2/3 text-center lg:text-left">
                  <h3 className="text-2xl font-bold mb-3 text-foreground">
                    {module.title}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {module.description}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center lg:justify-start py-0.5">
                    {module.features.map((feature, fi) => (
                      <span
                        key={feature}
                        className={`rounded-full px-3 py-1 text-xs ${chipStyles[(index + fi) % chipStyles.length]}`}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
