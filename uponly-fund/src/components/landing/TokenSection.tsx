import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  Check,
  Copy,
  ExternalLink,
  Layers,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RISE_UP_ONLY, getRiseRichTradeUrl } from "@/data/riseUpOnly";
import { cn } from "@/lib/utils";
import { LandingSectionHeader } from "./LandingSectionHeader";
import { LANDING_EASE, landingViewport } from "./landingMotion";

const TOKEN_COIN = "/images/experiment/rise_uponly.png" as const;
const RISE_LOGO = "/images/partners/rise.jpg" as const;

const FEATURES = [
  {
    icon: Layers,
    title: "Venue-native liquidity",
    body: "The liquid sleeve trades on RISE—aligned with protocol mechanics, not an off-book wrapper.",
  },
  {
    icon: ShieldCheck,
    title: "Verify before you size",
    body: "Mint, metadata, and venue status are on Solana. Confirm on-chain before any exposure.",
  },
  {
    icon: Check,
    title: "Published alongside mandate",
    body: "Sits next to the allocation thesis as the market-facing tranche—not inside the private book.",
  },
] as const;

type TokenSectionProps = {
  className?: string;
};

function truncateMint(mint: string, head = 6, tail = 6): string {
  if (mint.length <= head + tail + 3) return mint;
  return `${mint.slice(0, head)}…${mint.slice(-tail)}`;
}

