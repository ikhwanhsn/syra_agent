// import { motion } from "framer-motion";
// import { useInView } from "framer-motion";
// import { useRef } from "react";
// import { Flame, Vote, Lock, TrendingUp, Coins } from "lucide-react";
// import { useQuery } from "@tanstack/react-query";

// const utilities = [
//   {
//     icon: Flame,
//     title: "Buyback & Airdrops",
//     description:
//       "A portion of x402 revenue buys $SYRA for treasury-held community airdrops.",
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
//       "Stakers receive 10% of protocol revenue, distributed weekly in SOL/USDC.",
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
//               <div className="absolute inset-0 rounded-full bg-gradient-to-r from-neon-gold to-accent opacity-20 blur-2xl animate-pulse-glow" />

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

import { motion, useInView } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Gift, Vote, Lock, TrendingUp, Trophy, Copy, Check, ExternalLink, ShoppingCart } from "lucide-react";
import syraLogo from "/images/logo.jpg";
import { cn } from "@/lib/utils";
import { Link } from "@/lib/navigation";
import { SYRA_BUY_SWAP_URL } from "@/lib/swapNavigation";
import { getSyraApiBase, LINK_STAKING } from "@/lib/marketing/global";
import {
  fetchStakingProtocolSummary,
  formatStakingStatsDisplay,
} from "@/lib/marketing/stakingStats";
import { SYRA_TOKENOMICS_DISPLAY } from "@/lib/marketing/syraTokenomics";

const SYRA_TOKEN_MINT = "8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump";

const SYRA_API_BASE = getSyraApiBase();

const SOLSCAN_TOKEN_URL = `https://solscan.io/token/${SYRA_TOKEN_MINT}?activity_type=ACTIVITY_SPL_BURN&exclude_amount_zero=true&remove_spam=false&page_size=10`;

const utilities = [
  {
    icon: Gift,
    title: "Buyback & usage rewards",
    description:
      "In production, ~80% of settled x402 USDC revenue is swapped to $SYRA via Jupiter and held in treasury. Paying wallets accrue claimable usage rewards from that inventory.",
    highlight: "Live — verify on /token",
    href: "/token",
    status: "live" as const,
  },
  {
    icon: Lock,
    title: "x402 fee discounts",
    description:
      "Hold or stake $SYRA for tiered API fee discounts (10k / 100k / 1M / 10M). Higher tiers also unlock elevated memecoin scan limits and free agent tools.",
    highlight: "Live in API pricing",
    href: LINK_STAKING,
    status: "live" as const,
  },
  {
    icon: TrendingUp,
    title: "Premium access",
    description:
      "Stake $SYRA on Streamflow to raise Pumpfun Alpha scan quotas and unlock holder perks in the agent.",
    highlight: "Live on Syra Staking",
    href: LINK_STAKING,
    status: "live" as const,
  },
  {
    icon: Vote,
    title: "Governance",
    description:
      "On-chain / off-chain voting for roadmap and treasury allocations is planned — not shipped yet. Do not treat $SYRA as a governance token today.",
    highlight: "Roadmap",
    status: "roadmap" as const,
  },
];

