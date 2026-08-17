"use client";

import { useEffect } from "react";
import { Link } from "@/lib/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  ExternalLink,
  Plug,
  Terminal,
  Wallet,
} from "lucide-react";
import { usePublicMetrics, type PublicMetricsSnapshot } from "@/lib/publicMetricsApi";
import { SYRA_LIVE_SUBLINE, SYRA_OUTCOMES_SUBLINE, SYRA_TAGLINE } from "@/lib/syraBranding";
import { SYRA_SKILL_SETUP_LINE } from "@/content/syraFocus";
import { SyraBuyButton } from "@/components/syra/SyraBuyButton";
import { GrowthTokenSection } from "@/components/growth/GrowthTokenSection";
import { GrowthTestimonials } from "@/components/growth/GrowthTestimonials";
import { GrowthTrustRankings } from "@/components/growth/GrowthTrustRankings";
import { GrowthFooter } from "@/components/growth/GrowthFooter";
import { GrowthX402Flow } from "@/components/growth/GrowthX402Flow";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { Magnetic } from "@/components/motion/magnetic";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { TextReveal } from "@/components/motion/text-reveal";
import { TiltCard } from "@/components/motion/tilt-card";
import { BoneFallback } from "@/components/ui/bone";
import { cn } from "@/lib/utils";
import {
  growthCtaPrimaryClass,
  growthCtaSecondaryClass,
  growthDividerClass,
  growthEyebrowClass,
  growthKickerClass,
  growthMonoChipClass,
  growthPanelClass,
  growthPanelQuietClass,
  growthProseClass,
  growthRootClass,
  growthSectionTitleClass,
  growthShellClass,
  growthStatValueClass,
  growthTerminalFrameClass,
  growthTerminalTitlebarClass,
  growthTileClass,
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
    title: "Fund Solana USDC",
    body: "Put ≥ $1 USDC (and a little SOL for fees) in the wallet you will set as SYRA_PAYER_KEYPAIR.",
    href: "/marketplace",
    external: false,
    icon: Wallet,
    chip: "payer wallet",
  },
  {
    n: "02",
    title: "Paste the skill or install MCP",
    body: `Agents: ${SYRA_SKILL_SETUP_LINE}. Humans: add Syra in Cursor or Claude with SYRA_PAYER_KEYPAIR. Same path as marketplace Integrate.`,
    href: "https://docs.syraa.fun/docs/build/mcp",
    external: true,
    icon: Plug,
    chip: "skill.md · MCP",
  },
  {
    n: "03",
    title: "Consult, then syra_spend_news",
    body: "Call syra_consult with the intent (free). Then run the tool it returns. First settled paid call in about five minutes.",
    href: "/marketplace",
    external: false,
    icon: Terminal,
    chip: "x402 · settled",
  },
] as const;

