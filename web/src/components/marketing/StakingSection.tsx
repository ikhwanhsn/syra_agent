import { motion, useReducedMotion } from "framer-motion";
import { useInView } from "framer-motion";
import { useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Lock,
  Shield,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSyraApiBase, LINK_STAKING } from "@/lib/marketing/global";
import {
  fetchStakingProtocolSummary,
  formatStakingStatsDisplay,
} from "@/lib/marketing/stakingStats";

const SYRA_API_BASE = getSyraApiBase();

const benefits = [
  {
    icon: Shield,
    title: "Non-custodial locks",
    description:
      "SYRA stays in Streamflow token locks on Solana—you sign every position from your own wallet.",
  },
  {
    icon: Zap,
    title: "Automatic vesting",
    description:
      "Unlocked balances are delivered to your wallet as they vest. No manual claim loops.",
  },
  {
    icon: Sparkles,
    title: "Ecosystem alignment",
    description:
      "Stake to unlock premium agent modules, higher API tiers, and Syra product benefits as usage scales.",
  },
] as const;

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const StakingSection = () => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const reduceMotion = useReducedMotion();

  const { data: stakingSummary, isPending } = useQuery({
    queryKey: ["syra-staking-summary", "section"],
    queryFn: ({ signal }) =>
      fetchStakingProtocolSummary(SYRA_API_BASE, { signal, network: "mainnet" }),
    refetchInterval: 120_000,
    staleTime: 60_000,
    retry: 2,
  });

  const stats = useMemo(
    () => formatStakingStatsDisplay(stakingSummary),
    [stakingSummary],
  );

  const statItems = useMemo(
    () => [
      {
        label: "Total locked",
        value: isPending ? "…" : stats?.totalLockedCompact ?? "—",
        hint: stats ? "On-chain via Streamflow" : isPending ? "Syncing mainnet…" : "Live soon",
      },
      {
        label: "Active stakers",
        value: isPending
          ? "…"
          : stats
            ? stats.stakerCount.toLocaleString()
            : "—",
        hint: stats ? "Unique wallets" : undefined,
      },
      {
        label: "Open positions",
        value: isPending
          ? "…"
          : stats
            ? stats.openLockCount.toLocaleString()
            : "—",
        hint: "3-month lock term",
      },
    ],
    [isPending, stats],
  );

  return (
    <section
      id="staking"
      ref={ref}
      className="relative overflow-hidden py-24 sm:py-28"
      aria-labelledby="staking-heading"
    >
      <motion.div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.04] to-transparent"
        aria-hidden
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: reduceMotion ? 0.01 : 0.8 }}
      />
      <motion.div
        className="pointer-events-none absolute -left-24 top-1/4 h-[480px] w-[480px] rounded-full bg-foreground/[0.04] blur-[120px]"
        aria-hidden
        animate={
          reduceMotion
            ? undefined
            : {
                scale: [1, 1.06, 1],
                opacity: [0.35, 0.55, 0.35],
              }
        }
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -right-16 bottom-0 h-[420px] w-[420px] rounded-full bg-accent/10 blur-[100px]"
        aria-hidden
        animate={
          reduceMotion
            ? undefined
            : {
                scale: [1, 1.08, 1],
                opacity: [0.25, 0.45, 0.25],
              }
        }
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
      />

      <motion.div
        className="pointer-events-none absolute left-1/2 top-8 h-px w-[min(92%,48rem)] -translate-x-1/2 bg-gradient-to-r from-transparent via-border to-transparent"
        aria-hidden
        initial={{ scaleX: 0, opacity: 0 }}
        animate={isInView ? { scaleX: 1, opacity: 1 } : {}}
        transition={{ duration: reduceMotion ? 0.01 : 0.9, ease }}
      />

      <motion.div
        className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        initial="hidden"
        animate={isInView ? "show" : "hidden"}
        variants={{
          hidden: {},
          show: {
            transition: reduceMotion
              ? { staggerChildren: 0 }
              : { staggerChildren: 0.08, delayChildren: 0.05 },
          },
        }}
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } } }} className="mb-14 text-center md:mb-16">
          <span className="section-eyebrow-gradient mb-4 inline-flex items-center gap-2 text-sm font-medium uppercase tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/40 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success/90" />
            </span>
            Staking
          </span>

          <h2
            id="staking-heading"
            className="mb-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
          >
            Lock <span className="gold-text">$SYRA</span>. Unlock the stack.
          </h2>

          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Stake on Syra with Streamflow token locks on Solana—non-custodial, transparent,
            and built for holders who want premium access across the agent economy.
          </p>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease } } }}
          className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-8"
        >
          {/* Primary panel — stats + CTA */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } } }}
            className="glass-card relative overflow-hidden rounded-3xl border border-foreground/10 p-6 sm:p-8 lg:p-10"
          >
            <motion.div
              className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-foreground/[0.06] blur-3xl"
              aria-hidden
              animate={reduceMotion ? undefined : { rotate: [0, 12, 0] }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            />

            <motion.div
              className="relative mb-8 inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-sm"
              variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0, transition: { delay: 0.15, duration: 0.4, ease } } }}
            >
              <Lock className="h-3.5 w-3.5 text-foreground/80" aria-hidden />
              <span>
                Powered by{" "}
                <span className="font-medium text-foreground">Streamflow</span>
                {" · "}
                Mainnet · 3-month lock
              </span>
            </motion.div>

            <div className="relative grid gap-6 sm:grid-cols-3 sm:gap-4">
              {statItems.map((item, index) => (
                <motion.div
                  key={item.label}
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    show: {
                      opacity: 1,
                      y: 0,
                      transition: { delay: 0.2 + index * 0.06, duration: 0.45, ease },
                    },
                  }}
                  className={cn(
                    "rounded-2xl border border-border/60 bg-background/40 px-4 py-5 text-center sm:text-left",
                    index === 0 && "sm:col-span-3 lg:col-span-1",
                  )}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-2 font-mono text-3xl font-semibold tabular-nums tracking-tight text-foreground sm:text-4xl">
                    {item.value}
                  </p>
                  {item.hint ? (
                    <p className="mt-1.5 text-xs text-muted-foreground/90">{item.hint}</p>
                  ) : null}
                </motion.div>
              ))}
            </div>

            <motion.div
              className="relative mt-8 flex flex-col gap-4 border-t border-border/50 pt-8 sm:flex-row sm:items-center sm:justify-between"
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { delay: 0.35, duration: 0.45, ease } } }}
            >
              <motion.div className="max-w-md space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Open the staking app
                </p>
                <p className="text-sm text-muted-foreground">
                  Connect your wallet, choose an amount, and create a lock in one flow—
                  separate from the legacy Anchor pool.
                </p>
              </motion.div>
              <a
                href={LINK_STAKING}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary group inline-flex min-h-[52px] shrink-0 items-center justify-center gap-2 px-8 py-3.5 text-sm sm:min-w-[220px]"
              >
                Stake at stake.syraa.fun
                <ArrowUpRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden
                />
              </a>
            </motion.div>
          </motion.div>

          {/* Right column — benefits + product preview */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.06, ease } } }}
            className="flex min-h-0 flex-col gap-4"
          >
            {benefits.map((benefit, index) => {
              const borderHover =
                index === 0
                  ? "hover:border-accent/35"
                  : index === 1
                    ? "hover:border-neon-gold/35"
                    : "hover:border-success/35";
              const iconBox =
                index === 0
                  ? "bg-accent/10 group-hover:bg-accent/18"
                  : index === 1
                    ? "bg-neon-gold/10 group-hover:bg-neon-gold/18"
                    : "bg-success/10 group-hover:bg-success/18";

              return (
                <motion.article
                  key={benefit.title}
                  variants={{
                    hidden: { opacity: 0, x: 16 },
                    show: {
                      opacity: 1,
                      x: 0,
                      transition: { delay: 0.12 + index * 0.07, duration: 0.5, ease },
                    },
                  }}
                  className={cn(
                    "group glass-card flex flex-1 gap-4 rounded-2xl border border-transparent p-5 transition-all duration-300 sm:p-6",
                    borderHover,
                  )}
                >
                  <motion.div
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors",
                      iconBox,
                    )}
                    whileHover={reduceMotion ? undefined : { scale: 1.04 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  >
                    <benefit.icon className="h-5 w-5 text-primary" strokeWidth={2.1} />
                  </motion.div>
                  <motion.div className="min-w-0">
                    <h3 className="mb-1.5 font-semibold tracking-tight">{benefit.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {benefit.description}
                    </p>
                  </motion.div>
                </motion.article>
              );
            })}

            {/* Abstract product preview */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0, transition: { delay: 0.38, duration: 0.55, ease } },
              }}
              className="glass-card relative mt-auto overflow-hidden rounded-2xl border border-foreground/10 p-5 sm:p-6"
            >
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,hsl(var(--foreground)/0.06),transparent_70%)]"
                aria-hidden
              />
              <motion.div
                className="relative flex items-center justify-between gap-3 border-b border-border/50 pb-4"
                animate={reduceMotion ? undefined : { opacity: [0.85, 1, 0.85] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <motion.div className="flex items-center gap-2">
                  <motion.div
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60 ring-1 ring-border/60"
                    whileHover={reduceMotion ? undefined : { rotate: [0, -6, 6, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <Wallet className="h-4 w-4 text-foreground/80" aria-hidden />
                  </motion.div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      New position
                    </p>
                    <p className="text-sm font-medium text-foreground">Open a lock</p>
                  </div>
                </motion.div>
                <span className="rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Live
                </span>
              </motion.div>
              <motion.div className="relative mt-4 space-y-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs text-muted-foreground">Amount</span>
                  <span className="font-mono text-lg font-semibold tabular-nums text-foreground">
                    10,000 <span className="text-sm font-medium text-muted-foreground">SYRA</span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted/50">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-foreground/25 via-foreground/70 to-foreground/40"
                    initial={{ width: "0%" }}
                    animate={isInView ? { width: "72%" } : { width: "0%" }}
                    transition={{
                      duration: reduceMotion ? 0.01 : 1.2,
                      delay: reduceMotion ? 0 : 0.5,
                      ease,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Unlocks on a fixed 3-month schedule · automatic payout to your wallet
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.p
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { delay: 0.45, duration: 0.4 } } }}
          className="mt-10 text-center text-xs text-muted-foreground/80"
        >
          Staking positions are on-chain Streamflow contracts. Always verify the mint and app URL
          before signing.
        </motion.p>
      </motion.div>
    </section>
  );
};
