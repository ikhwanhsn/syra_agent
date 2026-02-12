import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Brain, Shield, Zap, Globe, Lock, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Intelligence",
    description: "Advanced machine learning models analyze market patterns in real-time",
  },
  {
    icon: Shield,
    title: "Institutional Security",
    description: "Enterprise-grade encryption and multi-sig protection for your assets",
  },
  {
    icon: Zap,
    title: "Fast Execution",
    description: "Efficient trade execution on Solana with pay-per-request x402 API access",
  },
  {
    icon: Globe,
    title: "Solana-Native",
    description: "Built for Solana with x402 programmable payments — pay only for what you use",
  },
  {
    icon: Lock,
    title: "Non-Custodial",
    description: "You maintain full control of your keys and assets at all times",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "Comprehensive dashboards with actionable insights and alerts",
  },
];

export const WhatIsSyra = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="about" className="relative py-24 overflow-hidden">
      <div className="absolute top-1/4 left-0 w-[400px] h-[400px] bg-accent/8 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[350px] h-[350px] bg-neon-gold/6 rounded-full blur-[90px] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div ref={ref} className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block text-primary text-sm font-medium mb-4 tracking-wider uppercase"
          >
            What is Syra
          </motion.span>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6"
          >
            The Future of{" "}
            <span className="neon-text">Automated Trading</span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-3xl mx-auto"
          >
            Syra provides the infrastructure layer for next-generation trading. 
            We combine cutting-edge AI with institutional-grade security to deliver 
            real-time market intelligence and automated execution strategies.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              className={`glass-card p-6 rounded-2xl group transition-all duration-300 ${
                index % 3 === 0 ? "hover:border-accent/30" : index % 3 === 1 ? "hover:border-neon-gold/25" : "hover:border-primary/30"
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                index % 3 === 0 ? "bg-accent/10 group-hover:bg-accent/20" : index % 3 === 1 ? "bg-neon-gold/10 group-hover:bg-neon-gold/20" : "bg-primary/10 group-hover:bg-primary/20"
              }`}>
                <feature.icon className={`w-6 h-6 ${index % 3 === 0 ? "text-accent" : index % 3 === 1 ? "text-neon-gold" : "text-primary"}`} />
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
