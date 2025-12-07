import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Flame, Vote, Lock, TrendingUp, Coins } from "lucide-react";

const utilities = [
  {
    icon: Flame,
    title: "Buyback & Burn",
    description: "A portion of all x402 transaction fees are used to buy back and burn $SYRA, creating deflationary pressure.",
    highlight: "2% of all fees",
  },
  {
    icon: Vote,
    title: "Governance",
    description: "Hold $SYRA to vote on protocol upgrades, new feature prioritization, and treasury allocations.",
    highlight: "1 token = 1 vote",
  },
  {
    icon: Lock,
    title: "Premium Access",
    description: "Stake $SYRA to unlock premium modules, higher API limits, and exclusive alpha signals.",
    highlight: "Tier-based access",
  },
  {
    icon: TrendingUp,
    title: "Revenue Share",
    description: "Stakers receive a share of protocol revenue, distributed weekly in ETH/USDC.",
    highlight: "Up to 40% APY",
  },
];

export const TokenSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="token" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-neon-gold/5 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={ref} className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block text-neon-gold text-sm font-medium mb-4 tracking-wider uppercase"
          >
            Token Utility
          </motion.span>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6"
          >
            The <span className="gold-text">$SYRA</span> Token
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-3xl mx-auto"
          >
            $SYRA is the utility and governance token powering the entire Syra ecosystem. 
            Hold, stake, and participate in the future of AI-powered trading.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Token Visual */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative flex justify-center"
          >
            <div className="relative">
              {/* Outer glow ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-neon-gold to-amber-500 opacity-20 blur-2xl animate-pulse-glow" />
              
              {/* Token circle */}
              <div className="relative w-64 h-64 rounded-full bg-gradient-to-br from-neon-gold/20 to-amber-600/20 border border-neon-gold/30 flex items-center justify-center">
                <div className="w-48 h-48 rounded-full bg-gradient-to-br from-neon-gold/30 to-amber-500/30 border border-neon-gold/40 flex items-center justify-center">
                  <div className="text-center">
                    <Coins className="w-16 h-16 text-neon-gold mx-auto mb-2" />
                    <span className="text-3xl font-bold gold-text">$SYRA</span>
                  </div>
                </div>
              </div>

              {/* Orbiting elements */}
              <motion.div
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: "center 128px" }}
              >
                <div className="w-4 h-4 rounded-full bg-neon-gold shadow-lg shadow-neon-gold/50" />
              </motion.div>
            </div>
          </motion.div>

          {/* Utilities Grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {utilities.map((util, index) => (
              <motion.div
                key={util.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                className="glass-card p-5 rounded-xl group hover:border-neon-gold/30 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-neon-gold/10 flex items-center justify-center shrink-0 group-hover:bg-neon-gold/20 transition-colors">
                    <util.icon className="w-5 h-5 text-neon-gold" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{util.title}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{util.description}</p>
                    <span className="text-xs text-neon-gold font-medium">{util.highlight}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Tokenomics Info */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-16 glass-card p-8 rounded-2xl"
        >
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { label: "Total Supply", value: "100M" },
              { label: "Circulating", value: "42M" },
              { label: "Staked", value: "28M" },
              { label: "Burned", value: "3.2M" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold gold-text mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
