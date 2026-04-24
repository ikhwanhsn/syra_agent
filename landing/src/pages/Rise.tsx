import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  Coins,
  Copy,
  Droplets,
  FlaskConical,
  MessageCircle,
  RefreshCw,
  Shield,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Vault,
  Wallet,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SYRA_TOKEN_MINT, syraSolscanTokenUrl } from "@/data/agentIdentity";
import { RISE_UP_ONLY, getRiseRichTradeUrl, riseUpOnlyHasAnyMarketStats } from "@/data/riseUpOnly";
import { formatInt, formatPct, formatUsd } from "@/lib/marketDisplayFormat";
import syraMark from "/images/logo.jpg";

/** RISE mark — same file as partners (`rise.jpg`); add `rise.png` later if you standardize. */
const RISE_PARTNER_LOGO = "/images/partners/rise.jpg";
const RISE_LOGO_PLACEHOLDER = "/images/partners/placeholder.svg";

const RISE = {
  intro: "https://docs.rise.rich/introduction",
  floor: "https://docs.rise.rich/protocol/floor-mechanism",
  createToken: "https://docs.rise.rich/guides/create-token",
  borrow: "https://docs.rise.rich/guides/borrow",
  borrowsAndLoops: "https://docs.rise.rich/protocol/borrows-and-loops",
  x: "https://x.com/risedotrich",
  telegram: "https://t.me/rise_dot_rich",
} as const;

/** Public path — `public/images/experiment/rise_uponly.png` (also used as mark until a dedicated `uponly-logo` asset exists) */
const UP_ONLY_HERO_ART = "/images/experiment/rise_uponly.png";
const HERO_IMAGE_ALT =
  "Up Only — official Syra and RISE on-chain experiment key art, Syra by RISE";
/** Swap to e.g. `/images/experiment/uponly-logo.png` if you add a dedicated square mark asset. */
const UP_ONLY_LOGO_MARK = "/images/experiment/rise_uponly.png";
const UP_ONLY_LOGO_ALT = "Up Only — experiment logo mark";

const fadeUp = (reduce: boolean) =>
  reduce
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
      };

const stagger = (reduce: boolean) =>
  reduce
    ? {}
    : {
        initial: "hidden" as const,
        whileInView: "show" as const,
        viewport: { once: true, margin: "-60px" },
        variants: {
          hidden: {},
          show: {
            transition: { staggerChildren: 0.08 },
          },
        },
      };

const itemFade = (reduce: boolean) =>
  reduce
    ? {}
    : {
        variants: {
          hidden: { opacity: 0, y: 16 },
          show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
        },
      };

