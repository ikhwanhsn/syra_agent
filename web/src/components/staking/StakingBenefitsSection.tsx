"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Bot, KeyRound, Sparkles, Timer, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const benefits = [
  {
    icon: Bot,
    title: "Premium agent access",
    description: "Higher API tiers, premium modules, and early tooling as Syra scales.",
    borderHover: "hover:border-primary/40",
    iconShell: "border-primary/25 bg-primary/[0.08] text-primary",
    glow: "from-primary/[0.14] via-primary/[0.04] to-transparent",
  },
  {
    icon: KeyRound,
    title: "Non-custodial",
    description: "Streamflow locks on Solana—you sign every position from your wallet.",
    borderHover: "hover:border-accent/40",
    iconShell: "border-accent/25 bg-accent/[0.08] text-foreground",
    glow: "from-accent/[0.12] via-accent/[0.03] to-transparent",
  },
  {
    icon: Timer,
    title: "Auto vesting",
    description: "Fixed schedule, zero claim loops. Tokens land in your wallet automatically.",
    borderHover: "hover:border-neon-gold/40",
    iconShell: "border-neon-gold/25 bg-neon-gold/[0.08] text-foreground",
    glow: "from-neon-gold/[0.12] via-neon-gold/[0.03] to-transparent",
  },
  {
    icon: TrendingUp,
    title: "Holder priority",
    description: "First access to experiments, perks, and product drops across the stack.",
    borderHover: "hover:border-success/40",
    iconShell: "border-success/25 bg-success/[0.08] text-success",
    glow: "from-success/[0.12] via-success/[0.03] to-transparent",
  },
] as const;

const journeySteps = [
  { icon: KeyRound, label: "Connect & lock", detail: "Pick amount, sign once" },
  { icon: Timer, label: "Vest on-chain", detail: "Fixed Streamflow schedule" },
  { icon: Sparkles, label: "Unlock access", detail: "Perks roll out to holders" },
] as const;

function BenefitCard({
  benefit,
  reduceMotion,
}: {
  benefit: (typeof benefits)[number];
  reduceMotion: boolean | null;
}) {
  return (
    <motion.article
      variants={{
        hidden: { opacity: 0, y: 14 },
        show: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
      }}
      className={cn(
        "glass-card group relative overflow-hidden rounded-2xl border border-foreground/[0.08] p-5 transition-[border-color,box-shadow,transform] duration-500",
        benefit.borderHover,
        "hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-24px_hsl(var(--foreground)/0.16)]",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100",
          benefit.glow,
        )}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/12 to-transparent"
        aria-hidden
      />

      <div className="relative">
        <motion.div
          className={cn(
            "mb-3 flex h-10 w-10 items-center justify-center rounded-xl border shadow-[inset_0_1px_0_0_hsl(var(--foreground)/0.06)]",
            benefit.iconShell,
          )}
          whileHover={reduceMotion ? undefined : { scale: 1.05 }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
        >
          <benefit.icon className="h-[18px] w-[18px]" strokeWidth={1.85} aria-hidden />
        </motion.div>
        <h3 className="text-sm font-semibold tracking-tight text-foreground sm:text-[15px]">
          {benefit.title}
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {benefit.description}
        </p>
      </div>
    </motion.article>
  );
}

export interface StakingBenefitsSectionProps {
  className?: string;
}

export function StakingBenefitsSection({ className }: StakingBenefitsSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const reduceMotion = useReducedMotion();

  return (
    <section
      ref={ref}
      className={cn("relative min-w-0", className)}
      aria-labelledby="staking-benefits-heading"
    >
      <motion.div
        className="relative"
        initial="hidden"
        animate={isInView ? "show" : "hidden"}
        variants={{
          hidden: {},
          show: {
            transition: reduceMotion
              ? { staggerChildren: 0 }
              : { staggerChildren: 0.06, delayChildren: 0.02 },
          },
        }}
      >
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 12 },
            show: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
          }}
          className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p
              id="staking-benefits-heading"
              className="section-eyebrow-gradient text-[11px] font-semibold uppercase tracking-[0.18em] sm:text-xs"
            >
              Why stake
            </p>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              Align with Syra&apos;s agent economy and unlock premium access as the product
              scales.
            </p>
          </div>

          <ol className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 sm:justify-end">
            {journeySteps.map((step, index) => (
              <li key={step.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border/55 bg-background/60 text-[10px] font-bold text-foreground">
                  {index + 1}
                </span>
                <span className="font-medium text-foreground/90">{step.label}</span>
                {index < journeySteps.length - 1 ? (
                  <span className="hidden text-border sm:inline" aria-hidden>
                    →
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </motion.div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {benefits.map((benefit) => (
            <BenefitCard key={benefit.title} benefit={benefit} reduceMotion={reduceMotion} />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
