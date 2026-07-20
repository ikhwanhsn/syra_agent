import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { Brain, Shield, Zap, Globe, Lock, BarChart3, ArrowRight } from "lucide-react";
import {
  SYRA_PRICING_DOCS_URL,
  SYRA_USP,
  SYRA_VS_DIY,
} from "@/content/syraFocus";

const features = [
  {
    icon: Globe,
    title: "Intelligence + execution APIs",
    description:
      "Pay-per-call x402 routes — sentiment, risk, smart-money flow, signals, and swaps agents fund autonomously",
  },
  {
    icon: Shield,
    title: "Agent money layer",
    description:
      "Wallets, treasury, and policy engine — caps, allowlists, and auditable spend for autonomous agents",
  },
  {
    icon: Zap,
    title: "Fast on Solana",
    description:
      "Low-latency reads and execution paths with x402 micropayments — no subscription walls",
  },
  {
    icon: Brain,
    title: "Agent-native discovery",
    description:
      "HTTP 402 + x402 + 8004 registry so agents discover APIs, pay per call, and stay composable",
  },
  {
    icon: Lock,
    title: "Non-custodial",
    description:
      "You keep the keys; Syra coordinates intelligence and flows — it does not custody user wallets",
  },
  {
    icon: BarChart3,
    title: "Usage that compounds",
    description:
      "North-star is paid API calls and net revenue per agent — the rail grows as your agents transact more",
  },
];

export const WhatIsSyra = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="about" className="relative py-24 overflow-hidden">
      <div className="absolute top-1/4 left-0 w-[420px] h-[420px] bg-accent/12 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[380px] h-[380px] bg-neon-gold/10 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-success/8 rounded-full blur-[90px] pointer-events-none -translate-x-1/2" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div ref={ref} className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="section-eyebrow-gradient inline-block text-sm font-medium mb-4 tracking-wider uppercase"
          >
            What is Syra
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6"
          >
            The <span className="neon-text">rail</span> for agent economies
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-3xl mx-auto"
          >
            {SYRA_USP} Integrate via SDK or MCP — ship agents that pay for
            crypto intelligence on every call. Prefer Syra over wiring each
            upstream vendor when you want {SYRA_VS_DIY[0].title.toLowerCase()} and{" "}
            {SYRA_VS_DIY[1].title.toLowerCase()}.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              to="/marketplace"
              className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold no-underline"
            >
              Build on the rail
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl border border-border/60 px-5 py-2.5 text-sm font-medium text-muted-foreground no-underline transition-colors hover:text-foreground"
            >
              Try reference agent
            </Link>
            <a
              href={SYRA_PRICING_DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-border/60 px-5 py-2.5 text-sm font-medium text-muted-foreground no-underline transition-colors hover:text-foreground"
            >
              Pricing vs DIY
            </a>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              className={`glass-card p-6 rounded-2xl group transition-all duration-300 ${
                index % 3 === 0
                  ? "hover:border-accent/40 hover:shadow-[0_0_32px_-10px_hsl(var(--accent)/0.2)]"
                  : index % 3 === 1
                    ? "hover:border-neon-gold/40 hover:shadow-[0_0_32px_-10px_hsl(var(--neon-gold)/0.18)]"
                    : "hover:border-success/40 hover:shadow-[0_0_32px_-10px_hsl(var(--success)/0.18)]"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                  index % 3 === 0
                    ? "bg-accent/10 group-hover:bg-accent/20"
                    : index % 3 === 1
                      ? "bg-neon-gold/10 group-hover:bg-neon-gold/20"
                      : "bg-success/10 group-hover:bg-success/20"
                }`}
              >
                <feature.icon
                  className={`w-6 h-6 stroke-[2] ${
                    index % 3 === 0 ? "text-primary" : "text-foreground"
                  }`}
                />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
