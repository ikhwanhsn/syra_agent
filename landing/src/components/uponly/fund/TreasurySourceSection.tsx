import { useId } from "react";
import { useReducedMotion, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { fadeUp, SectionEyebrow } from "../primitives";
import { Banknote, Coins } from "lucide-react";
import { UP_ONLY_FUND } from "@/data/upOnlyFund";

type TreasurySourceSectionProps = { className?: string };

function TreasuryCapIllustration({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const gTreasury = `uofTreasury-${uid}`;
  const gUp = `uofUp-alloc-${uid}`;

  return (
    <div
      className={cn("relative w-full max-w-md select-none sm:max-w-lg", className)}
      role="img"
      aria-label="Illustration: Syra treasury allocation and Up Only fee flow into the fund wallet."
    >
      <svg
        viewBox="0 0 400 200"
        preserveAspectRatio="xMidYMid meet"
        className="h-auto w-full max-h-56 sm:max-h-64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <linearGradient id={gTreasury} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--ring))" stopOpacity="0.45" />
            <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id={gUp} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(var(--ring))" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <rect x="40" y="24" width="140" height="72" rx="14" className="stroke-border/50" strokeWidth="1" fill={`url(#${gTreasury})`} />
        <text x="110" y="52" textAnchor="middle" className="fill-foreground/85" style={{ fontSize: "9px", fontWeight: 700 }}>
          Syra treasury
        </text>
        <text x="110" y="68" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: "6.5px" }}>
          Seed allocation
        </text>
        <rect x="220" y="24" width="140" height="72" rx="14" className="stroke-border/50" strokeWidth="1" fill={`url(#${gUp})`} />
        <text x="290" y="52" textAnchor="middle" className="fill-foreground/85" style={{ fontSize: "9px", fontWeight: 700 }}>
          $UPONLY fee path
        </text>
        <text x="290" y="68" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: "6.5px" }}>
          Syra-allocated share
        </text>
        <path
          d="M 180 100 L 200 120 L 200 128 L 125 150 M 200 120 L 200 128 L 290 150"
          className="stroke-border/65"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
        />
        <rect x="95" y="160" width="210" height="32" rx="10" className="fill-card/80 stroke-border/50" strokeWidth="1" />
        <text x="200" y="180" textAnchor="middle" className="fill-foreground/80" style={{ fontSize: "8px", fontWeight: 600, letterSpacing: "0.12em" }}>
          UP ONLY FUND · TREASURY (TBA)
        </text>
      </svg>
    </div>
  );
}

export function TreasurySourceSection({ className }: TreasurySourceSectionProps) {
  const reduce = useReducedMotion() ?? false;
  return (
    <motion.section
      {...fadeUp(reduce)}
      className={cn("mb-20 min-w-0", className)}
      id="treasury"
      aria-labelledby="uof-treasury-heading"
    >
      <div className="grid min-w-0 items-start gap-10 lg:grid-cols-[1fr_1.05fr]">
        <div>
          <SectionEyebrow>How it&apos;s capitalized</SectionEyebrow>
          <h2
            id="uof-treasury-heading"
            className="text-balance break-words text-xl font-bold tracking-[-0.02em] min-[500px]:text-2xl sm:text-3xl md:text-4xl"
          >
            Syra-backed — treasury + RISE tranche policy
          </h2>
          <p className="mt-4 break-words text-pretty text-sm text-muted-foreground [overflow-wrap:anywhere] sm:text-base sm:leading-relaxed">
            {UP_ONLY_FUND.name} is <strong className="font-medium text-foreground/90">not</strong> open to public deposits in
            v1. Capitalization comes from Syra treasury allocation and the portion of program economics that accrues to Syra
            under the Up Only fee policy             (see{" "}
            <Link to="/uponly#on-chain-details" className="font-medium text-foreground/90 underline-offset-2 hover:underline">
              $UPONLY on-chain + fees
            </Link>
            ). Exact timing and on-chain address will be published on this page.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-muted-foreground [overflow-wrap:anywhere] sm:text-base sm:leading-relaxed">
            <li className="flex gap-3">
              <Banknote className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden />
              <span>
                <strong className="font-medium text-foreground/90">Treasury seed</strong> — Syra sets aside capital to deploy
                across the RISE ecosystem with published mandate and (later) position transparency.
              </span>
            </li>
            <li className="flex gap-3">
              <Coins className="mt-0.5 h-5 w-5 shrink-0 text-foreground/70" aria-hidden />
              <span>
                <strong className="font-medium text-foreground/90">$UPONLY-aligned flow</strong> — fee routing that reaches Syra
                under the 50% / 50% liquidity program supports the same “Up Only” thesis; fund accounting will be published when
                operational.
              </span>
            </li>
          </ul>
        </div>
        <div
          className="relative flex min-w-0 flex-col overflow-hidden rounded-3xl border border-success/25 bg-gradient-to-b from-card/60 via-card/35 to-success/[0.08] p-5 shadow-[0_0_0_1px_hsl(0_0%_100%/0.04)_inset,0_20px_56px_-12px_hsl(0_0%_0%/0.2)] backdrop-blur-md sm:p-7"
        >
          <div className="h-px w-full bg-gradient-to-r from-success/20 via-success/5 to-transparent opacity-80" />
          <div
            className="absolute -right-10 -top-10 h-48 w-48 rounded-full border border-success/10 bg-success/[0.1] blur-2xl"
            aria-hidden
          />
          <TreasuryCapIllustration className="mt-2 w-full" />
          <p className="mt-4 text-center text-[0.65rem] font-medium uppercase leading-snug tracking-[0.12em] text-muted-foreground/90 sm:tracking-[0.18em] sm:text-xs">
            Treasury address:{" "}
            <span className="text-foreground/80">
              {UP_ONLY_FUND.treasuryAddress ? "published below when live" : "TBA on publication"}
            </span>
          </p>
        </div>
      </div>
    </motion.section>
  );
}
