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
    title: "Lightning Execution",
    description: "Sub-millisecond trade execution across multiple chains and DEXs",
  },
  {
    icon: Globe,
    title: "Multi-Chain Support",
    description: "Seamlessly operate across Ethereum, Solana, BSC, and 20+ networks",
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              className="glass-card p-6 rounded-2xl group hover:border-primary/30 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
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
