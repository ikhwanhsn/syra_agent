"use client";

import { useEffect } from "react";
import { Link } from "@/lib/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  ExternalLink,
  Plug,
  Terminal,
  Wallet,
  Zap,
} from "lucide-react";
import { usePublicMetrics, type PublicMetricsSnapshot } from "@/lib/publicMetricsApi";
import { SYRA_LIVE_SUBLINE, SYRA_TAGLINE } from "@/lib/syraBranding";
import { SYRA_TOKEN_PAGE_PATH } from "@/content/syraFocus";
import { SyraBuyButton } from "@/components/syra/SyraBuyButton";
import { GrowthTokenSection } from "@/components/growth/GrowthTokenSection";
import { GrowthTrustRankings } from "@/components/growth/GrowthTrustRankings";
import { GrowthFooter } from "@/components/growth/GrowthFooter";
import { cn } from "@/lib/utils";
import {
  growthCtaPrimaryClass,
  growthCtaSecondaryClass,
  growthDividerClass,
  growthKickerClass,
  growthPanelClass,
  growthPanelQuietClass,
  growthProseClass,
  growthRootClass,
  growthSectionTitleClass,
  growthShellClass,
  growthStatValueClass,
} from "@/components/growth/growthHomeStyles";

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

const HOW_STEPS = [
  {
    n: "01",
    title: "Install once",
    body: "MCP in Cursor or Claude — or the typed SDK. One payer wallet for the catalog.",
    href: "https://docs.syraa.fun/docs/build/mcp",
    external: true,
    icon: Plug,
  },
  {
    n: "02",
    title: "Pay per call",
    body: "HTTP 402 settles Solana USDC. First successful paid call in about five minutes.",
    href: "/marketplace",
    external: false,
    icon: Terminal,
  },
  {
    n: "03",
    title: "Hold $SYRA",
    body: "Utility on the same rails — swap, stake, and follow buyback disclosure.",
    href: SYRA_TOKEN_PAGE_PATH,
    external: false,
    icon: Zap,
  },
] as const;

function MetricSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-[108px] animate-pulse rounded-2xl border border-border/30 bg-muted/25"
        />
      ))}
    </div>
  );
}

