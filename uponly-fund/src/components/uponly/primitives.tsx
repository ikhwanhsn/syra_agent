import { useId, useState, type ComponentType, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Coins, Copy, Droplets, MessageCircle, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SYRA_TOKEN_MINT, syraSolscanTokenUrl } from "@/data/agentIdentity";
import { getRiseRichTradeUrl, riseUpOnlyHasAnyMarketStats, type RiseUpOnlyManual } from "@/data/riseUpOnly";
import { useRiseUpOnlyMarket } from "@/lib/RiseUpOnlyMarketContext";
import { formatInt, formatPct, formatUsd } from "@/lib/marketDisplayFormat";
import syraMark from "/images/logo.jpg";

/** RISE public docs and social */
export const RISE_DOCS = {
  intro: "https://docs.rise.rich/introduction",
  floor: "https://docs.rise.rich/protocol/floor-mechanism",
  createToken: "https://docs.rise.rich/guides/create-token",
  borrow: "https://docs.rise.rich/guides/borrow",
  borrowsAndLoops: "https://docs.rise.rich/protocol/borrows-and-loops",
  bondingCurve: "https://docs.rise.rich/protocol/bonding-curve",
  security: "https://docs.rise.rich/protocol/security",
  x: "https://x.com/risedotrich",
  telegram: "https://t.me/rise_dot_rich",
} as const;

const RISE_PARTNER_LOGO = "/images/partners/rise.jpg";
const RISE_LOGO_PLACEHOLDER = "/images/partners/placeholder.svg";

export const UP_ONLY_HERO_ART = "/images/experiment/rise_uponly.png";
export const HERO_IMAGE_ALT =
  "Up Only — official Syra and RISE on-chain experiment key art, Syra by RISE";
export const UP_ONLY_LOGO_MARK = "/images/experiment/rise_uponly.png";
const UP_ONLY_LOGO_ALT = "Up Only — experiment logo mark";

export const fadeUp = (reduce: boolean) =>
  reduce
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
      };

export const stagger = (reduce: boolean) =>
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

export const itemFade = (reduce: boolean) =>
  reduce
    ? {}
    : {
        variants: {
          hidden: { opacity: 0, y: 16 },
          show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
        },
      };

