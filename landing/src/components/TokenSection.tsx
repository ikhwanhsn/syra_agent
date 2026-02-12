// import { motion } from "framer-motion";
// import { useInView } from "framer-motion";
// import { useRef } from "react";
// import { Flame, Vote, Lock, TrendingUp, Coins } from "lucide-react";
// import { useQuery } from "@tanstack/react-query";

// const utilities = [
//   {
//     icon: Flame,
//     title: "Buyback & Burn",
//     description:
//       "A portion of all x402 transaction fees are used to buy back and burn $SYRA, creating deflationary pressure.",
//     highlight: "80% of all fees + 50% revenue",
//   },
//   {
//     icon: Vote,
//     title: "Governance",
//     description:
//       "Hold $SYRA to vote on protocol upgrades, new feature prioritization, and treasury allocations.",
//     highlight: "1 token = 1 vote",
//   },
//   {
//     icon: Lock,
//     title: "Premium Access",
//     description:
//       "Stake $SYRA to unlock premium modules, higher API limits, and exclusive alpha signals.",
//     highlight: "Tier-based access",
//   },
//   {
//     icon: TrendingUp,
//     title: "Revenue Share",
//     description:
//       "Stakers receive 10% of protocol revenue, distributed weekly in ETH/USDC.",
//     highlight: "10% to stakers",
//   },
// ];

// export const TokenSection = () => {
//   const ref = useRef(null);
//   const isInView = useInView(ref, { once: true, margin: "-100px" });

//   return (
//     <section id="token" className="relative py-24 overflow-hidden">
//       {/* Background */}
//       <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-neon-gold/5 rounded-full blur-[150px] pointer-events-none" />

//       <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
//         <div ref={ref} className="mb-16 text-center">
//           <motion.span
//             initial={{ opacity: 0, y: 20 }}
//             animate={isInView ? { opacity: 1, y: 0 } : {}}
//             transition={{ duration: 0.5 }}
//             className="inline-block mb-4 text-sm font-medium tracking-wider uppercase text-neon-gold"
//           >
//             Token Utility
//           </motion.span>

//           <motion.h2
//             initial={{ opacity: 0, y: 20 }}
//             animate={isInView ? { opacity: 1, y: 0 } : {}}
//             transition={{ duration: 0.5, delay: 0.1 }}
//             className="mb-6 text-3xl font-bold sm:text-4xl lg:text-5xl"
//           >
//             The <span className="gold-text">$SYRA</span> Token
//           </motion.h2>

//           <motion.p
//             initial={{ opacity: 0, y: 20 }}
//             animate={isInView ? { opacity: 1, y: 0 } : {}}
//             transition={{ duration: 0.5, delay: 0.2 }}
//             className="max-w-3xl mx-auto text-lg text-muted-foreground"
//           >
//             $SYRA is the utility and governance token powering the entire Syra
//             ecosystem. Hold, stake, and participate in the future of AI-powered
//             trading.
//           </motion.p>
//         </div>

//         <div className="grid items-center gap-8 lg:grid-cols-2">
//           {/* Token Visual */}
//           <motion.div
//             initial={{ opacity: 0, x: -50 }}
//             animate={isInView ? { opacity: 1, x: 0 } : {}}
//             transition={{ duration: 0.6, delay: 0.3 }}
//             className="relative flex justify-center"
//           >
//             <div className="relative">
//               {/* Outer glow ring */}
//               <div className="absolute inset-0 rounded-full bg-gradient-to-r from-neon-gold to-amber-500 opacity-20 blur-2xl animate-pulse-glow" />

//               {/* Token circle */}
//               <div className="relative flex items-center justify-center w-64 h-64 border rounded-full bg-gradient-to-br from-neon-gold/20 to-amber-600/20 border-neon-gold/30">
//                 <div className="flex items-center justify-center w-48 h-48 border rounded-full bg-gradient-to-br from-neon-gold/30 to-amber-500/30 border-neon-gold/40">
//                   <div className="text-center">
//                     <Coins className="w-16 h-16 mx-auto mb-2 text-neon-gold" />
//                     <span className="text-3xl font-bold gold-text">$SYRA</span>
//                   </div>
//                 </div>
//               </div>

//               {/* Orbiting elements */}
//               <motion.div
//                 className="absolute top-0 -translate-x-1/2 -translate-y-1/2 left-1/2"
//                 animate={{ rotate: 360 }}
//                 transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
//                 style={{ transformOrigin: "center 128px" }}
//               >
//                 <div className="w-4 h-4 rounded-full shadow-lg bg-neon-gold shadow-neon-gold/50" />
//               </motion.div>
//             </div>
//           </motion.div>

