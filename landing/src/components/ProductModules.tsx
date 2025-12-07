import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { MessageSquare, AlertTriangle, Waves, Newspaper, Bot } from "lucide-react";

const modules = [
  {
    icon: MessageSquare,
    title: "Sentiment Analysis API",
    description: "Real-time sentiment scoring from social media, news, and on-chain signals. Our AI processes millions of data points to gauge market mood.",
    features: ["Twitter/X Integration", "Telegram Monitoring", "Fear & Greed Index", "Custom Alerts"],
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
    gradient: "from-neon-gold to-amber-500",
  },
  {
    icon: Bot,
    title: "AI Execution Agent",
    description: "Automated trade execution based on your custom strategies. Set it and forget it with our battle-tested execution engine.",
    features: ["Strategy Builder", "Multi-DEX Routing", "Gas Optimization", "Slippage Protection"],
    gradient: "from-neon-cyan to-neon-gold",
  },
];

export const ProductModules = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="product" className="relative py-24 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-neon-purple/10 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={ref} className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block text-primary text-sm font-medium mb-4 tracking-wider uppercase"
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
            className="text-lg text-muted-foreground max-w-3xl mx-auto"
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
              className={`glass-card p-8 rounded-2xl ${
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
                      <module.icon className="w-16 h-16 text-primary" strokeWidth={1.5} />
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
                  <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                    {module.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-3 py-1 text-xs rounded-full bg-primary/10 text-primary border border-primary/20"
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