export function SyraRiseLockup({ className }: { className?: string }) {
  return (
    <div className={cn("w-full min-w-0", className)}>
      <div className="relative mx-auto w-full min-w-0 max-w-md sm:max-w-none sm:mx-0">
        <div
          className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-success/[0.12] via-ring/10 to-success/[0.08] opacity-80 blur-2xl dark:from-success/[0.08] sm:-inset-4"
          aria-hidden
        />
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-card/70 to-card/30 p-1 shadow-[0_0_0_1px_hsl(0_0%_100%/0.05)_inset,0_16px_40px_-12px_hsl(0_0%_0%/0.35)] backdrop-blur-sm dark:from-card/50 dark:to-background/20">
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
              Syra × RISE — <span className="text-foreground/85">$UPONLY</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeeAllocationIllustration({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const gSyra = `uponlyFeePoolSyra-${uid}`;
  const gUp = `uponlyFeePoolUp-${uid}`;
  return (
    <div
      className={cn("relative w-full select-none", className)}
      role="img"
      aria-label="Illustration: fees split equally into $SYRA and $UPONLY liquidity pools for the RISE Up Only program."
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
          <linearGradient id={gSyra} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--ring))" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id={gUp} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity="0.45" />
            <stop offset="100%" stopColor="hsl(var(--ring))" stopOpacity="0.2" />
          </linearGradient>
        </defs>
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
        <path d="M 200 34 L 200 60" className="stroke-border/70" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="200" cy="64" r="3" className="fill-success/55" />
        <path
          d="M 200 67 L 200 78 M 200 78 L 105 100 M 200 78 L 295 100"
          className="stroke-border/60"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          x="32"
          y="104"
          width="146"
          height="80"
          rx="14"
          className="stroke-border/50"
          strokeWidth="1"
          fill={`url(#${gSyra})`}
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
        <rect
          x="222"
          y="104"
          width="146"
          height="80"
          rx="14"
          className="stroke-border/50"
          strokeWidth="1"
          fill={`url(#${gUp})`}
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

export function HeroArtwork({ reduceMotion, belowFold = true }: { reduceMotion: boolean; belowFold?: boolean }) {
  return (
    <motion.figure
      className="relative z-0 mx-auto w-full min-w-0 max-w-xl lg:max-w-none"
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
              className="h-auto w-full max-w-full min-w-0 object-contain object-center"
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

export function SectionEyebrow({ children, className }: { children: ReactNode; className?: string }) {
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

export function FeatureCard({
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

export function ExternalLink({
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

export function UpOnlyLogoMark({
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
      /* ignore */
    }
  };
  return (
    <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <code className="w-full min-w-0 break-all rounded-lg border border-border/50 bg-background/50 px-2.5 py-2 font-mono text-[0.65rem] leading-snug text-foreground/90 shadow-sm sm:min-w-0 sm:flex-1 sm:px-3 sm:text-xs">
        {mint}
      </code>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <a
          href={syraSolscanTokenUrl(mint)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-foreground/90 underline-offset-2 hover:underline"
        >
          View on Solscan
          <ArrowUpRight className="h-3 w-3" />
        </a>
        <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={onCopy}>
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
      /* ignore */
    }
  };
  return (
    <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <code className="w-full min-w-0 break-all rounded-lg border border-border/50 bg-background/50 px-2.5 py-2 font-mono text-[0.65rem] leading-snug text-foreground/90 shadow-sm sm:min-w-0 sm:flex-1 sm:px-3 sm:text-xs">
        {value}
      </code>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <a
          href={solscan}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-foreground/90 underline-offset-2 hover:underline"
        >
          View on Solscan
          <ArrowUpRight className="h-3 w-3" />
        </a>
        <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={onCopy}>
          <Copy className="h-3 w-3" />
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-border/40 bg-background/30 px-2.5 py-2.5 shadow-sm [overflow-wrap:anywhere] sm:px-3.5">
      <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 break-words font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

export function RiseBuyTokenCta({ className }: { className?: string }) {
  const { data: v } = useRiseUpOnlyMarket();
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
            Buy on RISE
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
              ? "Set buyOnRiseEnabled in src/data/riseUpOnly.ts when ready."
              : "Set riseRichTradeId in src/data/riseUpOnly.ts, then enable buyOnRiseEnabled."
          }
        >
          <ShoppingCart className="h-4 w-4 shrink-0" />
          Buy on RISE
        </Button>
      )}
    </div>
  );
}

function buildStatPills(v: RiseUpOnlyManual) {
  const items: { label: string; value: string }[] = [];
  items.push({ label: "Price", value: formatUsd(v.priceUsd) });
  items.push({ label: "Market cap", value: formatUsd(v.marketCapUsd, { compact: false }) });
  items.push({ label: "24h volume", value: formatUsd(v.volume24hUsd, { compact: false }) });
  items.push({ label: "Holders", value: formatInt(v.holders) });
  items.push({ label: "Creator fee", value: formatPct(v.creatorFeePct) });
  items.push({ label: "Start price", value: formatUsd(v.startingPriceUsd) });
  if (v.floorPriceUsd !== null) {
    items.push({ label: "Floor price", value: formatUsd(v.floorPriceUsd) });
  }
  if (v.allTimeHighUsd !== null) {
    items.push({ label: "ATH (ref.)", value: formatUsd(v.allTimeHighUsd) });
  }
  if (v.floorPctOfAth !== null) {
    items.push({ label: "Floor vs ATH", value: formatPct(v.floorPctOfAth) });
  }
  if (v.totalSupply !== null) {
    items.push({ label: "Total supply", value: formatInt(v.totalSupply) });
  }
  if (v.borrowableUsd !== null) {
    items.push({ label: "Floor-backed borrow (ref.)", value: formatUsd(v.borrowableUsd) });
  }
  return items;
}

export function RiseTokenDetailsCard() {
  const { data: v } = useRiseUpOnlyMarket();
  const hasStats = riseUpOnlyHasAnyMarketStats(v);
  const statPills = buildStatPills(v);

  return (
    <div className="relative flex min-w-0 flex-col overflow-hidden rounded-3xl border border-border/55 bg-gradient-to-b from-card/80 via-card/50 to-card/30 shadow-[0_0_0_1px_hsl(0_0%_100%/0.04)_inset,0_24px_64px_-16px_hsl(0_0%_0%/0.25)] backdrop-blur-md dark:shadow-[0_0_0_1px_hsl(0_0%_100%/0.03)_inset,0_28px_80px_-20px_hsl(0_0%_0%/0.45)]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-foreground/10 to-transparent opacity-60 dark:via-white/12" />
      <div className="border-b border-border/40 bg-gradient-to-b from-muted/[0.12] to-transparent px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex w-full min-w-0 flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6 sm:text-left">
          <UpOnlyLogoMark imageUrl={v.imageUrl} alt={v.name} />
          <div className="w-full min-w-0 flex-1 text-center sm:text-left">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground/90">On-chain</p>
            <h3 className="mt-1.5 break-words text-balance text-lg font-semibold tracking-[-0.02em] text-foreground sm:text-xl">
              {v.name}
              <span className="ml-2 inline font-mono text-sm font-medium text-muted-foreground">${v.symbol}</span>
            </h3>
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-4 px-5 py-4 sm:px-7 sm:py-5">
        {hasStats ? (
          <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2 sm:gap-3">
            {statPills.map((p) => (
              <StatPill key={p.label} label={p.label} value={p.value} />
            ))}
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
            <TokenDetailRow label="Mint">
              <p className="mb-2 text-sm text-muted-foreground">
                RISE <strong className="font-medium text-foreground/90">$UPONLY</strong> SPL —{" "}
                <strong className="font-medium text-foreground/90">50%</strong> of Syra-allocated fee liquidity.
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
                emptyLabel="To be published when the RISE market is live — set syraExperimentMint in riseUpOnly.ts when ready."
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

/** Right column: Syra fee policy + diagram */
export function FeeAllocationCard() {
  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl border border-success/25 bg-gradient-to-b from-card/60 via-card/35 to-success/[0.1] shadow-[0_0_0_1px_hsl(0_0%_100%/0.04)_inset,0_20px_56px_-12px_hsl(0_0%_0%/0.2)] backdrop-blur-md">
      <div className="h-px w-full bg-gradient-to-r from-success/20 via-success/5 to-transparent opacity-80" />
      <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full border border-success/10 bg-success/[0.1] blur-2xl" aria-hidden />
      <div
        className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full border border-foreground/5 bg-foreground/[0.03] blur-2xl dark:border-white/5"
        aria-hidden
      />
      <div className="absolute right-0 top-0 h-32 w-px bg-gradient-to-b from-success/25 to-transparent" aria-hidden />
      <div className="relative flex min-h-0 flex-1 flex-col p-5 sm:p-7 sm:pb-8">
        <div className="mb-1 inline-flex w-fit items-center gap-2 rounded-full border border-success/30 bg-success/[0.1] px-3 py-1.5 text-[0.7rem] font-medium uppercase tracking-[0.12em] text-foreground shadow-sm backdrop-blur sm:text-xs">
          <Coins className="h-3.5 w-3.5" aria-hidden />
          Fee allocation
        </div>
        <h3 className="mt-3 text-balance break-words text-base font-semibold leading-snug tracking-[-0.02em] text-foreground sm:text-lg md:text-xl">
          50% $SYRA · 50% $UPONLY — liquidity
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          <strong className="font-medium text-foreground/95">Syra&apos;s policy for Up Only:</strong> every cent of{" "}
          <strong>fees that accrue to Syra</strong> in connection with this program—after pass-throughs where
          required—is used for <strong>on-chain liquidity</strong> only, split <strong>50% canonical $SYRA</strong> and{" "}
          <strong>50% $UPONLY</strong>.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          RISE has its own fee schedule; anything not received by Syra is outside this commitment.
        </p>
        <ul className="mt-5 space-y-2.5 text-sm text-foreground/90 sm:mt-6">
          <li className="flex gap-3 rounded-2xl border border-border/35 bg-background/25 p-3.5 shadow-sm backdrop-blur-sm">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-gradient-to-b from-card/50 to-card/20 shadow-inner">
              <Droplets className="h-3.5 w-3.5 text-success" aria-hidden />
            </span>
            <span className="min-w-0 leading-relaxed">
              <strong className="text-foreground">50% — $SYRA:</strong> half of Syra-allocated fees fund liquidity for the
              canonical $SYRA token.
            </span>
          </li>
          <li className="flex gap-3 rounded-2xl border border-border/35 bg-background/25 p-3.5 shadow-sm backdrop-blur-sm">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-gradient-to-b from-card/50 to-card/20 shadow-inner">
              <Droplets className="h-3.5 w-3.5 text-success" aria-hidden />
            </span>
            <span className="min-w-0 leading-relaxed">
              <strong className="text-foreground">50% — $UPONLY:</strong> the other half deepens the Up Only RISE
              tranche.
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
  );
}
