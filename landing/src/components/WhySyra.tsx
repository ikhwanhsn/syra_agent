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
    title: "High Accuracy",
    description:
      "Our AI models deliver strong accuracy in sentiment prediction and market analysis",
  },
  {
    icon: Zap,
    title: "Fast Execution",
    description:
      "Efficient execution on Solana DEXs with slippage protection via x402",
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
  if (status === true) return <Check className="h-5 w-5 text-success" />;
  if (status === false) return <X className="h-5 w-5 text-destructive/60" />;
  return <Minus className="h-5 w-5 text-warning" />;
};

export const WhySyra = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute top-1/4 right-0 w-[420px] h-[420px] bg-accent/11 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-0 w-[380px] h-[380px] bg-neon-gold/10 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-[280px] h-[280px] bg-success/8 rounded-full blur-[85px] pointer-events-none" />
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8 relative">
        <div ref={ref} className="mb-16 text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="section-eyebrow-gradient mb-4 inline-block text-sm font-medium tracking-wider uppercase"
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
              className={`glass-card group rounded-2xl p-6 text-center transition-all duration-300 ${
                index % 3 === 0
                  ? "hover:border-accent/35 hover:shadow-[0_0_32px_-10px_hsl(var(--accent)/0.18)]"
                  : index % 3 === 1
                    ? "hover:border-neon-gold/35 hover:shadow-[0_0_32px_-10px_hsl(var(--neon-gold)/0.16)]"
                    : "hover:border-success/35 hover:shadow-[0_0_32px_-10px_hsl(var(--success)/0.16)]"
              }`}
            >
              <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${
                index % 3 === 0 ? "bg-accent/10" : index % 3 === 1 ? "bg-neon-gold/10" : "bg-success/10"
              }`}>
                <prop.icon className={`h-7 w-7 ${index % 3 === 0 ? "text-accent" : index % 3 === 1 ? "text-neon-gold" : "text-success"}`} />
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
          className="glass-card overflow-hidden rounded-2xl border border-accent/10 p-4 sm:p-6 md:p-8"
        >
          <h3 className="mb-6 text-center text-xl font-bold sm:mb-8 sm:text-2xl">
            How Syra <span className="neon-text">Compares</span>
          </h3>

          <p className="mb-3 text-center text-xs text-muted-foreground sm:hidden">
            Swipe horizontally to see all columns
          </p>

          <div className="relative z-10 w-full overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch] touch-pan-x">
            <div className="min-w-[520px] sm:min-w-[600px]">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground sm:px-4 sm:py-4 sm:text-sm">
                      Feature
                    </th>
                    <th className="px-2 py-3 text-center sm:px-4 sm:py-4">
                      <span className="text-sm font-bold neon-text sm:text-base">SYRA</span>
                    </th>
                    <th className="px-2 py-3 text-center text-xs text-muted-foreground sm:px-4 sm:py-4 sm:text-sm">
                      Arkham
                    </th>
                    <th className="px-2 py-3 text-center text-xs text-muted-foreground sm:px-4 sm:py-4 sm:text-sm">
                      Nansen
                    </th>
                    <th className="px-2 py-3 text-center text-xs text-muted-foreground sm:px-4 sm:py-4 sm:text-sm">
                      DEXScreener
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, i) => (
                    <tr
                      key={row.feature}
                      className="border-b border-border/50 transition-colors hover:bg-accent/[0.04]"
                    >
                      <td className="px-2 py-3 text-xs sm:px-4 sm:py-4 sm:text-sm">
                        {row.feature}
                      </td>
                      <td className="px-2 py-3 sm:px-4 sm:py-4">
                        <div className="flex justify-center">
                          {renderStatus(row.syra)}
                        </div>
                      </td>
                      <td className="px-2 py-3 sm:px-4 sm:py-4">
                        <div className="flex justify-center">
                          {renderStatus(row.arkham)}
                        </div>
                      </td>
                      <td className="px-2 py-3 sm:px-4 sm:py-4">
                        <div className="flex justify-center">
                          {renderStatus(row.nansen)}
                        </div>
                      </td>
                      <td className="px-2 py-3 sm:px-4 sm:py-4">
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