function ProofStat({
  label,
  numeric,
  format,
  hint,
  large,
}: {
  label: string;
  numeric: number;
  format: (n: number) => string;
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
        <AnimatedNumber value={numeric} format={format} />
      </p>
      {hint ? <p className="mt-1.5 text-xs leading-snug text-muted-foreground/80">{hint}</p> : null}
    </div>
  );
}

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2" aria-hidden>
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
          numeric={paid7d}
          format={formatNum}
          hint="North star volume"
          large
        />
        <ProofStat
          label="Paying wallets · 7d"
          numeric={payers7d}
          format={formatNum}
          hint="Weekly active payers"
          large
        />
        <ProofStat
          label="Lifetime calls"
          numeric={data.lifetime.totalCalls}
          format={formatNum}
          hint={`${formatNum(data.last24h.calls)} in last 24h`}
        />
        <ProofStat
          label="USDC settled"
          numeric={data.lifetime.totalUsdSettled}
          format={formatUsd}
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
            <span className={growthMonoChipClass}>
              {(data.funnel.paymentRequiredToPaidRate * 100).toFixed(1)}% convert
            </span>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <ProofStat
              label="Saw 402"
              numeric={data.funnel.payersSawPaymentRequired}
              format={formatNum}
            />
            <ProofStat
              label="Converted"
              numeric={data.funnel.payersConvertedToPaid}
              format={formatNum}
            />
            <ProofStat
              label="D7 repeat"
              numeric={data.funnel.d7RepeatPayers}
              format={formatNum}
              hint={
                data.funnel.d7EligiblePayers > 0
                  ? `${(data.funnel.d7RepeatRate * 100).toFixed(1)}% of eligible`
                  : "Building history"
              }
            />
            <ProofStat
              label="First paid · 30d"
              numeric={data.funnel.firstPaidPayersLast30d}
              format={formatNum}
            />
          </div>
        </div>
      ) : null}

      {data.settlement?.last7d ? (
        <div className={cn(growthPanelQuietClass, "p-5 sm:p-6")}>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className={growthKickerClass}>Settlement</p>
              <h3 className="mt-1 font-display text-lg font-semibold tracking-tight">
                Settled USDC only (not quoted 402s)
              </h3>
            </div>
            <span className={growthMonoChipClass}>
              Fail rate 7d: {(data.settlement.last7d.settleFailRate * 100).toFixed(1)}%
              {data.settlement.last1h?.aboveAlertThreshold ? " · alert 1h" : ""}
            </span>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <ProofStat
              label="Settled USD · 7d"
              numeric={data.settlement.last7d.settledUsd}
              format={formatUsd}
              hint={`${formatUsd(data.settlement.last24h?.settledUsd ?? 0)} last 24h`}
            />
            <ProofStat
              label="Paid settles · 7d"
              numeric={data.settlement.last7d.outcomes.paid}
              format={formatNum}
            />
            <ProofStat
              label="Settle failed · 7d"
              numeric={data.settlement.last7d.outcomes.settle_failed}
              format={formatNum}
              hint="Target under 5% of attempts"
            />
            <ProofStat
              label="402 challenges · 7d"
              numeric={data.settlement.last7d.outcomes.payment_required}
              format={formatNum}
            />
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-5">
        <div className={cn(growthTerminalFrameClass, "overflow-hidden lg:col-span-2")}>
          <div className={growthTerminalTitlebarClass}>
            <div className="flex items-center gap-2">
              <Wallet className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              <span className="text-xs font-medium tracking-tight text-foreground/85">
                Treasury
              </span>
            </div>
            <span className={growthMonoChipClass}>on-chain</span>
          </div>
          <div className="p-5 sm:p-6">
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
                numeric={data.lifetime.uniquePayingWallets}
                format={formatNum}
              />
              <ProofStat
                label="Avg / call"
                numeric={data.lifetime.avgUsdPerCall}
                format={(n) => `$${n.toFixed(4)}`}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-3">
          {data.byPath.length > 0 ? (
            <div className={cn(growthTerminalFrameClass, "overflow-hidden")}>
              <div className={growthTerminalTitlebarClass}>
                <span className="text-xs font-medium tracking-tight text-foreground/85">
                  Top endpoints
                </span>
                <span className={growthMonoChipClass}>by volume</span>
              </div>
              <ul className="space-y-0 px-5 py-2 sm:px-6">
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
            <div className={cn(growthTerminalFrameClass, "overflow-hidden")}>
              <div className={growthTerminalTitlebarClass}>
                <span className="text-xs font-medium tracking-tight text-foreground/85">
                  Live feed
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <LiveDot />
                  Settled
                </span>
              </div>
              <ul className="space-y-0 px-5 py-2 sm:px-6">
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
                      <span className="text-muted-foreground"> · {call.payer ?? "-"}</span>
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
 * Public growth home, premium machine-money landing with live x402 proof.
 */
export default function GrowthHomePage() {
  const { data, isLoading, isError, error } = usePublicMetrics();
  useEffect(() => {
    document.title = "Syra · Machine Money for Agents";
    return () => {
      document.title = "Syra";
    };
  }, []);

  const paid7d = data?.northStar?.paidCallsLast7d ?? data?.last7d.calls ?? 0;
  const payers7d =
    data?.northStar?.uniquePayingWalletsLast7d ?? data?.last7d.uniquePayingWallets ?? 0;

  return (
    <div className={growthRootClass}>
      {/* Atmosphere: full-bleed plane framing the hero */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(96vh,880px)]"
        aria-hidden
      >
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 85% 50% at 50% -6%, hsl(var(--foreground) / 0.08), transparent 58%),
              radial-gradient(ellipse 40% 38% at 8% 32%, hsl(var(--foreground) / 0.04), transparent 52%),
              radial-gradient(ellipse 38% 34% at 92% 16%, hsl(var(--foreground) / 0.035), transparent 48%)
            `,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.2] motion-reduce:opacity-[0.1]"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--border) / 0.22) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--border) / 0.22) 1px, transparent 1px)
            `,
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(ellipse 78% 52% at 50% 6%, black 0%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 78% 52% at 50% 6%, black 0%, transparent 70%)",
          }}
        />
        <div className={cn(growthDividerClass, "absolute inset-x-0 bottom-0 opacity-55")} />
      </div>

      <div className={cn(growthShellClass, "relative pb-24 pt-10 sm:pb-32 sm:pt-14 lg:pt-16")}>
        {/* Hero: brand story + x402 handshake terminal */}
        <header className="grid items-center gap-12 lg:grid-cols-12 lg:gap-14 xl:gap-16">
          <div
            className="flex flex-col items-center text-center lg:col-span-6 lg:items-start lg:text-left xl:col-span-6"
          >
            <div className="relative mb-7 sm:mb-8">
              <div
                className="absolute -inset-7 rounded-[2rem] bg-foreground/[0.045] blur-2xl motion-reduce:hidden"
                aria-hidden
              />
              <div
                className={cn(
                  "relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl sm:h-[4.75rem] sm:w-[4.75rem]",
                  "border border-border/50 bg-gradient-to-br from-card via-card to-muted/40",
                  "shadow-[0_1px_0_0_hsl(var(--border)/0.5)_inset,0_24px_48px_-28px_rgba(0,0,0,0.7)]",
                  "ring-1 ring-inset ring-white/[0.04]",
                )}
              >
                <img
                  src="/logo.jpg"
                  alt=""
                  width={76}
                  height={76}
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              </div>
            </div>

            <div className="mb-4 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              <p className={cn(growthEyebrowClass, "before:hidden sm:before:block")}>
                <span className="gradient-text font-semibold tracking-[0.32em]">Syra</span>
              </p>
              <span className={growthMonoChipClass}>agent → 402 → settled</span>
            </div>

            <h1 className="max-w-[16ch] text-balance font-display text-[2.65rem] font-semibold leading-[1.02] tracking-[-0.055em] text-foreground sm:text-5xl md:text-[3.75rem] md:leading-[0.98] lg:max-w-none">
              <TextReveal
                as="span"
                className="gradient-text block"
                text={SYRA_TAGLINE}
                split="word"
                stagger={0.06}
              />
            </h1>

            <p className={cn(growthProseClass, "mt-5 max-w-md text-pretty lg:max-w-lg")}>
              Earn · Treasury · Invest · Spend · Grow on Solana.
              <span className="mt-1.5 block text-foreground/80">{SYRA_LIVE_SUBLINE}.</span>
              <span className="mt-2 block text-sm text-muted-foreground">{SYRA_OUTCOMES_SUBLINE}</span>
            </p>

            <div className="mt-9 flex w-full max-w-md flex-col gap-3 sm:max-w-none">
              <Magnetic className="w-full sm:w-auto sm:self-start">
                <Link
                  to="/marketplace"
                  className={cn(growthCtaPrimaryClass, "w-full sm:w-auto sm:self-start")}
                >
                  First paid call in 5 minutes
                  <ArrowRight className="h-4 w-4 opacity-90" aria-hidden />
                </Link>
              </Magnetic>
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-start">
                <Magnetic className="w-full sm:w-auto">
                  <Link
                    to="/lp-experiment"
                    className={cn(
                      growthCtaSecondaryClass,
                      "w-full border-border/55 bg-background/50 sm:w-auto",
                    )}
                  >
                    LP Autopilot lab
                    <ArrowUpRight className="h-4 w-4 opacity-80" aria-hidden />
                  </Link>
                </Magnetic>
                <SyraBuyButton
                  variant="default"
                  className={cn(
                    growthCtaSecondaryClass,
                    "w-full border-border/55 bg-background/50 sm:w-auto",
                  )}
                  label="Buy $SYRA"
                />
              </div>
            </div>

            <p className="mt-4 text-sm text-muted-foreground/85">
              Or{" "}
              <Link
                to="/agent"
                className="font-medium text-foreground/90 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                open the reference agent
              </Link>
            </p>
          </div>

          <div
            className="flex flex-col gap-5 lg:col-span-6 xl:col-span-6"
            aria-live="polite"
          >
            <GrowthX402Flow
              avgUsdPerCall={data?.lifetime.avgUsdPerCall ?? null}
              paid7d={data ? paid7d : null}
              payers7d={data ? payers7d : null}
              settledUsd={data?.lifetime.totalUsdSettled ?? null}
              isLoading={isLoading}
              isError={isError}
              errorMessage={error instanceof Error ? error.message : null}
            />
            <GrowthTrustRankings className="mx-0 max-w-none" />
          </div>
        </header>

        {/* How it works: connected agent pipeline */}
        <ScrollReveal>
        <section
          className="mt-24 sm:mt-32"
          aria-labelledby="how-heading"
        >
          <div className="mb-10 flex flex-col gap-4 sm:mb-12 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
            <div className="max-w-2xl">
              <p className={cn(growthEyebrowClass, "mb-3")}>Path</p>
              <h2 id="how-heading" className={growthSectionTitleClass}>
                From install to capital
              </h2>
            </div>
            <p className={cn(growthProseClass, "max-w-md lg:text-right")}>
              Same three steps as the marketplace Integrate tab, settle your first paid call, then expand.
            </p>
          </div>

          <ol className="relative grid gap-px overflow-hidden rounded-2xl border border-border/40 bg-border/25 lg:grid-cols-3">
            {/* Hairline through column centers; icons punch through via ring shadow */}
            <div
              className="pointer-events-none absolute inset-x-[16.66%] top-[3.25rem] z-[1] hidden h-px lg:block xl:top-[3.75rem]"
              aria-hidden
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-border/70 to-transparent" />
            </div>

            {HOW_STEPS.map(({ n, title, body, href, external, icon: Icon, chip }, stepIndex) => {
              const className = cn(
                "group min-h-[15rem] p-7 sm:p-8 xl:p-10",
                growthTileClass,
              );
              const inner = (
                <>
                  <div className="mb-6 flex flex-col gap-5 sm:mb-8 lg:items-center">
                    <span className="relative z-[2] flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-card text-foreground/70 shadow-[0_0_0_6px_hsl(var(--card))] transition-colors group-hover:border-border/65 group-hover:bg-muted group-hover:text-foreground group-hover:shadow-[0_0_0_6px_hsl(var(--muted))]">
                      <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                    </span>
                    <div className="flex w-full items-center gap-2.5">
                      <span className="font-mono text-[11px] font-medium tracking-[0.22em] text-muted-foreground">
                        {n}
                      </span>
                      {stepIndex < HOW_STEPS.length - 1 ? (
                        <span
                          className="hidden h-px w-6 bg-border/60 sm:block lg:hidden"
                          aria-hidden
                        />
                      ) : null}
                    </div>
                  </div>
                  <span className={cn(growthMonoChipClass, "mb-3 w-fit")}>{chip}</span>
                  <h3 className="font-display text-lg font-semibold tracking-[-0.03em] text-foreground">
                    {title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-[1.7] text-foreground/70">
                    {body}
                  </p>
                  <span className="mt-8 inline-flex items-center gap-1.5 text-xs font-medium text-foreground/85 transition-colors group-hover:text-foreground">
                    Continue
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </>
              );
              return (
                <li key={n} className="min-h-0">
                  <TiltCard className="h-full rounded-none" max={8}>
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
                  </TiltCard>
                </li>
              );
            })}
          </ol>
        </section>
        </ScrollReveal>

        {/* Reviews */}
        <ScrollReveal className="mt-24 sm:mt-32">
          <GrowthTestimonials />
        </ScrollReveal>

        {/* Metrics */}
        <ScrollReveal>
        <section
          id="metrics"
          className="mt-24 scroll-mt-24 sm:mt-32"
          aria-labelledby="metrics-heading"
        >
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6 sm:mb-12">
            <div className="max-w-2xl">
              <p className={cn(growthEyebrowClass, "mb-3")}>On-chain verifiable</p>
              <h2 id="metrics-heading" className={growthSectionTitleClass}>
                Public proof
              </h2>
              <p className={cn(growthProseClass, "mt-3 max-w-xl")}>
                Paid volume, unique payers, and activation, the traction line for machine money.
              </p>
            </div>
            <a
              href="https://api.syraa.fun/api/metrics"
              className={cn(
                growthCtaSecondaryClass,
                "h-11 min-h-11 gap-1.5 px-4 text-xs font-medium",
              )}
              target="_blank"
              rel="noreferrer"
            >
              JSON API
              <ExternalLink className="h-3.5 w-3.5 opacity-60" aria-hidden />
            </a>
          </div>

          <div className={cn(growthPanelClass, "p-5 sm:p-8 lg:p-10")}>
            {isLoading && !data ? <BoneFallback name="growth-metrics" /> : null}
            {isError && !data ? (
              <p className="text-sm text-destructive">
                {error instanceof Error ? error.message : "Failed to load metrics"}
              </p>
            ) : null}
            {data ? (
              <MetricsBody data={data} paid7d={paid7d} payers7d={payers7d} />
            ) : null}
          </div>
        </section>
        </ScrollReveal>

        {/* Token */}
        <ScrollReveal className="mt-24 sm:mt-32">
          <GrowthTokenSection />
        </ScrollReveal>

        {/* Close CTA band */}
        <ScrollReveal>
        <section
          className="mt-24 sm:mt-32"
          aria-labelledby="close-heading"
        >
          <div
            className={cn(
              growthPanelClass,
              "relative overflow-hidden px-6 py-12 sm:px-12 sm:py-16 lg:px-16 lg:py-20",
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
              className="pointer-events-none absolute inset-0 opacity-[0.16] motion-reduce:opacity-[0.08]"
              aria-hidden
              style={{
                backgroundImage: `
                  linear-gradient(to right, hsl(var(--border) / 0.25) 1px, transparent 1px),
                  linear-gradient(to bottom, hsl(var(--border) / 0.25) 1px, transparent 1px)
                `,
                backgroundSize: "56px 56px",
                maskImage:
                  "radial-gradient(ellipse 75% 70% at 40% 40%, black 0%, transparent 78%)",
                WebkitMaskImage:
                  "radial-gradient(ellipse 75% 70% at 40% 40%, black 0%, transparent 78%)",
              }}
            />

            <div className="relative flex flex-col gap-12 lg:flex-row lg:items-end lg:justify-between lg:gap-20">
              <div className="max-w-2xl">
                <p className={cn(growthEyebrowClass, "mb-4")}>Activate</p>
                <h2
                  id="close-heading"
                  className="text-balance font-display text-[2rem] font-semibold leading-[1.06] tracking-[-0.05em] text-foreground sm:text-[2.6rem] lg:text-[3rem]"
                >
                  Ship the call.
                  <span className="mt-1.5 block text-foreground/50">Then hold the token.</span>
                </h2>
                <p className={cn(growthProseClass, "mt-5 max-w-lg text-pretty")}>
                  Builders activate on MCP and the marketplace. Token interest follows real usage, not the other way around.
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[17rem]">
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
                <p className="pt-1 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground/60 sm:text-left">
                  First paid call · ~5 min
                </p>
              </div>
            </div>
          </div>
        </section>
        </ScrollReveal>
      </div>

      <GrowthFooter />
    </div>
  );
}
