import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import {
  MessageSquare,
  AlertTriangle,
  Waves,
  Wallet,
  Bot,
  Code2,
  Rocket,
} from "lucide-react";
import { SYRA_RAIL_MODULES } from "@/content/syraFocus";

const moduleIcons = [Code2, Wallet, Waves];
const moduleGradients = [
  "from-neon-cyan to-neon-blue",
  "from-neon-purple to-neon-cyan",
  "from-neon-blue to-neon-purple",
];

const intelligenceModules = [
  {
    icon: MessageSquare,
    title: "Sentiment Analysis",
    description: "Real-time sentiment from social, news, and on-chain signals.",
    features: ["Twitter/X", "Fear & Greed", "Custom alerts"],
  },
  {
    icon: AlertTriangle,
    title: "Risk Scoring",
    description: "Token and protocol risk — liquidity, holders, contract checks.",
    features: ["Rug detection", "Liquidity analysis", "Holder distribution"],
  },
  {
    icon: Waves,
    title: "Smart Money Flow",
    description: "Whale and smart-money tracking via Nansen — net flow, DEX trades, DCAs.",
    features: ["Net flow", "Holdings", "DEX trades"],
  },
  {
    icon: Bot,
    title: "Execution surfaces",
    description: "Strategy-aware swaps and routing on Solana with policy guardrails.",
    features: ["Multi-DEX", "Slippage protection", "Agent approval flows"],
  },
  {
    icon: Rocket,
    title: "Tokenized Equity Intelligence",
    description:
      "Live SPCX SpaceX IPO spread — Nasdaq vs on-chain premium/discount across xStocks venues.",
    features: ["SPCX launch", "Spread tracker", "Agent execution"],
  },
];

const iconColors = [
  "text-primary",
  "text-foreground",
  "text-foreground",
  "text-primary",
];

const chipStyles = [
  "border border-foreground/22 bg-accent/12 text-accent-foreground",
  "border border-foreground/22 bg-neon-gold/12 text-foreground",
  "border border-foreground/22 bg-success/12 text-foreground",
];

const hoverStyles = [
  "hover:border-accent/35 hover:shadow-[0_0_36px_-8px_hsl(var(--accent)/0.18)]",
  "hover:border-neon-gold/35 hover:shadow-[0_0_36px_-8px_hsl(var(--neon-gold)/0.16)]",
  "hover:border-success/35 hover:shadow-[0_0_36px_-8px_hsl(var(--success)/0.16)]",
];

export const ProductModules = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="product" className="relative py-24 overflow-hidden">
      <div className="absolute top-1/2 left-0 w-[520px] h-[520px] bg-foreground/[0.06] rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[480px] h-[480px] bg-muted/60 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[340px] h-[340px] bg-accent/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div ref={ref} className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="section-eyebrow-gradient inline-block text-sm font-medium mb-4 tracking-wider uppercase"
          >
            The Syra rail
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6"
          >
            One rail, <span className="neon-text">two halves</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto max-w-3xl text-base text-muted-foreground sm:text-lg"
          >
            Intelligence APIs agents pay for per call, wired to an agent money layer
            with wallets and policy — not five disconnected products.
          </motion.p>
        </div>

        <div className="space-y-8 mb-16">
          {SYRA_RAIL_MODULES.map((module, index) => {
            const Icon = moduleIcons[index] ?? Code2;
            return (
              <motion.div
                key={module.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.15 }}
                className={`glass-card rounded-2xl p-8 transition-all duration-300 ${hoverStyles[index % hoverStyles.length]}`}
              >
                <div
                  className={`flex flex-col lg:flex-row gap-8 items-center ${
                    index % 2 !== 0 ? "lg:flex-row-reverse" : ""
                  }`}
                >
                  <div className="lg:w-1/3 flex justify-center">
                    <div
                      className={`relative w-32 h-32 rounded-2xl bg-gradient-to-br ${moduleGradients[index % moduleGradients.length]} p-0.5`}
                    >
                      <div className="w-full h-full rounded-2xl bg-card flex items-center justify-center">
                        <Icon
                          className={`w-16 h-16 ${index === 0 ? "text-primary" : "text-foreground"}`}
                          strokeWidth={2}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="lg:w-2/3 text-center lg:text-left">
                    <h3 className="text-2xl font-bold mb-3 text-foreground">
                      {module.title}
                    </h3>
                    <p className="text-muted-foreground mb-4">{module.description}</p>
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
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mb-10"
        >
          <h3 className="text-xl font-semibold text-foreground mb-2">
            High-value routes on the rail
          </h3>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Agents pay repeatedly for these capabilities — each route is x402-gated and composable.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {intelligenceModules.map((module, index) => {
            const isPlaygroundLink = module.title === "Tokenized Equity Intelligence";
            const CardWrapper = isPlaygroundLink ? Link : "div";
            const cardProps = isPlaygroundLink
              ? { to: "/marketplace", className: "block no-underline" }
              : {};
            return (
              <motion.div
                key={module.title}
                initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.55 + index * 0.08 }}
              >
                <CardWrapper {...cardProps}>
                  <div
                    className={`glass-card rounded-2xl p-6 ${hoverStyles[index % hoverStyles.length]} ${isPlaygroundLink ? "cursor-pointer" : ""}`}
                  >
                    <module.icon
                      className={`w-8 h-8 mb-3 ${iconColors[index % iconColors.length]}`}
                      strokeWidth={2}
                    />
                    <h4 className="text-lg font-semibold text-foreground mb-2">{module.title}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{module.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {module.features.map((f, fi) => (
                        <span
                          key={f}
                          className={`rounded-full px-2.5 py-0.5 text-xs ${chipStyles[(index + fi) % chipStyles.length]}`}
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                    {isPlaygroundLink ? (
                      <p className="mt-3 text-xs font-medium text-primary">Try x402 API in marketplace →</p>
                    ) : null}
                  </div>
                </CardWrapper>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-12 text-center"
        >
          <Link
            to="/marketplace"
            className="btn-primary inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold no-underline"
          >
            Wire agents to Syra
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
