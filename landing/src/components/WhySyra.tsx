import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import {
  Shield,
  Target,
  Zap,
  Eye,
  Lock,
  Coins,
  Check,
  X,
  Minus,
} from "lucide-react";

const valueProps = [
  {
    icon: Shield,
    title: "Bank-Grade Security",
    description:
      "Multi-layer encryption, cold storage integration, and audited smart contracts",
  },
  {
    icon: Target,
    title: "99.9% Accuracy",
    description:
      "Our AI models achieve industry-leading accuracy in sentiment prediction",
  },
  {
    icon: Zap,
    title: "Sub-ms Execution",
    description:
      "Lightning-fast order routing across 50+ DEXs with optimal slippage",
  },
  {
    icon: Eye,
    title: "Full Transparency",
    description:
      "Open-source algorithms and verifiable on-chain execution logs",
  },
  {
    icon: Lock,
    title: "Non-Custodial",
    description: "Your keys, your crypto. We never hold or access your funds",
  },
  {
    icon: Coins,
    title: "Low Fees",
    description:
      "Competitive pricing with volume discounts and $SYRA holder benefits",
  },
];

const comparisonData = [
  {
    feature: "AI Sentiment Analysis",
    syra: true,
    arkham: true,
    nansen: false,
    dexscreener: false,
  },
  {
    feature: "Whale Tracking",
    syra: true,
    arkham: true,
    nansen: true,
    dexscreener: false,
  },
  {
    feature: "Automated Execution",
    syra: true,
    arkham: false,
    nansen: false,
    dexscreener: false,
  },
  {
    feature: "Risk Scoring",
    syra: true,
    arkham: "partial",
    nansen: "partial",
    dexscreener: false,
  },
  {
    feature: "Multi-Chain Support",
    syra: true,
    arkham: true,
    nansen: true,
    dexscreener: true,
  },
  {
    feature: "Real-time Alerts",
    syra: true,
    arkham: true,
    nansen: true,
    dexscreener: "partial",
  },
  {
    feature: "API Access",
    syra: true,
    arkham: "partial",
    nansen: true,
    dexscreener: false,
  },
  {
    feature: "Non-Custodial",
    syra: true,
    arkham: true,
    nansen: true,
    dexscreener: true,
  },
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
      <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-accent/7 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-0 w-[350px] h-[350px] bg-neon-gold/6 rounded-full blur-[90px] pointer-events-none" />
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8 relative">
        <div ref={ref} className="mb-16 text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block mb-4 text-sm font-medium tracking-wider uppercase text-primary"
          >
            Why Choose Syra
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 text-3xl font-bold sm:text-4xl lg:text-5xl"
          >
            Built for <span className="neon-text">Serious Traders</span>
          </motion.h2>
        </div>

        {/* Value Props Grid */}
        <div className="grid gap-6 mb-20 md:grid-cols-2 lg:grid-cols-3">
          {valueProps.map((prop, index) => (
            <motion.div
              key={prop.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              className={`p-6 text-center transition-all duration-300 glass-card rounded-2xl group ${
                index % 3 === 0 ? "hover:border-accent/25" : index % 3 === 1 ? "hover:border-neon-gold/25" : "hover:border-primary/30"
              }`}
            >
              <div className={`flex items-center justify-center mx-auto mb-4 transition-transform w-14 h-14 rounded-xl group-hover:scale-110 ${
                index % 3 === 0 ? "bg-accent/10" : index % 3 === 1 ? "bg-neon-gold/10" : "bg-primary/10"
              }`}>
                <prop.icon className={`w-7 h-7 ${index % 3 === 0 ? "text-accent" : index % 3 === 1 ? "text-neon-gold" : "text-primary"}`} />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{prop.title}</h3>
              <p className="text-sm text-muted-foreground">
                {prop.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="p-8 overflow-hidden glass-card rounded-2xl"
        >
          <h3 className="mb-8 text-2xl font-bold text-center">
            How Syra <span className="neon-text">Compares</span>
          </h3>

          <div className="relative z-10 w-full overflow-x-auto overscroll-x-contain">
            <div className="min-w-[600px]">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-4 font-medium text-left text-muted-foreground">
                      Feature
                    </th>
                    <th className="px-4 py-4 text-center">
                      <span className="font-bold neon-text">SYRA</span>
                    </th>
                    <th className="px-4 py-4 text-center text-muted-foreground">
                      Arkham
                    </th>
                    <th className="px-4 py-4 text-center text-muted-foreground">
                      Nansen
                    </th>
                    <th className="px-4 py-4 text-center text-muted-foreground">
                      DEXScreener
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, i) => (
                    <tr
                      key={row.feature}
                      className="transition-colors border-b border-border/50 hover:bg-primary/5"
                    >
                      <td className="px-4 py-4 text-sm">{row.feature}</td>
                      <td className="px-4 py-4">
                        <div className="flex justify-center">
                          {renderStatus(row.syra)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-center">
                          {renderStatus(row.arkham)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-center">
                          {renderStatus(row.nansen)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-center">
                          {renderStatus(row.dexscreener)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