function SyraRiseLockup({ className }: { className?: string }) {
  return (
    <div className={cn("w-full min-w-0", className)}>
      <div className="relative mx-auto w-full min-w-0 max-w-md sm:max-w-none sm:mx-0">
        <div
          className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-success/[0.12] via-ring/10 to-success/[0.08] opacity-80 blur-2xl dark:from-success/[0.08] sm:-inset-4"
          aria-hidden
        />
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-card/70 to-card/30 p-1 shadow-[0_0_0_1px_hsl(0_0%_100%/0.05)_inset,0_16px_40px_-12px_hsl(0_0%_0%/0.35)] backdrop-blur-sm dark:from-card/50 dark:to-background/20">
          {/* Stacked on narrow viewports; horizontal from sm+ */}
          <div className="grid grid-cols-1 place-items-stretch gap-2 px-2.5 py-3.5 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-3 sm:px-5 sm:py-4 sm:place-items-stretch">
            <div
              className="flex h-auto min-h-[3.25rem] w-full min-w-0 items-center justify-center rounded-xl border border-border/50 bg-gradient-to-b from-background/80 to-background/30 px-2.5 py-2.5 shadow-inner sm:h-16 sm:px-3"
              title="Syra"
            >
              <img
                src={syraMark}
                alt="Syra"
                width={160}
                height={160}
                className="h-11 w-11 shrink-0 object-contain object-center sm:h-14 sm:w-14"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            </div>
            <div
              className="mx-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/50 bg-background/50 font-serif text-base font-light text-foreground/75 shadow-sm sm:mx-0 sm:h-9 sm:w-9 sm:text-xl"
              aria-hidden
            >
              ×
            </div>
            <div
              className="flex h-auto min-h-[3.25rem] w-full min-w-0 items-center justify-center rounded-xl border border-border/50 bg-gradient-to-b from-background/80 to-background/30 px-2 py-2.5 shadow-inner sm:h-16"
              title="RISE"
            >
              <img
                src={RISE_PARTNER_LOGO}
                alt="RISE"
                width={160}
                height={160}
                className="h-auto max-h-9 w-full max-w-[8.5rem] object-contain sm:max-h-12 sm:max-w-[min(100%,9rem)]"
                loading="eager"
                decoding="async"
                onError={(e) => {
                  const el = e.currentTarget;
                  if (el.src.endsWith(RISE_LOGO_PLACEHOLDER)) return;
                  el.src = RISE_LOGO_PLACEHOLDER;
                }}
              />
            </div>
          </div>
          <div className="border-t border-border/40 bg-gradient-to-b from-foreground/[0.02] to-transparent px-3 py-2.5 sm:px-5">
            <p className="text-balance text-center text-[0.65rem] font-medium uppercase leading-snug tracking-[0.12em] text-muted-foreground/90 sm:tracking-[0.2em] min-[400px]:text-xs">
              On-chain experiment · <span className="text-foreground/85">Syra</span> × <span className="text-foreground/85">RISE</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Decorative diagram: Syra-allocated fees → 50% $SYRA / 50% $UPONLY liquidity (RISE experiment).
 * SVG uses theme tokens so it works in light and dark mode.
 */
function FeeAllocationIllustration({ className }: { className?: string }) {
  return (
    <div
      className={cn("relative w-full select-none", className)}
      role="img"
      aria-label="Illustration: fees split equally into $SYRA and $UPONLY liquidity pools for the RISE Up Only experiment."
    >
      <svg
        viewBox="0 0 400 200"
        preserveAspectRatio="xMidYMid meet"
        className="h-auto w-full max-h-[15rem] sm:max-h-[18rem] lg:max-h-72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <linearGradient id="uponlyFeePoolSyra" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--ring))" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id="uponlyFeePoolUp" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity="0.45" />
            <stop offset="100%" stopColor="hsl(var(--ring))" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Inflow: fees */}
        <rect
          x="150"
          y="10"
          width="100"
          height="24"
          rx="12"
          className="fill-card/70 stroke-border/55"
          strokeWidth="1"
        />
        <circle cx="170" cy="22" r="3" className="fill-foreground/35" />
        <circle cx="200" cy="22" r="3" className="fill-foreground/45" />
        <circle cx="230" cy="22" r="3" className="fill-foreground/35" />
        <text
          x="200"
          y="26"
          textAnchor="middle"
          className="fill-foreground/55"
          style={{ fontSize: "7px", fontWeight: 600, letterSpacing: "0.08em" }}
        >
          FEE INFLOW
        </text>

        {/* Down pipe */}
        <path
          d="M 200 34 L 200 60"
          className="stroke-border/70"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="200" cy="64" r="3" className="fill-success/55" />

        {/* Split to pools */}
        <path
          d="M 200 67 L 200 78 M 200 78 L 105 100 M 200 78 L 295 100"
          className="stroke-border/60"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Left pool — $SYRA */}
        <rect
          x="32"
          y="104"
          width="146"
          height="80"
          rx="14"
          className="stroke-border/50"
          strokeWidth="1"
          fill="url(#uponlyFeePoolSyra)"
        />
        <text x="105" y="128" textAnchor="middle" className="fill-foreground/80" style={{ fontSize: "9px", fontWeight: 700 }}>
          50% · $SYRA
        </text>
        <text x="105" y="144" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: "6.5px" }}>
          Liquidity
        </text>
        <ellipse cx="80" cy="170" rx="20" ry="6" className="fill-foreground/10" />
        <ellipse cx="130" cy="170" rx="20" ry="6" className="fill-foreground/10" />
        <path
          d="M 90 150 Q 105 160 120 150"
          className="stroke-ring/40"
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
        />

        {/* Right pool — $UPONLY / RISE */}
        <rect
          x="222"
          y="104"
          width="146"
          height="80"
          rx="14"
          className="stroke-border/50"
          strokeWidth="1"
          fill="url(#uponlyFeePoolUp)"
        />
        <text x="295" y="128" textAnchor="middle" className="fill-foreground/80" style={{ fontSize: "9px", fontWeight: 700 }}>
          50% · $UPONLY
        </text>
        <text x="295" y="144" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: "6.5px" }}>
          RISE tranche
        </text>
        <ellipse cx="255" cy="170" rx="20" ry="6" className="fill-success/12" />
        <ellipse cx="330" cy="170" rx="20" ry="6" className="fill-success/10" />
        <path
          d="M 280 150 Q 295 162 315 150"
          className="stroke-success/35"
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
        />

        {/* RISE / Syra×RISE label */}
        <text
          x="200"
          y="197"
          textAnchor="middle"
          className="fill-muted-foreground/75"
          style={{ fontSize: "6.5px", fontWeight: 500, letterSpacing: "0.12em" }}
        >
          SYRA × RISE · UP ONLY
        </text>
      </svg>
    </div>
  );
}

function HeroArtwork({ reduceMotion, belowFold = true }: { reduceMotion: boolean; belowFold?: boolean }) {
  return (
    <motion.figure
      className="relative z-0 mx-auto w-full max-w-xl lg:max-w-none"
      {...(reduceMotion
        ? {}
        : {
            initial: { opacity: 0, y: 20, scale: 0.985 },
            animate: { opacity: 1, y: 0, scale: 1 },
            transition: { duration: 0.75, delay: 0.1, ease: [0.22, 1, 0.36, 1] as const },
          })}
    >
      <div
        className="absolute -inset-2 rounded-[1.4rem] bg-gradient-to-tr from-success/[0.12] via-ring/10 to-foreground/5 opacity-90 blur-2xl dark:from-success/[0.1]"
        aria-hidden
      />
      <div className="relative overflow-hidden rounded-2xl border border-border/55 bg-gradient-to-b from-card/30 to-background/20 shadow-[0_1px_0_0_hsl(0_0%_100%/0.04)_inset,0_28px_100px_-24px_hsl(0_0%_0%/0.5)] dark:shadow-[0_1px_0_0_hsl(0_0%_100%/0.04)_inset,0_36px_100px_-28px_hsl(0_0%_0%/0.65)]">
        <div className="bg-muted/10 p-1 sm:p-1.5">
          <div className="overflow-hidden rounded-[0.6rem] bg-gradient-to-b from-foreground/[0.03] to-transparent sm:rounded-xl">
            <img
              src={UP_ONLY_HERO_ART}
              alt={HERO_IMAGE_ALT}
              width={1200}
              height={1200}
              decoding="async"
              loading={belowFold ? "lazy" : "eager"}
              fetchPriority={belowFold ? "low" : "high"}
              className="h-auto w-full object-contain object-center"
            />
          </div>
        </div>
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-foreground/[0.06] dark:ring-white/[0.06]"
          aria-hidden
        />
      </div>
      <figcaption className="mt-3 text-center text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground/75 sm:mt-4 sm:text-xs">
        Up Only key art — Syra × RISE
      </figcaption>
    </motion.figure>
  );
}

function SectionEyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "text-[0.7rem] font-medium uppercase tracking-[0.2em] text-muted-foreground/80 sm:text-xs",
        className,
      )}
    >
      {children}
    </p>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative flex min-w-0 flex-col rounded-2xl border border-border/70 bg-card/50 p-4 shadow-sm sm:p-6",
        "backdrop-blur-sm transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-border hover:bg-card/70 hover:shadow-md",
        className,
      )}
    >
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-border/50 bg-gradient-to-b from-background/60 to-background/20 text-foreground/85 shadow-inner transition-colors group-hover:border-ring/25 group-hover:text-foreground">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

function ExternalLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 font-medium text-foreground underline-offset-4 transition-colors hover:underline",
        className,
      )}
    >
      {children}
      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
    </a>
  );
}

function UpOnlyLogoMark({
  className,
  imageUrl,
  alt,
}: {
  className?: string;
  imageUrl?: string | null;
  alt?: string;
}) {
  const src = imageUrl && imageUrl.length > 0 ? imageUrl : UP_ONLY_LOGO_MARK;
  const imageAlt = alt && alt.length > 0 ? alt : UP_ONLY_LOGO_ALT;
  return (
    <div
      className={cn(
        "group/logo relative h-[4.5rem] w-[4.5rem] shrink-0 sm:h-[5.25rem] sm:w-[5.25rem]",
        className,
      )}
    >
      <div
        className="absolute -inset-1.5 rounded-[1.1rem] bg-gradient-to-br from-success/15 via-ring/20 to-foreground/5 opacity-80 blur-md transition-opacity group-hover/logo:opacity-100 dark:from-success/20"
        aria-hidden
      />
      <div
        className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-card/90 to-card/30 shadow-[0_1px_0_0_hsl(0_0%_100%/0.05)_inset,0_12px_32px_-8px_hsl(0_0%_0%/0.4)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_0%,hsl(0_0%_100%/0.04),transparent_60%)]" />
        <img
          src={src}
          alt={imageAlt}
          width={200}
          height={200}
          className="relative z-[1] h-[78%] w-[78%] object-contain object-center"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-foreground/[0.07] dark:ring-white/[0.08]"
          aria-hidden
        />
      </div>
    </div>
  );
}

function TokenDetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="group/row flex flex-col gap-1.5 border-b border-border/40 py-3.5 transition-colors first:pt-0 last:border-0 last:pb-0 sm:flex-row sm:items-baseline sm:gap-5 sm:py-4 sm:first:pt-0">
      <dt className="shrink-0 text-[0.7rem] font-medium uppercase tracking-[0.12em] text-muted-foreground sm:w-[7.5rem] sm:pt-px sm:text-xs sm:tracking-wider">
        {label}
      </dt>
      <dd className="min-w-0 max-w-full break-words text-sm font-medium leading-relaxed text-foreground/95 [&_.text-muted-foreground]:font-normal">
        {children}
      </dd>
    </div>
  );
}