//           {/* Utilities Grid */}
//           <div className="grid gap-4 sm:grid-cols-2">
//             {utilities.map((util, index) => (
//               <motion.div
//                 key={util.title}
//                 initial={{ opacity: 0, y: 30 }}
//                 animate={isInView ? { opacity: 1, y: 0 } : {}}
//                 transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
//                 className="p-5 transition-all duration-300 glass-card rounded-xl group hover:border-neon-gold/30"
//               >
//                 <div className="flex items-start gap-4">
//                   <div className="flex items-center justify-center w-10 h-10 transition-colors rounded-lg bg-neon-gold/10 shrink-0 group-hover:bg-neon-gold/20">
//                     <util.icon className="w-5 h-5 text-neon-gold" />
//                   </div>
//                   <div>
//                     <h3 className="mb-1 font-semibold">{util.title}</h3>
//                     <p className="mb-2 text-xs text-muted-foreground">
//                       {util.description}
//                     </p>
//                     <span className="text-xs font-medium text-neon-gold">
//                       {util.highlight}
//                     </span>
//                   </div>
//                 </div>
//               </motion.div>
//             ))}
//           </div>
//         </div>

//         {/* Tokenomics Info */}
//         <motion.div
//           initial={{ opacity: 0, y: 40 }}
//           animate={isInView ? { opacity: 1, y: 0 } : {}}
//           transition={{ duration: 0.6, delay: 0.7 }}
//           className="p-8 mt-16 glass-card rounded-2xl"
//         >
//           <div className="grid gap-8 text-center md:grid-cols-4">
//             {[
//               { label: "Total Supply", value: "1B" },
//               { label: "Circulating", value: "995M" },
//               { label: "Staked", value: "(soon)" },
//               { label: "Burned", value: "5M+" },
//             ].map((stat) => (
//               <div key={stat.label}>
//                 <div className="mb-1 text-3xl font-bold gold-text">
//                   {stat.value}
//                 </div>
//                 <div className="text-sm text-muted-foreground">
//                   {stat.label}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </motion.div>
//       </div>
//     </section>
//   );
// };

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Flame, Vote, Lock, TrendingUp, Coins, Trophy, Copy, Check } from "lucide-react";

const utilities = [
  {
    icon: Flame,
    title: "Buyback & Burn",
    description:
      "A portion of all x402 transaction fees are used to buy back and burn $SYRA, creating deflationary pressure.",
    highlight: "Fees + revenue",
  },
  {
    icon: Vote,
    title: "Governance",
    description:
      "Hold $SYRA to vote on protocol upgrades, new feature prioritization, and treasury allocations.",
    highlight: "1 token = 1 vote",
  },
  {
    icon: Lock,
    title: "Premium Access",
    description:
      "Stake $SYRA to unlock premium modules, higher API limits, and exclusive alpha signals.",
    highlight: "Tier-based access",
  },
  {
    icon: TrendingUp,
    title: "Revenue Share",
    description:
      "Stakers receive 10% of protocol revenue, distributed weekly in ETH/USDC.",
    highlight: "10% to stakers",
  },
];