export const TokenSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [copied, setCopied] = useState(false);

  const { data: stakingSummary, isPending: isPendingStaking } = useQuery({
    queryKey: ["syra-staking-summary"],
    queryFn: ({ signal }) =>
      fetchStakingProtocolSummary(SYRA_API_BASE, { signal, network: "mainnet" }),
    refetchInterval: 120_000,
    staleTime: 60_000,
    retry: 2,
  });

  const stakingDisplay = useMemo(
    () => formatStakingStatsDisplay(stakingSummary),
    [stakingSummary],
  );

  const tokenomicsStats = useMemo(
    () => [
      {
        label: "Total Supply",
        value: SYRA_TOKENOMICS_DISPLAY.totalSupply,
        valueClass: "gold-text" as const,
      },
      {
        label: "Circulating",
        value: SYRA_TOKENOMICS_DISPLAY.circulating,
        valueClass: "text-primary" as const,
      },
      {
        label: "Burned",
        value: SYRA_TOKENOMICS_DISPLAY.burned,
        valueClass: "text-orange-400" as const,
        subLabel: "Total supply − circulating",
        href: SOLSCAN_TOKEN_URL,
      },
      {
        label: "Staked",
        value: isPendingStaking
          ? "…"
          : stakingDisplay
            ? stakingDisplay.totalLockedCompact
            : "—",
        valueClass: stakingDisplay ? ("text-primary" as const) : ("text-muted-foreground" as const),
        subLabel: stakingDisplay
          ? `${stakingDisplay.stakerCount.toLocaleString()} active staker${
              stakingDisplay.stakerCount === 1 ? "" : "s"
            }`
          : isPendingStaking
            ? "Loading on-chain locks…"
            : undefined,
        href: LINK_STAKING,
      },
      {
        label: "Buybacks → rewards",
        value: "Live",
        valueClass: "text-success" as const,
        subLabel: "Verify flushes on /token",
        href: "/token",
      },
    ],
    [isPendingStaking, stakingDisplay],
  );

  const tokenAddress = SYRA_TOKEN_MINT;
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(tokenAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // copy failed; user may have denied clipboard access
    }
  };

  return (
    <section id="token" className="relative py-24 overflow-hidden">
      {/* Background - theme colors */}
      <div className="pointer-events-none absolute top-1/2 right-0 h-[620px] w-[620px] rounded-full bg-foreground/[0.04] blur-[150px]" />
      <div className="absolute top-1/3 left-0 w-[420px] h-[420px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[320px] h-[320px] bg-success/8 rounded-full blur-[95px] pointer-events-none" />

      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8 relative">
        <div ref={ref} className="mb-16 text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="section-eyebrow-gradient mb-4 inline-block text-sm font-medium tracking-wider uppercase"
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
            $SYRA is the alignment token for Syra&apos;s agent economy. Hold or
            stake for live x402 fee discounts; paid API usage funds on-market
            buybacks that feed claimable usage rewards. Governance voting is
            roadmap — not live yet.
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
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:shrink-0">
                  <Link
                    to={SYRA_BUY_SWAP_URL}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-300 border rounded-lg border-neon-gold/50 bg-neon-gold/15 text-neon-gold hover:bg-neon-gold/25 hover:border-neon-gold/70 hover:scale-[1.02]"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Buy</span>
                  </Link>
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-300 border rounded-lg border-neon-gold/30 bg-neon-gold/10 text-neon-gold hover:bg-neon-gold/20 hover:border-neon-gold/50 hover:scale-[1.02]"
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
              {/* Neutral pulse (no gold / amber) */}
              <div className="animate-pulse-glow absolute inset-0 rounded-full bg-foreground/[0.08] blur-3xl" />

              {/* Outer ring — grayscale only */}
              <div className="relative flex h-64 w-64 items-center justify-center rounded-full border border-foreground/20 bg-gradient-to-b from-muted/50 to-muted/20 shadow-[inset_0_1px_0_0_hsl(var(--foreground)/0.08)]">
                {/* Inner ring */}
                <div className="flex h-52 w-52 items-center justify-center rounded-full border border-foreground/25 bg-card/70 p-1.5">
                  {/* Circular logo plate (matches black + white mark) */}
                  <div className="relative h-44 w-44 overflow-hidden rounded-full bg-black ring-1 ring-inset ring-foreground/15">
                    <img
                      src={syraLogo}
                      alt="SYRA"
                      width={176}
                      height={176}
                      className="h-full w-full select-none object-contain p-3 sm:p-4 pointer-events-none"
                      draggable={false}
                    />
                  </div>
                </div>
              </div>

              {/* Orbiting dot */}
              <motion.div
                className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: "center 128px" }}
              >
                <div className="h-4 w-4 rounded-full bg-foreground shadow-[0_0_14px_hsl(var(--foreground)/0.45)]" />
              </motion.div>
            </div>
          </motion.div>

          {/* Utilities Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {utilities.map((util, index) => {
              const t = index % 3;
              const borderHover =
                t === 0
                  ? "hover:border-accent/40 hover:shadow-[0_0_28px_-8px_hsl(var(--accent)/0.18)]"
                  : t === 1
                    ? "hover:border-neon-gold/40 hover:shadow-[0_0_28px_-8px_hsl(var(--neon-gold)/0.16)]"
                    : "hover:border-success/40 hover:shadow-[0_0_28px_-8px_hsl(var(--success)/0.16)]";
              const iconBox =
                t === 0
                  ? "bg-accent/10 group-hover:bg-accent/20"
                  : t === 1
                    ? "bg-neon-gold/10 group-hover:bg-neon-gold/20"
                    : "bg-success/10 group-hover:bg-success/20";
              const iconClass = "text-primary";
              const accentText = "text-primary";
              return (
              <motion.div
                key={util.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                className={cn(
                  "group rounded-xl glass-card p-5 transition-all duration-300 border border-transparent",
                  borderHover,
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors", iconBox)}>
                    <util.icon className={cn("h-5 w-5 stroke-[2.1]", iconClass)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="mb-1 font-semibold">{util.title}</h3>
                    <p className="mb-2 text-xs text-muted-foreground">
                      {util.description}
                    </p>
                    {util.highlight && (
                      "href" in util && util.href ? (
                        util.href.startsWith("http") ? (
                          <a
                            href={util.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              "inline-flex items-center gap-1 text-xs font-medium hover:underline",
                              accentText,
                            )}
                          >
                            {util.highlight}
                            <ExternalLink className="h-3 w-3" aria-hidden />
                          </a>
                        ) : (
                          <Link
                            to={util.href}
                            className={cn(
                              "inline-flex items-center gap-1 text-xs font-medium hover:underline",
                              accentText,
                            )}
                          >
                            {util.highlight}
                            {"status" in util && util.status === "roadmap" ? " · soon" : ""}
                          </Link>
                        )
                      ) : (
                        <span className={cn("text-xs font-medium", accentText)}>
                          {util.highlight}
                          {"status" in util && util.status === "roadmap" ? " · not shipped" : ""}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </motion.div>
              );
            })}
          </div>
        </div>

        {/* Tokenomics Info */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="glass-card mt-16 rounded-2xl border border-neon-gold/15 p-4 sm:p-6 md:p-8"
        >
          <div className="grid grid-cols-2 gap-6 text-center sm:grid-cols-3 lg:grid-cols-5 lg:gap-8">
            {tokenomicsStats.map((stat) => {
              const linkTitle =
                stat.label === "Burned"
                  ? "View $SYRA burns on Solscan"
                  : stat.label === "Staked"
                    ? "View Syra Staking"
                    : undefined;

              const valueNode = (
                <div className={cn("mb-1 text-3xl font-bold", stat.valueClass)}>
                  {stat.value}
                </div>
              );

              return (
                <div key={stat.label}>
                  {"href" in stat && stat.href ? (
                    <a
                      href={stat.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block rounded-lg transition-colors hover:bg-muted/30"
                      title={linkTitle}
                    >
                      {valueNode}
                    </a>
                  ) : (
                    valueNode
                  )}
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  {"subLabel" in stat && stat.subLabel ? (
                    <p className="mt-1 text-[11px] text-muted-foreground/80">
                      {stat.subLabel}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      <style>{`
        .gold-text {
          background: linear-gradient(
            135deg,
            hsl(var(--foreground) / 0.98),
            hsl(var(--muted-foreground))
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .glass-card {
          background: hsl(var(--glass-bg) / 0.92);
          backdrop-filter: blur(10px);
          border: 1px solid hsl(var(--glass-border) / 0.85);
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }

        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
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
          --tw-gradient-to: hsl(var(--foreground) / 0.1);
        }

        .from-neon-gold\/30 {
          --tw-gradient-from: hsl(var(--neon-gold) / 0.3);
        }

        .to-amber-500\/30 {
          --tw-gradient-to: hsl(var(--foreground) / 0.14);
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
