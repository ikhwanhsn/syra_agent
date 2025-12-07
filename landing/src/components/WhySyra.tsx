import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Shield, Target, Zap, Eye, Lock, Coins, Check, X, Minus } from "lucide-react";

const valueProps = [
  {
    icon: Shield,
    title: "Bank-Grade Security",
    description: "Multi-layer encryption, cold storage integration, and audited smart contracts",
  },
  {
    icon: Target,
    title: "99.9% Accuracy",
    description: "Our AI models achieve industry-leading accuracy in sentiment prediction",
  },
  {
    icon: Zap,
    title: "Sub-ms Execution",
    description: "Lightning-fast order routing across 50+ DEXs with optimal slippage",
  },
  {
    icon: Eye,
    title: "Full Transparency",
    description: "Open-source algorithms and verifiable on-chain execution logs",
  },
  {
    icon: Lock,
    title: "Non-Custodial",
    description: "Your keys, your crypto. We never hold or access your funds",
  },
  {
    icon: Coins,
    title: "Low Fees",
    description: "Competitive pricing with volume discounts and $SYRA holder benefits",
  },
];

const comparisonData = [
  { feature: "AI Sentiment Analysis", syra: true, arkham: true, nansen: false, dexscreener: false },
  { feature: "Whale Tracking", syra: true, arkham: true, nansen: true, dexscreener: false },
  { feature: "Automated Execution", syra: true, arkham: false, nansen: false, dexscreener: false },
  { feature: "Risk Scoring", syra: true, arkham: "partial", nansen: "partial", dexscreener: false },
  { feature: "Multi-Chain Support", syra: true, arkham: true, nansen: true, dexscreener: true },
  { feature: "Real-time Alerts", syra: true, arkham: true, nansen: true, dexscreener: "partial" },
  { feature: "API Access", syra: true, arkham: "partial", nansen: true, dexscreener: false },
  { feature: "Non-Custodial", syra: true, arkham: true, nansen: true, dexscreener: true },
];

const renderStatus = (status: boolean | string) => {
  if (status === true) return <Check className="w-5 h-5 text-green-400" />;
  if (status === false) return <X className="w-5 h-5 text-red-400/50" />;
  return <Minus className="w-5 h-5 text-yellow-400" />;
};

export const WhySyra = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={ref} className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block text-primary text-sm font-medium mb-4 tracking-wider uppercase"
          >
            Why Choose Syra
          </motion.span>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6"
          >
            Built for <span className="neon-text">Serious Traders</span>
          </motion.h2>
        </div>

        {/* Value Props Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {valueProps.map((prop, index) => (
            <motion.div
              key={prop.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              className="glass-card p-6 rounded-2xl text-center group hover:border-primary/30 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <prop.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{prop.title}</h3>
              <p className="text-sm text-muted-foreground">{prop.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="glass-card p-8 rounded-2xl overflow-hidden"
        >
          <h3 className="text-2xl font-bold mb-8 text-center">
            How Syra <span className="neon-text">Compares</span>
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 text-muted-foreground font-medium">Feature</th>
                  <th className="py-4 px-4 text-center">
                    <span className="neon-text font-bold">SYRA</span>
                  </th>
                  <th className="py-4 px-4 text-center text-muted-foreground">Arkham</th>
                  <th className="py-4 px-4 text-center text-muted-foreground">Nansen</th>
                  <th className="py-4 px-4 text-center text-muted-foreground">DEXScreener</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, i) => (
                  <tr key={row.feature} className="border-b border-border/50 hover:bg-primary/5 transition-colors">
                    <td className="py-4 px-4 text-sm">{row.feature}</td>
                    <td className="py-4 px-4">
                      <div className="flex justify-center">{renderStatus(row.syra)}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-center">{renderStatus(row.arkham)}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-center">{renderStatus(row.nansen)}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-center">{renderStatus(row.dexscreener)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
