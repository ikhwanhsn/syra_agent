import { useId } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SectionEyebrow } from "../primitives";
import { Banknote, Coins, Landmark, Vault } from "lucide-react";
import { UP_ONLY_FUND } from "@/data/upOnlyFund";
import { LANDING_EASE } from "@/components/landing/landingMotion";

type TreasurySourceSectionProps = { className?: string };

type SourceCardProps = {
  icon: typeof Landmark;
  title: string;
  subtitle: string;
  accent?: "neutral" | "uof";
};

function SourceCard({ icon: Icon, title, subtitle, accent = "neutral" }: SourceCardProps) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-xl border px-3 py-3.5 shadow-sm sm:px-4 sm:py-4",
        accent === "uof"
          ? "border-uof/30 bg-uof/[0.08]"
          : "border-border/50 bg-card/55",
      )}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-background/60",
            accent === "uof" ? "border-uof/25 text-uof" : "border-border/50 text-foreground/75",
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[0.6875rem] font-semibold leading-tight text-foreground sm:text-xs">{title}</p>
          <p className="mt-1 text-[0.625rem] leading-snug text-muted-foreground sm:text-[0.6875rem]">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function FlowConnectors({ reduceMotion }: { reduceMotion: boolean }) {
  const uid = useId().replace(/:/g, "");
  const leftGrad = `uofCapLeft-${uid}`;
  const rightGrad = `uofCapRight-${uid}`;

  const leftPath = "M 52 2 C 52 18, 78 34, 100 46";
  const rightPath = "M 148 2 C 148 18, 122 34, 100 46";

  return (
    <div className="relative mx-auto h-11 w-full max-w-[88%] sm:h-12" aria-hidden>
      <svg
        className="h-full w-full overflow-visible"
        viewBox="0 0 200 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id={leftGrad} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.35" />
            <stop offset="100%" stopColor="hsl(var(--uof))" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id={rightGrad} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.35" />
            <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity="0.85" />
          </linearGradient>
        </defs>

        <motion.path
          d={leftPath}
          stroke={`url(#${leftGrad})`}
          strokeWidth="2.25"
          strokeLinecap="round"
          fill="none"
          initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
          animate={reduceMotion ? undefined : { pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.85, delay: 0.15, ease: LANDING_EASE }}
        />
        <motion.path
          d={rightPath}
          stroke={`url(#${rightGrad})`}
          strokeWidth="2.25"
          strokeLinecap="round"
          fill="none"
          initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
          animate={reduceMotion ? undefined : { pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.85, delay: 0.28, ease: LANDING_EASE }}
        />

        <motion.circle
          cx="52"
          cy="2"
          r="3"
          fill="hsl(var(--foreground))"
          fillOpacity={0.45}
          initial={reduceMotion ? false : { opacity: 0, scale: 0 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.1, ease: LANDING_EASE }}
        />
        <motion.circle
          cx="148"
          cy="2"
          r="3"
          fill="hsl(var(--uof))"
          fillOpacity={0.85}
          initial={reduceMotion ? false : { opacity: 0, scale: 0 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.18, ease: LANDING_EASE }}
        />
        <motion.circle
          cx="100"
          cy="46"
          r="3.5"
          fill="hsl(var(--success))"
          initial={reduceMotion ? false : { opacity: 0, scale: 0 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.45, ease: LANDING_EASE }}
        />
      </svg>
    </div>
  );
}