export const TokenSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [copied, setCopied] = useState(false);
  
  const tokenAddress = "8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump";
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(tokenAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <section id="token" className="relative py-24 overflow-hidden">
      {/* Background - theme colors */}
      <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-neon-gold/8 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/3 left-0 w-[400px] h-[400px] bg-accent/6 rounded-full blur-[100px] pointer-events-none" />

      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8 relative">
        <div ref={ref} className="mb-16 text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block mb-4 text-sm font-medium tracking-wider uppercase text-neon-gold"
          >
            Token Utility
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 text-3xl font-bold sm:text-4xl lg:text-5xl"
          >
            The <span className="gold-text">$SYRA</span> Token
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-3xl mx-auto text-lg text-muted-foreground"
          >
            $SYRA is the utility and governance token powering the entire Syra
            ecosystem. Hold, stake, and participate in the future of AI-powered
            trading.
          </motion.p>

          {/* Token Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="max-w-2xl mx-auto mt-8"
          >
            <div className="p-6 glass-card rounded-xl border border-neon-gold/20 hover:border-neon-gold/40 transition-all duration-300">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                <div className="flex-1 text-center sm:text-left">
                  <div className="mb-2 text-sm font-medium text-muted-foreground">
                    Token Contract Address
                  </div>
                  <div className="flex items-center justify-center gap-2 sm:justify-start">
                    <span className="font-mono text-sm break-all text-foreground">
                      {tokenAddress}
                    </span>
                  </div>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-300 border rounded-lg border-neon-gold/30 bg-neon-gold/10 text-neon-gold hover:bg-neon-gold/20 hover:border-neon-gold/50 hover:scale-105 shrink-0"
                  title="Copy address"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Reward Leaderboard Button - hidden */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6 hidden"
          >
            <a
              href="/leaderboard"
              className="inline-flex items-center gap-2 px-6 py-3 font-medium transition-all duration-300 border rounded-lg border-neon-gold/30 bg-neon-gold/10 text-neon-gold hover:bg-neon-gold/20 hover:border-neon-gold/50 hover:scale-105 group"
            >
              <Trophy className="w-5 h-5 transition-transform group-hover:rotate-12" />
              Reward Leaderboard
            </a>
          </motion.div>
        </div>

        <div className="grid items-center gap-8 lg:grid-cols-2">
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
              <div className="relative flex items-center justify-center w-64 h-64 border rounded-full bg-gradient-to-br from-neon-gold/20 to-amber-600/20 border-neon-gold/30">
                <div className="flex items-center justify-center w-48 h-48 border rounded-full bg-gradient-to-br from-neon-gold/30 to-amber-500/30 border-neon-gold/40">
                  <div className="text-center">
                    <Coins className="w-16 h-16 mx-auto mb-2 text-neon-gold" />
                    <span className="text-3xl font-bold gold-text">$SYRA</span>
                  </div>
                </div>
              </div>

              {/* Orbiting elements */}
              <motion.div
                className="absolute top-0 -translate-x-1/2 -translate-y-1/2 left-1/2"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: "center 128px" }}
              >
                <div className="w-4 h-4 rounded-full shadow-lg bg-neon-gold shadow-neon-gold/50" />
              </motion.div>
            </div>
          </motion.div>

          {/* Utilities Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {utilities.map((util, index) => (
              <motion.div
                key={util.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                className="p-5 transition-all duration-300 glass-card rounded-xl group hover:border-neon-gold/30"
              >
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 transition-colors rounded-lg bg-neon-gold/10 shrink-0 group-hover:bg-neon-gold/20">
                    <util.icon className="w-5 h-5 text-neon-gold" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold">{util.title}</h3>
                    <p className="mb-2 text-xs text-muted-foreground">
                      {util.description}
                    </p>
                    <span className="text-xs font-medium text-neon-gold">
                      {util.highlight}
                    </span>
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
          className="p-8 mt-16 glass-card rounded-2xl"
        >
          <div className="grid gap-8 text-center md:grid-cols-4">
            {[
              { label: "Total Supply", value: "1B" },
              { label: "Circulating", value: "995M" },
              { label: "Staked", value: "(soon)" },
              { label: "Burned", value: "5M+" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="mb-1 text-3xl font-bold gold-text">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <style>{`
        .gold-text {
          background: linear-gradient(135deg, #FFD700, #FFA500);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }

        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }

        :root {
          --neon-gold: 45 100% 51%;
        }

        .text-neon-gold {
          color: hsl(var(--neon-gold));
        }

        .bg-neon-gold {
          background-color: hsl(var(--neon-gold));
        }

        .border-neon-gold {
          border-color: hsl(var(--neon-gold));
        }

        .bg-neon-gold\/10 {
          background-color: hsl(var(--neon-gold) / 0.1);
        }

        .bg-neon-gold\/20 {
          background-color: hsl(var(--neon-gold) / 0.2);
        }

        .border-neon-gold\/30 {
          border-color: hsl(var(--neon-gold) / 0.3);
        }

        .border-neon-gold\/40 {
          border-color: hsl(var(--neon-gold) / 0.4);
        }

        .border-neon-gold\/50 {
          border-color: hsl(var(--neon-gold) / 0.5);
        }

        .from-neon-gold\/20 {
          --tw-gradient-from: hsl(var(--neon-gold) / 0.2);
        }

        .to-amber-600\/20 {
          --tw-gradient-to: hsl(30 100% 40% / 0.2);
        }

        .from-neon-gold\/30 {
          --tw-gradient-from: hsl(var(--neon-gold) / 0.3);
        }

        .to-amber-500\/30 {
          --tw-gradient-to: hsl(38 100% 50% / 0.3);
        }

        .shadow-neon-gold {
          --tw-shadow-color: hsl(var(--neon-gold));
        }

        .shadow-neon-gold\/50 {
          --tw-shadow-color: hsl(var(--neon-gold) / 0.5);
        }
      `}</style>
    </section>
  );
};