function MintOrTba({ mint, emptyLabel }: { mint: string | null; emptyLabel: string }) {
  const [copied, setCopied] = useState(false);

  if (!mint) {
    return (
      <span className="text-sm italic leading-relaxed text-muted-foreground/95">{emptyLabel}</span>
    );
  }

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(mint);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <code className="w-full min-w-0 break-all rounded-lg border border-border/50 bg-background/50 px-2.5 py-2 font-mono text-[0.65rem] leading-snug text-foreground/90 shadow-sm sm:px-3 sm:text-xs">
        {mint}
      </code>
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={syraSolscanTokenUrl(mint)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-foreground/90 underline-offset-2 hover:underline"
        >
          View on Solscan
          <ArrowUpRight className="h-3 w-3" />
        </a>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          onClick={onCopy}
        >
          <Copy className="h-3 w-3" />
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}

function OnChainAddress({
  value,
  kind = "account",
  emptyLabel = "—",
}: {
  value: string | null;
  kind?: "account" | "token";
  emptyLabel?: string;
}) {
  const [copied, setCopied] = useState(false);
  if (!value) {
    return <span className="text-sm italic text-muted-foreground/95">{emptyLabel}</span>;
  }
  const solscan = kind === "token" ? syraSolscanTokenUrl(value) : `https://solscan.io/account/${value}`;
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };
  return (
    <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <code className="w-full min-w-0 break-all rounded-lg border border-border/50 bg-background/50 px-2.5 py-2 font-mono text-[0.65rem] leading-snug text-foreground/90 shadow-sm sm:px-3 sm:text-xs">
        {value}
      </code>
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={solscan}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-foreground/90 underline-offset-2 hover:underline"
        >
          View on Solscan
          <ArrowUpRight className="h-3 w-3" />
        </a>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          onClick={onCopy}
        >
          <Copy className="h-3 w-3" />
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/30 px-3 py-2.5 shadow-sm sm:px-3.5">
      <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 break-words font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

function RiseBuyTokenCta({ className }: { className?: string }) {
  const v = RISE_UP_ONLY;
  const riseTradeUrl = getRiseRichTradeUrl(v);
  const buyOnRiseActive = v.buyOnRiseEnabled && riseTradeUrl !== null;

  return (
    <div
      className={cn(
        "flex w-full flex-col items-stretch sm:max-w-sm sm:self-start",
        "lg:w-auto lg:shrink-0 lg:max-w-none lg:items-end",
        className,
      )}
    >
      {buyOnRiseActive && riseTradeUrl ? (
        <Button asChild size="default" className="w-full min-h-11 gap-2 sm:w-auto">
          <a href={riseTradeUrl} target="_blank" rel="noopener noreferrer">
            <ShoppingCart className="h-4 w-4 shrink-0" />
            Buy token
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-80" />
          </a>
        </Button>
      ) : (
        <Button
          type="button"
          disabled
          className="w-full min-h-11 gap-2 sm:w-auto"
          title={
            riseTradeUrl
              ? "Set buyOnRiseEnabled to true in src/data/riseUpOnly.ts when the Up Only market is ready on RISE."
              : "Set riseRichTradeId in src/data/riseUpOnly.ts to your rise.rich/trade/… id, then turn on buyOnRiseEnabled when ready."
          }
        >
          <ShoppingCart className="h-4 w-4 shrink-0" />
          Buy token
        </Button>
      )}
    </div>
  );
}

function RiseTokenDetailsCard() {
  const v = RISE_UP_ONLY;
  const hasStats = riseUpOnlyHasAnyMarketStats(v);
  const marketAddr = v.riseMarketAddress?.trim() ?? null;

  return (
    <div className="relative flex min-w-0 flex-col overflow-hidden rounded-3xl border border-border/55 bg-gradient-to-b from-card/80 via-card/50 to-card/30 shadow-[0_0_0_1px_hsl(0_0%_100%/0.04)_inset,0_24px_64px_-16px_hsl(0_0%_0%/0.25)] backdrop-blur-md dark:shadow-[0_0_0_1px_hsl(0_0%_100%/0.03)_inset,0_28px_80px_-20px_hsl(0_0%_0%/0.45)]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-foreground/10 to-transparent opacity-60 dark:via-white/12" />
      <div className="border-b border-border/40 bg-gradient-to-b from-muted/[0.12] to-transparent px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex w-full min-w-0 flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6 sm:text-left">
          <UpOnlyLogoMark imageUrl={v.imageUrl} alt={v.name} />
          <div className="w-full min-w-0 flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground/90">On-chain</p>
              {marketAddr && marketAddr.length >= 8 ? (
                <Badge variant="secondary" className="font-mono text-[0.65rem] text-muted-foreground">
                  {marketAddr.slice(0, 4)}…{marketAddr.slice(-4)}
                </Badge>
              ) : null}
            </div>
            <h3 className="mt-1.5 break-words text-balance text-lg font-semibold tracking-[-0.02em] text-foreground sm:text-xl">
              {v.name}
              <span className="ml-2 inline font-mono text-sm font-medium text-muted-foreground">${v.symbol}</span>
            </h3>
            <p className="mt-1.5 max-w-lg text-pretty text-sm text-muted-foreground sm:text-sm sm:leading-relaxed">
              Fields below are set in <code className="rounded bg-muted/50 px-1 font-mono text-[0.8em]">src/data/riseUpOnly.ts</code> — add
              the RISE market address, mint, and stats when they are public. No live API call.
            </p>
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-4 px-5 py-4 sm:px-7 sm:py-5">
        {hasStats ? (
          <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2 sm:gap-3">
            <StatPill label="Price" value={formatUsd(v.priceUsd)} />
            <StatPill label="Market cap" value={formatUsd(v.marketCapUsd, { compact: false })} />
            <StatPill label="24h volume" value={formatUsd(v.volume24hUsd, { compact: false })} />
            <StatPill label="Holders" value={formatInt(v.holders)} />
            <StatPill label="Creator fee" value={formatPct(v.creatorFeePct)} />
            <StatPill label="Start price" value={formatUsd(v.startingPriceUsd)} />
          </div>
        ) : null}

        <div className="rounded-2xl border border-border/35 bg-background/25 p-0.5 shadow-inner dark:bg-background/15">
          <dl className="rounded-[0.9rem] border border-border/20 bg-gradient-to-b from-card/40 to-transparent px-4 py-2 sm:px-5 sm:py-1">
            <TokenDetailRow label="Name">{v.name}</TokenDetailRow>
            <TokenDetailRow label="Symbol">
              <span className="inline-flex items-center rounded-md border border-border/50 bg-background/40 px-2 py-0.5 font-mono text-sm tabular-nums text-foreground">
                {v.symbol}
              </span>
            </TokenDetailRow>
            <TokenDetailRow label="RISE market">
              <OnChainAddress value={v.riseMarketAddress} kind="account" />
            </TokenDetailRow>
            <TokenDetailRow label="Mint">
              <p className="mb-2 text-sm text-muted-foreground">
                RISE <strong className="font-medium text-foreground/90">$UPONLY</strong> SPL —{" "}
                <strong className="font-medium text-foreground/90">50%</strong> of Syra-allocated fee
                liquidity.
              </p>
              <OnChainAddress value={v.mint} kind="token" emptyLabel="—" />
            </TokenDetailRow>
            {v.creator ? (
              <TokenDetailRow label="Creator">
                <OnChainAddress value={v.creator} kind="account" emptyLabel="—" />
              </TokenDetailRow>
            ) : null}
            {v.createdAtLabel ? <TokenDetailRow label="Created">{v.createdAtLabel}</TokenDetailRow> : null}
            {v.tokenMetadataUri ? (
              <TokenDetailRow label="Metadata">
                <ExternalLink href={v.tokenMetadataUri} className="text-sm">
                  Open token URI
                </ExternalLink>
              </TokenDetailRow>
            ) : null}
            {v.twitterUrl || v.telegramUrl ? (
              <TokenDetailRow label="Social">
                <div className="flex flex-wrap gap-2">
                  {v.twitterUrl ? (
                    <Button asChild variant="secondary" size="sm" className="h-8 gap-1 rounded-md px-2.5 text-xs">
                      <a href={v.twitterUrl} target="_blank" rel="noopener noreferrer">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        X / Twitter
                      </a>
                    </Button>
                  ) : null}
                  {v.telegramUrl ? (
                    <Button asChild variant="secondary" size="sm" className="h-8 gap-1 rounded-md px-2.5 text-xs">
                      <a href={v.telegramUrl} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-3.5 w-3.5" />
                        Telegram
                      </a>
                    </Button>
                  ) : null}
                </div>
              </TokenDetailRow>
            ) : null}

            <TokenDetailRow label="Network">{v.network}</TokenDetailRow>
            <TokenDetailRow label="Launch venue">
              {v.launchVenue}{" "}
              <span className="text-muted-foreground/95">(bonding + floor per RISE)</span>
            </TokenDetailRow>
            <TokenDetailRow label="Up Only (Syra) mint">
              <MintOrTba
                mint={v.syraExperimentMint}
                emptyLabel="To be published when the RISE market is live — this row is Syra’s experiment mint. Set syraExperimentMint in riseUpOnly.ts when ready."
              />
            </TokenDetailRow>
            <TokenDetailRow label="Canonical $SYRA">
              <p className="text-sm text-muted-foreground">
                Community reference (Pump.fun) — <strong className="font-medium text-foreground/90">50%</strong> of
                Syra-allocated fee liquidity.
              </p>
              <div className="mt-2.5">
                <MintOrTba mint={SYRA_TOKEN_MINT} emptyLabel="Unavailable" />
              </div>
            </TokenDetailRow>
          </dl>
        </div>
      </div>
    </div>
  );
}

export default function Rise() {
  const reduceMotion = useReducedMotion() ?? false;

  useEffect(() => {
    const previous = document.title;
    document.title = "Up Only | Syra × RISE";
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="min-h-dvh w-full overflow-x-hidden bg-background">
      <Navbar />
      <main className="relative z-10 w-full min-w-0 scroll-mt-20 pb-24 pt-24 sm:pt-28">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-success/[0.07] via-background to-background dark:from-success/[0.04]" />
          <div
            className="absolute -top-24 left-1/2 h-[32rem] w-[min(92vw,44rem)] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, hsl(var(--ring) / 0.16), transparent 70%)",
            }}
          />
          <div
            className="absolute right-0 top-48 h-72 w-72 opacity-30 blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, hsl(var(--success) / 0.12), transparent 70%)",
            }}
          />
          <div className="absolute inset-0 grid-pattern opacity-[0.2]" />
        </div>

        <div className="relative mx-auto w-full min-w-0 max-w-7xl px-3.5 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="mb-7 inline-flex min-h-11 w-fit items-center gap-2 rounded-md py-1 pr-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          {/* Token experiment — primary first view: identifiers, mints, fee policy */}
          <motion.header
            {...fadeUp(reduceMotion)}
            className="mb-16 sm:mb-20"
            aria-labelledby="uponly-token-heading"
          >
            <SyraRiseLockup className="mb-6 sm:mb-8" />
            <div className="mb-5 flex flex-wrap items-center gap-2 sm:gap-3">
              <Badge
                variant="secondary"
                className="border border-border/50 bg-background/50 px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.18em] shadow-sm"
              >
                Syra × RISE
              </Badge>
              <Badge
                variant="outline"
                className="border border-success/25 bg-success/[0.07] text-foreground/95 shadow-sm backdrop-blur"
              >
                <FlaskConical className="mr-1.5 h-3 w-3" aria-hidden />
                Official experiment
              </Badge>
            </div>
            <SectionEyebrow>On-chain token experiment</SectionEyebrow>
            <div className="mt-1 flex w-full min-w-0 flex-col gap-4 lg:mt-2 lg:flex-row lg:items-start lg:justify-between lg:gap-8 lg:gap-x-10 xl:gap-12">
              <div className="w-full min-w-0 max-w-4xl flex-1 [word-break:normal]">
                <h1
                  id="uponly-token-heading"
                  className="text-2xl font-bold leading-tight tracking-[-0.02em] [text-wrap:pretty] min-[400px]:text-3xl sm:text-4xl sm:leading-[1.12] md:text-5xl"
                >
                  <span className="neon-text">Up&nbsp;Only</span>{" "}
                  <span className="text-foreground/80">· token &amp; fees</span>
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed [text-wrap:pretty] [word-break:normal] text-muted-foreground sm:mt-3 sm:text-base sm:leading-relaxed">
                  Contract details and Syra fee routing for the RISE launch. Syra-allocated fees are
                  used for <strong className="font-medium text-foreground/90">liquidity</strong>
                  {"\u00A0"}
                  only,&nbsp;split{" "}
                  <strong className="font-medium text-foreground/90 sm:whitespace-nowrap">50% canonical $SYRA</strong>{" "}
                  and <strong className="font-medium text-foreground/90 sm:whitespace-nowrap">50% $UPONLY</strong>.
                </p>
              </div>
              <RiseBuyTokenCta className="w-full sm:max-w-sm lg:ml-2 lg:pt-1 xl:ml-4" />
            </div>

            <div className="mt-7 grid min-w-0 grid-cols-1 gap-5 sm:mt-8 sm:gap-6 lg:mt-9 lg:grid-cols-[1fr_1.02fr] lg:items-stretch">
              <RiseTokenDetailsCard />

              <div className="relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl border border-success/25 bg-gradient-to-b from-card/60 via-card/35 to-success/[0.1] shadow-[0_0_0_1px_hsl(0_0%_100%/0.04)_inset,0_20px_56px_-12px_hsl(0_0%_0%/0.2)] backdrop-blur-md">
                <div className="h-px w-full bg-gradient-to-r from-success/20 via-success/5 to-transparent opacity-80" />
                <div
                  className="absolute -right-10 -top-10 h-48 w-48 rounded-full border border-success/10 bg-success/[0.1] blur-2xl"
                  aria-hidden
                />
                <div
                  className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full border border-foreground/5 bg-foreground/[0.03] blur-2xl dark:border-white/5"
                  aria-hidden
                />
                <div
                  className="absolute right-0 top-0 h-32 w-px bg-gradient-to-b from-success/25 to-transparent"
                  aria-hidden
                />
                <div className="relative flex min-h-0 flex-1 flex-col p-5 sm:p-7 sm:pb-8">
                  <div className="mb-1 inline-flex w-fit items-center gap-2 rounded-full border border-success/30 bg-success/[0.1] px-3 py-1.5 text-[0.7rem] font-medium uppercase tracking-[0.12em] text-foreground shadow-sm backdrop-blur sm:text-xs">
                    <Coins className="h-3.5 w-3.5" aria-hidden />
                    Fee allocation
                  </div>
                  <h3 className="mt-3 text-balance break-words text-base font-semibold leading-snug tracking-[-0.02em] text-foreground sm:text-lg md:text-xl">
                    50% $SYRA · 50% $UPONLY — liquidity
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    <strong className="font-medium text-foreground/95">Syra&apos;s policy for Up Only:</strong>{" "}
                    every cent of <strong>fees that accrue to Syra</strong> in connection with this
                    experiment—after direct pass-throughs to third parties where contractually
                    required—is used for <strong>on-chain liquidity</strong> only, split{" "}
                    <strong>50% to the canonical $SYRA</strong> token and{" "}
                    <strong>50% to the Up Only ($UPONLY) </strong> token. Each half is deployed to
                    provide and deepen pools for that asset (venues and execution as Syra applies
                    across its programs).
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    RISE has its own protocol fee schedule; anything that is not received by Syra is
                    outside this commitment. Mint links for both targets appear in the details card
                    when available.
                  </p>
                  <ul className="mt-5 space-y-2.5 text-sm text-foreground/90 sm:mt-6">
                    <li className="flex gap-3 rounded-2xl border border-border/35 bg-background/25 p-3.5 shadow-sm backdrop-blur-sm">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-gradient-to-b from-card/50 to-card/20 shadow-inner">
                        <Droplets className="h-3.5 w-3.5 text-success" aria-hidden />
                      </span>
                      <span className="min-w-0 leading-relaxed">
                        <strong className="text-foreground">50% — $SYRA liquidity:</strong> half of
                        Syra-allocated fees fund liquidity for the canonical $SYRA community token
                        (Pump.fun reference below).
                      </span>
                    </li>
                    <li className="flex gap-3 rounded-2xl border border-border/35 bg-background/25 p-3.5 shadow-sm backdrop-blur-sm">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-gradient-to-b from-card/50 to-card/20 shadow-inner">
                        <Droplets className="h-3.5 w-3.5 text-success" aria-hidden />
                      </span>
                      <span className="min-w-0 leading-relaxed">
                        <strong className="text-foreground">50% — $UPONLY liquidity:</strong> the
                        other half funds liquidity for the Up Only RISE tranche so the experiment
                        and $UPONLY benefit alongside $SYRA.
                      </span>
                    </li>
                  </ul>

                  <div className="mt-6 flex w-full min-h-0 flex-1 flex-col sm:mt-7">
                    <div className="flex min-h-[10.5rem] w-full flex-1 flex-col items-stretch justify-end overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-b from-background/30 via-background/[0.04] to-success/[0.06] p-2.5 sm:min-h-[12rem] sm:p-3.5">
                      <FeeAllocationIllustration className="w-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.header>

          {/* Program overview: narrative + key art (below the fold) */}
          <motion.section
            {...(reduceMotion
              ? {}
              : { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } })}
            className="mb-20 lg:mb-24"
            aria-labelledby="uponly-overview-heading"
          >
            <div className="relative overflow-hidden rounded-[1.75rem] border border-border/60 bg-gradient-to-br from-card/90 via-card/55 to-muted/20 shadow-[0_0_0_1px_hsl(0_0%_100%/0.04)_inset,0_40px_100px_-40px_hsl(0_0%_0%/0.35)] sm:rounded-3xl dark:from-card/70 dark:via-card/40">
              <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_0%_0%,hsl(var(--ring)/0.12),transparent_55%)]" />
              <div
                className="absolute -right-24 -top-24 h-[22rem] w-[22rem] rounded-full border border-foreground/[0.04] bg-foreground/[0.02] blur-3xl sm:h-[28rem] sm:w-[28rem] dark:border-white/[0.05] dark:bg-white/[0.03]"
                aria-hidden
              />
              <div
                className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full border border-success/10 bg-success/[0.04] blur-3xl dark:bg-success/[0.07]"
                aria-hidden
              />

              <div className="relative grid items-center gap-10 p-6 sm:gap-12 sm:p-10 lg:grid-cols-2 lg:gap-14 lg:p-12 lg:pl-14 lg:pr-10">
                <div className="order-2 flex min-w-0 flex-col justify-center lg:order-1">
                  <SectionEyebrow>Context</SectionEyebrow>
                  <h2
                    id="uponly-overview-heading"
                    className="mt-1 max-w-3xl text-2xl font-bold leading-tight tracking-[-0.02em] text-balance sm:text-3xl md:text-4xl"
                  >
                    <span className="neon-text">Program</span>{" "}
                    <span className="text-foreground/90">overview</span>
                  </h2>
                  <p className="mt-4 max-w-[34rem] text-[0.95rem] leading-[1.65] text-muted-foreground sm:text-base sm:leading-7 text-pretty">
                    A controlled collaboration between{" "}
                    <span className="text-foreground/90">Syra</span> and{" "}
                    <a
                      href={RISE.intro}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-foreground underline-offset-[3px] decoration-foreground/25 transition-colors hover:decoration-foreground/50"
                    >
                      RISE
                    </a>{" "}
                    to stress-test a next-generation launch on Solana. The Syra community token on
                    Pump.fun remains the long-term reference; <strong>Up Only</strong> is the
                    RISE-dedicated tranche to learn the protocol in production.
                  </p>
                  <div className="mt-8 flex w-full min-w-0 flex-col gap-3 min-[400px]:flex-row min-[400px]:flex-wrap min-[400px]:items-center">
                    <Button
                      asChild
                      className="btn-primary min-h-12 w-full min-[400px]:h-12 min-[400px]:w-auto rounded-xl px-6 text-[0.9rem] shadow-lg shadow-black/15 sm:px-7"
                    >
                      <a
                        className="inline-flex items-center justify-center"
                        href={RISE.createToken}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        RISE: create a token
                        <ArrowUpRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      asChild
                      variant="ghost"
                      className="min-h-12 w-full min-[400px]:h-12 min-[400px]:w-auto rounded-xl border border-border/60 bg-background/30 px-6 text-[0.9rem] backdrop-blur-sm hover:bg-background/55 sm:px-7"
                    >
                      <a
                        className="inline-flex items-center justify-center"
                        href={RISE.intro}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Read the introduction
                      </a>
                    </Button>
                  </div>
                </div>

                <div className="order-1 w-full min-w-0 max-lg:pt-1 lg:order-2">
                  <HeroArtwork reduceMotion={reduceMotion} belowFold />
                </div>
              </div>
            </div>
          </motion.section>

          {/* What RISE is — sourced from public docs */}
          <motion.section
            {...(reduceMotion
              ? {}
              : { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } })}
            className="mb-20"
          >
            <div className="mb-10 max-w-3xl">
              <SectionEyebrow>Why this protocol</SectionEyebrow>
              <h2 className="mt-2 text-2xl font-bold tracking-[-0.02em] sm:text-3xl md:text-4xl">
                Why <span className="neon-text">RISE</span> for this test
              </h2>
              <p className="mt-4 text-muted-foreground sm:text-lg sm:leading-relaxed">
                RISE is described as a permissionless token launch platform on Solana with a unique
                bonding curve, a protocol-enforced floor price, and in-house borrowing with no
                liquidation risk and no ongoing interest. The{" "}
                <ExternalLink href={RISE.intro} className="text-foreground/90">
                  RISE documentation
                </ExternalLink>{" "}
                positions the protocol as the single counterparty for swaps, borrows, and
                repayments—an architecture the team credits for the floor, borrow markets, and
                looping mechanics.
              </p>
            </div>

            <motion.div
              {...stagger(reduceMotion)}
              className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4"
            >
              <motion.div {...itemFade(reduceMotion)} className="h-full">
                <FeatureCard icon={Shield} title="Unbreakable floor (design goal)">
                  The docs state every token on RISE has a floor that only moves up, tracking
                  around a fraction of all-time high, backed by protocol-owned liquidity—see{" "}
                  <ExternalLink href={RISE.floor} className="text-sm">
                    how the floor works
                  </ExternalLink>
                  .
                </FeatureCard>
              </motion.div>
              <motion.div {...itemFade(reduceMotion)} className="h-full">
                <FeatureCard icon={Wallet} title="Interest-free borrows">
                  Borrow against floor value from day one: no ongoing interest, no liquidation, one
                  flat origination fee. Details:{" "}
                  <ExternalLink href={RISE.borrow} className="text-sm">
                    borrow guide
                  </ExternalLink>
                  .
                </FeatureCard>
              </motion.div>
              <motion.div {...itemFade(reduceMotion)} className="h-full">
                <FeatureCard icon={RefreshCw} title="Liquidation-free loops">
                  Loop borrows into further buys with documentation framing reduced liquidation
                  risk because the floor holds. Deep dive:{" "}
                  <ExternalLink href={RISE.borrowsAndLoops} className="text-sm">
                    borrows &amp; loops
                  </ExternalLink>
                  .
                </FeatureCard>
              </motion.div>
              <motion.div {...itemFade(reduceMotion)} className="h-full">
                <FeatureCard icon={Vault} title="Protocol-owned liquidity">
                  Liquidity is held by the protocol rather than vanishing with external LPs;
                  capital can be reallocated into the floor as a token appreciates against a chosen
                  reserve. Source: same{" "}
                  <ExternalLink href={RISE.intro} className="text-sm">
                    intro
                  </ExternalLink>
                  .
                </FeatureCard>
              </motion.div>
            </motion.div>
          </motion.section>

          {/* Comparison from RISE intro */}
          <motion.section
            {...(reduceMotion
              ? {}
              : { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } })}
            className="mb-20"
          >
            <div className="mb-4 max-w-3xl min-w-0 sm:mb-8">
              <SectionEyebrow>Comparative positioning</SectionEyebrow>
              <h2 className="mt-2 text-balance text-2xl font-bold tracking-[-0.02em] sm:text-3xl md:text-4xl">
                How RISE <span className="text-foreground/80">frames</span> the difference
              </h2>
              <p className="mt-4 text-sm text-muted-foreground sm:text-base sm:leading-relaxed">
                The following comparison appears in the{" "}
                <ExternalLink href={RISE.intro}>RISE introduction</ExternalLink> (April 2026) and is
                reproduced for transparency. It is the protocol&apos;s positioning, not independent
                verification.
              </p>
            </div>
            <p className="mb-2 text-xs text-muted-foreground sm:hidden">Swipe horizontally to see all columns.</p>
            <div className="min-w-0 overflow-x-auto overscroll-x-contain scroll-smooth rounded-2xl border border-border/60 bg-card/20 shadow-[0_1px_0_0_hsl(0_0%_100%/0.03)_inset] [-webkit-overflow-scrolling:touch] touch-pan-x backdrop-blur-sm">
              <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
                <caption className="sr-only">Feature comparison: Pump.fun, Bonk.fun, RISE</caption>
                <thead>
                  <tr className="border-b border-border/50 bg-gradient-to-b from-muted/30 to-transparent">
                    <th scope="col" className="px-4 py-3.5 font-semibold text-foreground sm:px-6">
                      Capability
                    </th>
                    <th scope="col" className="px-4 py-3.5 font-medium text-muted-foreground sm:px-6">
                      Pump.fun
                    </th>
                    <th scope="col" className="px-4 py-3.5 font-medium text-muted-foreground sm:px-6">
                      Bonk.fun
                    </th>
                    <th scope="col" className="px-4 py-3.5 font-medium text-foreground sm:px-6">
                      RISE
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {(
                    [
                      ["Permissionless", "yes", "yes", "yes"],
                      ["Easy token creation", "yes", "yes", "yes"],
                      ["Floor price protection", "no", "no", "yes"],
                      ["Instant borrowing", "no", "no", "yes"],
                      ["Leverage without liquidation (as stated)", "no", "no", "yes"],
                    ] as const
                  ).map(([label, a, b, c]) => (
                    <tr key={label} className="hover:bg-muted/10">
                      <th
                        scope="row"
                        className="px-4 py-3.5 font-medium text-foreground sm:px-6"
                      >
                        {label}
                      </th>
                      <td className="px-4 py-3.5 text-muted-foreground sm:px-6">
                        {a === "yes" ? "Yes" : "No"}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground sm:px-6">
                        {b === "yes" ? "Yes" : "No"}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-foreground sm:px-6">
                        {c === "yes" ? "Yes" : "No"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>

          {/* Syra experiment goals */}
          <motion.section
            {...(reduceMotion
              ? {}
              : { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } })}
            className="mb-20"
          >
            <div className="grid min-w-0 gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
              <div className="min-w-0">
                <SectionEyebrow>What we are learning</SectionEyebrow>
                <h2 className="mt-2 text-2xl font-bold tracking-[-0.02em] sm:text-3xl md:text-4xl text-balance">
                  What <span className="neon-text">Up Only</span> is testing for Syra
                </h2>
                <p className="mt-4 text-muted-foreground sm:text-lg sm:leading-relaxed">
                  We are validating end-to-end workflows—creation, trading, and documented borrow /
                  floor dynamics—so future Syra product and education tracks can reference RISE with
                  first-hand data. The experiment is intentionally named to reflect the protocol&apos;s
                  documented mechanics, not a promise of market outcome.
                </p>
                <ul className="mt-8 space-y-4">
                  {[
                    "UX and clarity of RISE launch and trading flows in real use.",
                    "How Syra's audience engages with a floor-and-borrow model versus a classic pump-style curve.",
                    "Signals for where Syra’s agents, docs, and alerts should link when users ask about RISE.",
                  ].map((line) => (
                    <li key={line} className="flex gap-3 text-sm sm:text-base text-muted-foreground">
                      <span className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border/70 bg-card/50">
                        <Sparkles className="h-3 w-3 text-foreground/70" aria-hidden />
                      </span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="glass-card min-w-0 rounded-2xl p-5 sm:p-8">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <TrendingUp className="h-4 w-4 text-success" aria-hidden />
                  Experiment posture
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  This page is the official description of the Syra × RISE <strong>Up Only</strong>{" "}
                  effort. It is not in the main site navigation by design: share the URL directly with
                  contributors and partners. Always read RISE’s{" "}
                  <ExternalLink href="https://docs.rise.rich/legal/terms" className="text-sm">
                    terms
                  </ExternalLink>{" "}
                  and <ExternalLink href="https://docs.rise.rich/legal/privacy" className="text-sm">
                    privacy notice
                  </ExternalLink>{" "}
                  before using the platform.
                </p>
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground/90">
                  Nothing here is financial advice. Crypto prices can go to zero. Past performance and
                  protocol design claims do not guarantee results. DYOR.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Community + resources */}
          <motion.section
            {...(reduceMotion
              ? {}
              : { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } })}
            className="rounded-3xl border border-border/60 bg-gradient-to-b from-card/55 via-card/30 to-card/10 px-6 py-10 shadow-lg shadow-black/5 backdrop-blur-sm sm:px-10 sm:py-12"
          >
            <SectionEyebrow className="text-center">Resources</SectionEyebrow>
            <h2 className="mt-2 text-center text-xl font-bold tracking-[-0.02em] sm:text-2xl">
              RISE community &amp; resources
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted-foreground sm:leading-relaxed">
              Full technical detail lives in the docs index at{" "}
              <a
                className="font-mono text-xs text-foreground/90 underline-offset-2 hover:underline"
                href="https://docs.rise.rich/llms.txt"
                target="_blank"
                rel="noopener noreferrer"
              >
                docs.rise.rich/llms.txt
              </a>
              —use it to discover every page before going deeper.
            </p>
            <div className="mt-8 flex w-full min-w-0 max-w-2xl flex-col items-stretch justify-center gap-3 sm:mx-auto sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center">
              <Button
                asChild
                variant="secondary"
                className="min-h-11 w-full justify-center rounded-xl sm:min-h-10 sm:w-auto"
              >
                <a href={RISE.x} target="_blank" rel="noopener noreferrer" className="inline-flex">
                  RISE on X
                  <ArrowUpRight className="ml-1.5 h-4 w-4" />
                </a>
              </Button>
              <Button
                asChild
                variant="secondary"
                className="min-h-11 w-full justify-center rounded-xl sm:min-h-10 sm:w-auto"
              >
                <a href={RISE.telegram} target="_blank" rel="noopener noreferrer" className="inline-flex">
                  Telegram
                  <ArrowUpRight className="ml-1.5 h-4 w-4" />
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="min-h-11 w-full justify-center rounded-xl sm:min-h-10 sm:w-auto"
              >
                <a href={RISE.floor} target="_blank" rel="noopener noreferrer" className="inline-flex">
                  Floor mechanism
                  <ArrowUpRight className="ml-1.5 h-4 w-4" />
                </a>
              </Button>
            </div>
          </motion.section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