function ProofStat({
  label,
  value,
  hint,
  large,
}: {
  label: string;
  value: string;
  hint?: string;
  large?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className={cn(growthKickerClass, "tracking-[0.18em]")}>{label}</p>
      <p
        className={cn(
          growthStatValueClass,
          large ? "mt-2 text-3xl sm:text-4xl" : "mt-2 text-2xl sm:text-[1.75rem]",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1.5 text-xs leading-snug text-muted-foreground/80">{hint}</p> : null}
    </div>
  );
}

function LivePulse() {
  return (
    <span className="relative flex h-2 w-2" aria-hidden>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/50 opacity-60 motion-reduce:hidden" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
    </span>
  );
}

function MetricsBody({
  data,
  paid7d,
  payers7d,
}: {
  data: PublicMetricsSnapshot;
  paid7d: number;
  payers7d: number;
}) {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 border-b border-border/35 pb-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        <ProofStat
          label="Paid calls · 7d"
          value={formatNum(paid7d)}
          hint="North star volume"
          large
        />
        <ProofStat
          label="Paying wallets · 7d"
          value={formatNum(payers7d)}
          hint="Weekly active payers"
          large
        />
        <ProofStat
          label="Lifetime calls"
          value={formatNum(data.lifetime.totalCalls)}
          hint={`${formatNum(data.last24h.calls)} in last 24h`}
        />
        <ProofStat
          label="USDC settled"
          value={formatUsd(data.lifetime.totalUsdSettled)}
          hint={`${formatUsd(data.last24h.usdSettled)} last 24h`}
        />
      </div>

      {data.funnel ? (
        <div className={cn(growthPanelQuietClass, "p-5 sm:p-6")}>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className={growthKickerClass}>Activation</p>
              <h3 className="mt-1 font-display text-lg font-semibold tracking-tight">
                First 402 → paid → D7
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              {(data.funnel.paymentRequiredToPaidRate * 100).toFixed(1)}% convert to paid
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <ProofStat
              label="Saw 402"
              value={formatNum(data.funnel.payersSawPaymentRequired)}
            />
            <ProofStat
              label="Converted"
              value={formatNum(data.funnel.payersConvertedToPaid)}
            />
            <ProofStat
              label="D7 repeat"
              value={formatNum(data.funnel.d7RepeatPayers)}
              hint={
                data.funnel.d7EligiblePayers > 0
                  ? `${(data.funnel.d7RepeatRate * 100).toFixed(1)}% of eligible`
                  : "Building history"
              }
            />
            <ProofStat
              label="First paid · 30d"
              value={formatNum(data.funnel.firstPaidPayersLast30d)}
            />
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-5">
        <div className={cn(growthPanelQuietClass, "p-5 sm:p-6 lg:col-span-2")}>
          <div className="mb-4 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" aria-hidden />
            <h3 className="text-sm font-semibold tracking-tight">Treasury</h3>
          </div>
          <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
            {data.verifyOnChain.hint}
          </p>
          <dl className="space-y-4 text-sm">
            {data.treasury.solana ? (
              <div>
                <dt className={growthKickerClass}>Solana USDC</dt>
                <dd className="mt-1.5 break-all font-mono text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
                  {data.treasury.solana}
                  {data.verifyOnChain.explorers.solana ? (
                    <a
                      href={data.verifyOnChain.explorers.solana}
                      className="ml-2 inline-flex items-center gap-0.5 text-foreground/80 underline-offset-2 hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Solscan
                      <ArrowUpRight className="h-3 w-3" aria-hidden />
                    </a>
                  ) : null}
                </dd>
              </div>
            ) : null}
            {data.treasury.base ? (
              <div>
                <dt className={growthKickerClass}>Base USDC</dt>
                <dd className="mt-1.5 break-all font-mono text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
                  {data.treasury.base}
                  {data.verifyOnChain.explorers.base ? (
                    <a
                      href={data.verifyOnChain.explorers.base}
                      className="ml-2 inline-flex items-center gap-0.5 text-foreground/80 underline-offset-2 hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Basescan
                      <ArrowUpRight className="h-3 w-3" aria-hidden />
                    </a>
                  ) : null}
                </dd>
              </div>
            ) : null}
          </dl>
          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border/35 pt-4">
            <ProofStat
              label="Wallets · life"
              value={formatNum(data.lifetime.uniquePayingWallets)}
            />
            <ProofStat
              label="Avg / call"
              value={`$${data.lifetime.avgUsdPerCall.toFixed(4)}`}
            />
          </div>
        </div>

        <div className="space-y-4 lg:col-span-3">
          {data.byPath.length > 0 ? (
            <div className={cn(growthPanelQuietClass, "p-5 sm:p-6")}>
              <h3 className="mb-4 text-sm font-semibold tracking-tight">Top endpoints</h3>
              <ul className="space-y-0">
                {data.byPath.slice(0, 6).map((row, i) => (
                  <li
                    key={row.path}
                    className={cn(
                      "flex items-baseline justify-between gap-4 py-2.5",
                      i > 0 && "border-t border-border/30",
                    )}
                  >
                    <span className="truncate font-mono text-xs text-muted-foreground sm:text-[13px]">
                      {row.path}
                    </span>
                    <span className="shrink-0 tabular-nums text-sm font-medium text-foreground">
                      {formatNum(row.count)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {data.recentCalls.length > 0 ? (
            <div className={cn(growthPanelQuietClass, "p-5 sm:p-6")}>
              <div className="mb-4 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold tracking-tight">Live feed</h3>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <LivePulse />
                  Settled
                </span>
              </div>
              <ul className="space-y-0">
                {data.recentCalls.slice(0, 5).map((call, i) => (
                  <li
                    key={`${call.at}-${i}`}
                    className={cn(
                      "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5",
                      i > 0 && "border-t border-border/30",
                    )}
                  >
                    <span className="font-mono text-xs text-muted-foreground">{call.path}</span>
                    <span className="tabular-nums text-xs text-foreground/90 sm:text-sm">
                      ${call.amountUsd.toFixed(4)}
                      <span className="text-muted-foreground"> · {call.payer ?? "—"}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground/80">
        Updated {new Date(data.updatedAt).toLocaleString()} ·{" "}
        <a
          href="https://api.syraa.fun/api/live/calls"
          className="text-foreground/75 underline-offset-2 hover:underline"
        >
          SSE feed
        </a>
      </p>
    </div>
  );
}

/**
 * Public growth home — premium machine-money landing with live x402 proof.
 */
export default function GrowthHomePage() {
  const { data, isLoading, isError, error } = usePublicMetrics();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    document.title = "Syra · Machine Money for Agents";
    return () => {
      document.title = "Syra";
    };
  }, []);

  const paid7d = data?.northStar?.paidCallsLast7d ?? data?.last7d.calls ?? 0;
  const payers7d =
    data?.northStar?.uniquePayingWalletsLast7d ?? data?.last7d.uniquePayingWallets ?? 0;

  const fadeUp = (delay = 0) =>
    reduceMotion
      ? { initial: false as const, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: {
            duration: 0.55,
            delay,
            ease: [0.16, 1, 0.3, 1] as const,
          },
        };

  return (
    <div className={growthRootClass}>
      {/* Atmosphere — full-bleed plane, not inset cards */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(92vh,820px)]"
        aria-hidden
      >
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 90% 55% at 50% -8%, hsl(var(--foreground) / 0.07), transparent 58%),
              radial-gradient(ellipse 45% 40% at 12% 28%, hsl(var(--foreground) / 0.035), transparent 50%),
              radial-gradient(ellipse 40% 35% at 88% 18%, hsl(var(--foreground) / 0.03), transparent 48%)
            `,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.22] motion-reduce:opacity-[0.12]"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--border) / 0.2) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--border) / 0.2) 1px, transparent 1px)
            `,
            backgroundSize: "64px 64px",
            maskImage:
              "radial-gradient(ellipse 80% 55% at 50% 8%, black 0%, transparent 72%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 55% at 50% 8%, black 0%, transparent 72%)",
          }}
        />
        <div className={cn(growthDividerClass, "absolute inset-x-0 bottom-0 opacity-60")} />
      </div>

      <div className={cn(growthShellClass, "relative pb-20 pt-12 sm:pb-28 sm:pt-16 lg:pt-20")}>
        {/* Hero */}
        <header className="mx-auto max-w-3xl text-center">
          <motion.div {...fadeUp(0)} className="flex flex-col items-center">
            <div className="relative mb-8">
              <div
                className="absolute -inset-6 rounded-[2rem] bg-foreground/[0.04] blur-2xl motion-reduce:hidden"
                aria-hidden
              />
              <div
                className={cn(
                  "relative flex h-[4.5rem] w-[4.5rem] items-center justify-center overflow-hidden rounded-[1.35rem] sm:h-20 sm:w-20 sm:rounded-[1.5rem]",
                  "border border-border/50 bg-gradient-to-br from-card via-card to-muted/40",
                  "shadow-[0_1px_0_0_hsl(var(--border)/0.5)_inset,0_24px_48px_-28px_rgba(0,0,0,0.7)]",
                  "ring-1 ring-inset ring-white/[0.04]",
                )}
              >
                <img
                  src="/logo.jpg"
                  alt=""
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              </div>
            </div>

            <p className={cn(growthKickerClass, "mb-4")}>
              <span className="gradient-text font-semibold tracking-[0.32em]">Syra</span>
            </p>

            <h1 className="text-balance font-display text-[2.35rem] font-semibold leading-[1.05] tracking-[-0.05em] text-foreground sm:text-5xl md:text-[3.5rem] md:leading-[1.02]">
              <span className="gradient-text">{SYRA_TAGLINE}</span>
            </h1>

            <p className={cn(growthProseClass, "mx-auto mt-5 max-w-lg text-pretty")}>
              Earn · Treasury · Invest · Spend · Grow on Solana.
              <span className="mt-1 block text-foreground/75">{SYRA_LIVE_SUBLINE}.</span>
            </p>
          </motion.div>

          <motion.div
            {...fadeUp(0.08)}
            className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-3"
          >
            <Link to="/marketplace" className={growthCtaPrimaryClass}>
              First paid call in 5 minutes
              <ArrowRight className="h-4 w-4 opacity-90" aria-hidden />
            </Link>
            <SyraBuyButton
              variant="default"
              className={cn(growthCtaSecondaryClass, "border-border/55 bg-background/50")}
              label="Buy $SYRA"
            />
          </motion.div>

          <motion.p {...fadeUp(0.12)} className="mt-4 text-sm text-muted-foreground/80">
            Or{" "}
            <Link
              to="/agent"
              className="font-medium text-foreground/85 underline-offset-4 hover:underline"
            >
              open the reference agent
            </Link>
          </motion.p>

          <motion.div {...fadeUp(0.14)} className="mt-10">
            <GrowthTrustRankings />
          </motion.div>

          {/* Hero proof strip — not a card grid */}
          <motion.div
            {...fadeUp(0.16)}
            className="mx-auto mt-8 max-w-2xl"
            aria-live="polite"
          >
            <div
              className={cn(
                growthPanelClass,
                "flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6",
              )}
            >
              <div className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                <LivePulse />
                <span className="inline-flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5" aria-hidden />
                  Live traction
                </span>
              </div>

              {isLoading && !data ? (
                <p className="text-sm text-muted-foreground">Loading proof…</p>
              ) : isError && !data ? (
                <p className="text-sm text-destructive">
                  {error instanceof Error ? error.message : "Metrics unavailable"}
                </p>
              ) : data ? (
                <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2 text-sm sm:justify-end">
                  <span>
                    <span className={cn(growthStatValueClass, "text-base sm:text-lg")}>
                      {formatNum(paid7d)}
                    </span>
                    <span className="ml-1.5 text-muted-foreground">calls / 7d</span>
                  </span>
                  <span className="hidden text-border sm:inline" aria-hidden>
                    /
                  </span>
                  <span>
                    <span className={cn(growthStatValueClass, "text-base sm:text-lg")}>
                      {formatNum(payers7d)}
                    </span>
                    <span className="ml-1.5 text-muted-foreground">wallets</span>
                  </span>
                  <span className="hidden text-border sm:inline" aria-hidden>
                    /
                  </span>
                  <span>
                    <span className={cn(growthStatValueClass, "text-base sm:text-lg")}>
                      {formatUsd(data.lifetime.totalUsdSettled)}
                    </span>
                    <span className="ml-1.5 text-muted-foreground">settled</span>
                  </span>
                </div>
              ) : null}
            </div>
          </motion.div>
        </header>

        {/* How it works — editorial steps, not icon-card grid */}
        <motion.section
          {...fadeUp(0.2)}
          className="mt-20 sm:mt-28"
          aria-labelledby="how-heading"
        >
          <div className="mb-8 max-w-xl">
            <p className={cn(growthKickerClass, "mb-2 inline-flex items-center gap-2.5 before:h-px before:w-5 before:bg-foreground/20")}>
              Path
            </p>
            <h2 id="how-heading" className={growthSectionTitleClass}>
              From install to capital
            </h2>
          </div>

          <ol className="grid gap-px overflow-hidden rounded-[1.35rem] border border-border/40 bg-border/30 sm:grid-cols-3">
            {HOW_STEPS.map(({ n, title, body, href, external, icon: Icon }) => {
              const className = cn(
                "group relative flex flex-col bg-background/90 p-6 sm:p-7",
                "transition-colors duration-200 hover:bg-card",
                "focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              );
              const inner = (
                <>
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <span className="font-mono text-[11px] font-medium tracking-[0.2em] text-muted-foreground/70">
                      {n}
                    </span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/40 bg-muted/20 text-foreground/70 transition-colors group-hover:border-border/60 group-hover:text-foreground">
                      <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                    </span>
                  </div>
                  <h3 className="font-display text-[15px] font-semibold tracking-[-0.02em] text-foreground">
                    {title}
                  </h3>
                  <p className="mt-2 flex-1 text-[13px] leading-[1.65] text-muted-foreground">
                    {body}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1 text-xs font-medium text-foreground/70 transition-colors group-hover:text-foreground">
                    Continue
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </>
              );
              return (
                <li key={n} className="min-h-0">
                  {external ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(className, "h-full")}
                    >
                      {inner}
                    </a>
                  ) : (
                    <Link to={href} className={cn(className, "h-full")}>
                      {inner}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </motion.section>

        {/* Metrics */}
        <motion.section
          {...fadeUp(0.08)}
          id="metrics"
          className="mt-20 scroll-mt-24 sm:mt-28"
          aria-labelledby="metrics-heading"
        >
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              <p className={cn(growthKickerClass, "mb-2 inline-flex items-center gap-2.5 before:h-px before:w-5 before:bg-foreground/20")}>
                On-chain verifiable
              </p>
              <h2 id="metrics-heading" className={growthSectionTitleClass}>
                Public proof
              </h2>
              <p className={cn(growthProseClass, "mt-3")}>
                Paid volume, unique payers, and activation — the traction line for machine money.
              </p>
            </div>
            <a
              href="https://api.syraa.fun/api/metrics"
              className={cn(
                growthCtaSecondaryClass,
                "h-10 min-h-10 gap-1.5 px-4 text-xs font-medium",
              )}
              target="_blank"
              rel="noreferrer"
            >
              JSON API
              <ExternalLink className="h-3.5 w-3.5 opacity-60" aria-hidden />
            </a>
          </div>

          <div className={cn(growthPanelClass, "p-5 sm:p-8")}>
            {isLoading && !data ? <MetricSkeleton /> : null}
            {isError && !data ? (
              <p className="text-sm text-destructive">
                {error instanceof Error ? error.message : "Failed to load metrics"}
              </p>
            ) : null}
            {data ? (
              <MetricsBody data={data} paid7d={paid7d} payers7d={payers7d} />
            ) : null}
          </div>
        </motion.section>

        {/* Token — single panel, no nested cards */}
        <motion.div {...fadeUp(0.06)} className="mt-20 sm:mt-28">
          <GrowthTokenSection />
        </motion.div>

        {/* Close — editorial CTA band */}
        <motion.section
          {...fadeUp(0.04)}
          className="mt-20 sm:mt-28"
          aria-labelledby="close-heading"
        >
          <div
            className={cn(
              growthPanelClass,
              "relative overflow-hidden px-6 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16",
            )}
          >
            <div
              className="pointer-events-none absolute inset-0"
              aria-hidden
              style={{
                background: `
                  radial-gradient(ellipse 70% 80% at 12% 20%, hsl(var(--foreground) / 0.06), transparent 55%),
                  radial-gradient(ellipse 50% 60% at 92% 85%, hsl(var(--foreground) / 0.035), transparent 50%)
                `,
              }}
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.18] motion-reduce:opacity-[0.08]"
              aria-hidden
              style={{
                backgroundImage: `
                  linear-gradient(to right, hsl(var(--border) / 0.25) 1px, transparent 1px),
                  linear-gradient(to bottom, hsl(var(--border) / 0.25) 1px, transparent 1px)
                `,
                backgroundSize: "48px 48px",
                maskImage:
                  "radial-gradient(ellipse 75% 70% at 40% 40%, black 0%, transparent 78%)",
                WebkitMaskImage:
                  "radial-gradient(ellipse 75% 70% at 40% 40%, black 0%, transparent 78%)",
              }}
            />

            <div className="relative flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
              <div className="max-w-xl">
                <p
                  className={cn(
                    growthKickerClass,
                    "mb-4 inline-flex items-center gap-2.5 before:h-px before:w-5 before:bg-foreground/25",
                  )}
                >
                  Activate
                </p>
                <h2
                  id="close-heading"
                  className="text-balance font-display text-[1.85rem] font-semibold leading-[1.08] tracking-[-0.045em] text-foreground sm:text-[2.35rem] lg:text-[2.65rem]"
                >
                  Ship the call.
                  <span className="mt-1 block text-foreground/55">Then hold the token.</span>
                </h2>
                <p className={cn(growthProseClass, "mt-5 max-w-md text-pretty")}>
                  Builders activate on MCP and the marketplace. Token interest follows real usage —
                  not the other way around.
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[16rem]">
                <Link
                  to="/marketplace"
                  className={cn(growthCtaPrimaryClass, "w-full sm:w-auto")}
                >
                  Open marketplace
                  <ArrowRight className="h-4 w-4 opacity-90" aria-hidden />
                </Link>
                <a
                  href="https://docs.syraa.fun/docs/build/mcp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(growthCtaSecondaryClass, "w-full sm:w-auto")}
                >
                  Install MCP
                  <ExternalLink className="h-3.5 w-3.5 opacity-55" aria-hidden />
                </a>
                <p className="pt-1 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground/55 sm:text-left">
                  First paid call · ~5 min
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      </div>

      <GrowthFooter />
    </div>
  );
}