export function TokenSection({ className }: TokenSectionProps) {
  const [copied, setCopied] = useState(false);
  const reduceMotion = useReducedMotion() ?? false;
  const tradeUrl = getRiseRichTradeUrl(RISE_UP_ONLY);
  const canBuy = RISE_UP_ONLY.buyOnRiseEnabled && tradeUrl !== null;
  const mint = RISE_UP_ONLY.mint;

  const onCopyMint = async () => {
    if (!mint) return;
    try {
      await navigator.clipboard.writeText(mint);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can fail in strict browser modes; keep silent.
    }
  };

  return (
    <section
      id="landing-token"
      className={cn("scroll-mt-24", className)}
      aria-labelledby="landing-token-heading"
    >
      <LandingSectionHeader
        eyebrow="Liquid sleeve"
        title={
          <>
            Align with{" "}
            <span className="font-mono tracking-[-0.04em] text-foreground">$UPONLY</span>
          </>
        }
        description="The liquid $UPONLY tranche lets markets participate alongside our high-conviction mandate—venue-native liquidity with on-chain verification."
        id="landing-token-heading"
      />

      <motion.div
        className="landing-liquid-sleeve-panel mt-10 sm:mt-12 lg:mt-14"
        initial={reduceMotion ? false : { opacity: 0, y: 28 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={landingViewport}
        transition={{ duration: 0.65, ease: LANDING_EASE }}
      >
        <div className="grid min-w-0 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          {/* Visual panel */}
          <div className="landing-liquid-sleeve-visual relative flex min-h-[16rem] flex-col items-center justify-center overflow-hidden px-6 py-10 sm:min-h-[18rem] sm:px-8 sm:py-12 lg:min-h-[22rem] lg:border-r lg:border-border/40">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_50%_40%,hsl(var(--uof)/0.16),transparent_68%)]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 grid-pattern opacity-[0.12] dark:opacity-[0.18]"
              aria-hidden
            />

            <div className="relative z-[1] flex flex-wrap items-center justify-center gap-2">
              <Badge
                variant="outline"
                className="border-uof/30 bg-uof/[0.08] px-2.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-foreground/95"
              >
                Solana
              </Badge>
              <Badge
                variant="secondary"
                className="gap-1.5 border border-border/50 bg-background/40 px-2.5 py-0.5 text-[0.65rem] uppercase tracking-[0.16em]"
              >
                <img
                  src={RISE_LOGO}
                  alt=""
                  className="h-3.5 w-auto rounded-sm object-contain"
                  width={14}
                  height={14}
                />
                RISE venue
              </Badge>
            </div>

            <motion.div
              className="relative z-[1] mt-8 flex aspect-square w-[min(58vw,11rem)] items-center justify-center sm:w-[min(42vw,12.5rem)] lg:w-[min(100%,13.5rem)]"
              animate={
                reduceMotion
                  ? undefined
                  : { y: [0, -8, 0], rotate: [0, 0.6, 0, -0.5, 0] }
              }
              transition={
                reduceMotion ? undefined : { duration: 7, repeat: Infinity, ease: "easeInOut" }
              }
            >
              <div
                className="absolute inset-[8%] rounded-full bg-[radial-gradient(closest-side,hsl(var(--uof)/0.28),transparent_72%)] blur-lg"
                aria-hidden
              />
              <img
                src={TOKEN_COIN}
                alt=""
                width={216}
                height={216}
                className="relative h-auto w-full object-contain drop-shadow-[0_12px_40px_hsl(var(--uof)/0.35)]"
                decoding="async"
                loading="lazy"
              />
            </motion.div>

            <div className="relative z-[1] mt-6 text-center">
              <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-foreground sm:text-[1.75rem]">
                <span className="neon-text">$UPONLY</span>
              </p>
              <p className="mt-1.5 text-[0.65rem] font-medium uppercase tracking-[0.22em] text-muted-foreground/90">
                Liquid sleeve · Up Only Fund
              </p>
            </div>
          </div>

          {/* Content panel */}
          <div className="flex min-w-0 flex-col justify-center px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
            <p className="landing-eyebrow text-uof/85">Market-facing tranche</p>
            <h3 className="mt-3 font-display text-xl font-medium tracking-[-0.02em] text-foreground sm:text-2xl">
              Trade with conviction, verify on-chain
            </h3>
            <p className="mt-3 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
              Confirm the mint, review the mandate, then route execution through RISE. This sleeve is
              published for transparency—not a pooled subscription product.
            </p>

            <ul className="mt-7 space-y-4 border-y border-border/40 py-6">
              {FEATURES.map((f) => (
                <li key={f.title} className="flex gap-3.5">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/50 bg-background/50 text-foreground/75">
                    <f.icon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground/95">{f.title}</p>
                    <p className="mt-1 text-pretty text-xs leading-relaxed text-muted-foreground sm:text-sm">
                      {f.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Token mint
              </p>
              <div className="mt-2.5 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch">
                <code
                  className="flex min-h-11 min-w-0 flex-1 items-center break-all rounded-lg border border-border/55 bg-background/55 px-3.5 py-2.5 font-mono text-[0.75rem] leading-snug text-foreground/92 sm:text-[0.8125rem]"
                  title={mint ?? undefined}
                >
                  <span className="sm:hidden">{mint ? truncateMint(mint) : "TBA"}</span>
                  <span className="hidden sm:inline">{mint ?? "TBA"}</span>
                </code>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 shrink-0 gap-2 rounded-lg border-border/60 bg-background/40 px-4"
                  onClick={onCopyMint}
                  disabled={!mint}
                >
                  <Copy className="h-4 w-4" />
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              {mint ? (
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <a
                    href={`https://solscan.io/token/${mint}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground/90 underline-offset-2 hover:underline sm:text-sm"
                  >
                    View on Solscan
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                  <Link
                    to={`/token/${mint}`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline sm:text-sm"
                  >
                    Open token page
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </div>
              ) : null}
            </div>

            <div className="mt-8 flex w-full min-w-0 flex-col gap-3 min-[480px]:flex-row min-[480px]:flex-wrap">
              {canBuy && tradeUrl ? (
                <Button asChild size="lg" className="h-12 min-h-12 w-full rounded-lg font-semibold min-[480px]:w-auto min-[480px]:flex-1">
                  <a href={tradeUrl} target="_blank" rel="noopener noreferrer">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Buy on RISE
                  </a>
                </Button>
              ) : (
                <Button type="button" size="lg" className="h-12 min-h-12 w-full rounded-lg min-[480px]:w-auto min-[480px]:flex-1" disabled>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Buy on RISE
                </Button>
              )}
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 min-h-12 w-full rounded-lg border-border/60 bg-background/50 font-medium min-[480px]:w-auto min-[480px]:flex-1"
              >
                <Link to="/#mandate">Review mandate</Link>
              </Button>
            </div>

            <p className="mt-4 text-pretty text-[0.6875rem] leading-relaxed text-muted-foreground/90 sm:text-xs">
              Not financial advice. Tokens are volatile; only risk what you can afford to lose. DYOR.
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