function TreasuryCapIllustration({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <div
      className={cn("relative mx-auto w-full max-w-[22rem] sm:max-w-none", className)}
      role="img"
      aria-label="Illustration: program treasury allocation and Up Only fee flow into the fund wallet."
    >
      <div className="flex flex-col">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05, ease: LANDING_EASE }}
          >
            <SourceCard
              icon={Landmark}
              title="Program treasury"
              subtitle="Seed allocation"
              accent="neutral"
            />
          </motion.div>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12, ease: LANDING_EASE }}
          >
            <SourceCard
              icon={Coins}
              title="$UPONLY fee path"
              subtitle="Program-allocated share"
              accent="uof"
            />
          </motion.div>
        </div>

        <FlowConnectors reduceMotion={reduceMotion ?? false} />

        <motion.div
          className="mx-auto w-full max-w-[16.5rem] sm:max-w-[18rem]"
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.28, ease: LANDING_EASE }}
        >
          <div className="rounded-xl border border-success/35 bg-gradient-to-b from-success/[0.14] via-card/50 to-card/30 px-4 py-4 text-center shadow-[0_0_0_1px_hsl(var(--foreground)/0.04)_inset] sm:px-5 sm:py-4.5">
            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-success/30 bg-success/[0.12] text-success">
              <Vault className="h-4 w-4" aria-hidden />
            </span>
            <p className="mt-3 font-mono text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-foreground/92 sm:text-[0.6875rem]">
              Up Only Fund · Treasury
            </p>
            <span className="mt-2 inline-flex rounded-md border border-border/50 bg-background/50 px-2.5 py-1 text-[0.58rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {UP_ONLY_FUND.treasuryAddress ? "Address published" : "TBA on publication"}
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export function TreasurySourceSection({ className }: TreasurySourceSectionProps) {
  return (
    <section
      className={cn("mb-20 min-w-0", className)}
      id="treasury"
      aria-labelledby="uof-treasury-heading"
    >
      <div className="grid min-w-0 items-center gap-10 lg:grid-cols-[1fr_1.02fr] lg:gap-12 xl:gap-16">
        <div className="min-w-0">
          <SectionEyebrow>How it&apos;s capitalized</SectionEyebrow>
          <h2
            id="uof-treasury-heading"
            className="landing-section-title max-w-4xl text-balance break-words"
          >
            Treasury + RISE tranche policy
          </h2>
          <p className="mt-4 break-words text-pretty text-sm text-muted-foreground [overflow-wrap:anywhere] sm:text-base sm:leading-relaxed">
            {UP_ONLY_FUND.name} is <strong className="font-medium text-foreground/90">not</strong> open to public deposits in
            v1. Capitalization comes from program treasury allocation and the portion of program economics that accrues to
            the operator under the Up Only fee policy (see{" "}
            <Link to="/uponly/overview#on-chain-details" className="font-medium text-foreground/90 underline-offset-2 hover:underline">
              $UPONLY on-chain + fees
            </Link>
            ). Exact timing and on-chain address will be published on this page.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-muted-foreground [overflow-wrap:anywhere] sm:text-base sm:leading-relaxed">
            <li className="flex gap-3">
              <Banknote className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden />
              <span>
                <strong className="font-medium text-foreground/90">Treasury seed</strong> — capital set aside to deploy
                across the RISE ecosystem with published mandate and (later) position transparency.
              </span>
            </li>
            <li className="flex gap-3">
              <Coins className="mt-0.5 h-5 w-5 shrink-0 text-foreground/70" aria-hidden />
              <span>
                <strong className="font-medium text-foreground/90">$UPONLY-aligned flow</strong> — fee routing under the 50% /
                50% liquidity program supports the same “Up Only” thesis; fund accounting will be published when
                operational.
              </span>
            </li>
          </ul>
        </div>

        <div className="landing-institutional-panel relative min-w-0 overflow-hidden p-5 sm:p-7 lg:p-8">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,hsl(var(--success)/0.1),transparent_65%)]"
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-0 grid-pattern opacity-[0.1] dark:opacity-[0.16]" aria-hidden />
          <TreasuryCapIllustration className="relative z-[1]" />
          <p className="relative z-[1] mt-5 text-center text-[0.62rem] font-medium uppercase leading-snug tracking-[0.14em] text-muted-foreground/90 sm:text-[0.6875rem] sm:tracking-[0.18em]">
            Capital flows are published when the treasury goes live — no public LP in v1.
          </p>
        </div>
      </div>
    </section>
  );
}
