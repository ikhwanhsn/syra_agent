"use client";

import { useCallback, useEffect, useState, type ReactNode, type RefObject } from "react";
import { Link } from "@/lib/navigation";
import { scrollInfoSection } from "@/lib/infoPageScroll";
import { ArrowUpRight } from "lucide-react";
import {
  SYRA_BUSINESS_STREAMS,
  SYRA_CAPABILITIES,
  SYRA_COMMUNITY_LINKS,
  SYRA_COMPETITION,
  SYRA_DIFFERENTIATION,
  SYRA_DISCLAIMER,
  SYRA_FOUNDER_FIT,
  SYRA_HIDDEN_ROUTES,
  SYRA_HIGHLIGHT,
  SYRA_INFO_EYEBROW,
  SYRA_INFO_SECTIONS,
  SYRA_MARKET,
  SYRA_MISSION,
  SYRA_MOAT,
  SYRA_MONOREPO_APPS,
  SYRA_PILLARS,
  SYRA_PLATFORMS,
  SYRA_PROBLEM,
  SYRA_PROBLEM_BULLETS,
  SYRA_PRODUCT_FLOW,
  SYRA_ROADMAP,
  SYRA_SOLUTION,
  SYRA_SOLUTION_BULLETS,
  SYRA_STACK_LAYERS,
  SYRA_STATS,
  SYRA_TAGLINE,
  SYRA_TRACTION,
  SYRA_VISION,
  SYRA_WHY_NOW,
  SYRA_WHY_SOLANA,
} from "@/content/syraInfo";
import { OverviewPageBackdrop } from "@/components/dashboard/overview/OverviewPageBackdrop";
import {
  overviewAccentBackground,
  overviewCardShell,
  overviewKickerClass,
  overviewMetricValueClass,
} from "@/components/dashboard/overview/overviewStyles";
import { cn } from "@/lib/utils";

function Section({
  id,
  title,
  children,
  className,
}: {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("scroll-mt-24", className)}>
      <h2 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-[14px] leading-[1.65] text-muted-foreground sm:text-[15px]", className)}>{children}</p>;
}

interface InfoPageViewProps {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
}

export function InfoPageView({ scrollContainerRef }: InfoPageViewProps) {
  const [activeSectionId, setActiveSectionId] = useState("overview");

  const onTocClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
      event.preventDefault();
      scrollInfoSection(scrollContainerRef.current, sectionId);
      setActiveSectionId(sectionId);
    },
    [scrollContainerRef],
  );

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash || !SYRA_INFO_SECTIONS.some((s) => s.id === hash)) return;
    const frame = window.requestAnimationFrame(() => {
      scrollInfoSection(scrollContainerRef.current, hash);
      setActiveSectionId(hash);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [scrollContainerRef]);

  return (
    <div className="relative w-full min-h-full bg-background">
      <OverviewPageBackdrop />

      <div className="relative z-[1] mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 pb-16 sm:px-6 sm:py-12 sm:pb-20 lg:flex-row lg:gap-12 lg:px-8">
        {/* Sticky TOC — desktop only */}
        <aside className="hidden lg:block lg:w-52 lg:shrink-0">
          <nav className="sticky top-8 space-y-1" aria-label="On this page">
            <p className={cn(overviewKickerClass, "mb-3")}>On this page</p>
            {SYRA_INFO_SECTIONS.map(({ id, title }) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={(event) => onTocClick(event, id)}
                aria-current={activeSectionId === id ? "true" : undefined}
                className={cn(
                  "block rounded-md border-l-2 px-2 py-1.5 text-[13px] transition-[color,background-color,border-color] duration-200",
                  activeSectionId === id
                    ? "border-foreground/70 bg-muted/50 font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border/60 hover:bg-muted/40 hover:text-foreground",
                )}
              >
                {title}
              </a>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 space-y-12 sm:space-y-14">
          {/* Hero */}
          <header id="overview" className={cn(overviewCardShell, "scroll-mt-24 rounded-3xl px-6 py-8 sm:px-8 sm:py-10")}>
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.5]"
              style={{ background: overviewAccentBackground("neutral") }}
              aria-hidden
            />
            <div className="relative">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80">
                {SYRA_INFO_EYEBROW}
              </p>
              <div className="mt-4 flex items-center gap-4">
                <img
                  src="/logo.jpg"
                  alt=""
                  className="h-12 w-12 rounded-xl border border-border/60 object-cover sm:h-14 sm:w-14"
                />
                <div>
                  <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    Syra
                  </h1>
                  <p className="mt-1 text-[15px] text-muted-foreground sm:text-base">{SYRA_TAGLINE}</p>
                </div>
              </div>
              <p className="mt-6 max-w-3xl text-[15px] leading-[1.7] text-foreground/90 sm:text-base">{SYRA_MISSION}</p>
              <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-muted-foreground">{SYRA_VISION}</p>
              <blockquote className="mt-6 border-l-2 border-primary/40 pl-4 font-display text-[15px] font-medium leading-snug text-foreground sm:text-base">
                {SYRA_HIGHLIGHT}
              </blockquote>
              <p className="mt-6 font-mono text-[11px] text-muted-foreground/70">
                Share this URL with your team:{" "}
                <span className="text-foreground/80">/info</span> — not listed in navigation or search.
              </p>
            </div>
          </header>

          <Section id="stats" title="At a glance">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
              {SYRA_STATS.map(({ label, value, detail }) => (
                <div key={label} className={cn(overviewCardShell, "rounded-2xl px-4 py-4")}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                    {label}
                  </p>
                  <p className={cn(overviewMetricValueClass, "mt-1 text-xl sm:text-2xl")}>{value}</p>
                  {detail ? <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{detail}</p> : null}
                </div>
              ))}
            </div>
          </Section>

          <Section id="problem" title="Problem">
            <div className={cn(overviewCardShell, "rounded-2xl px-5 py-6 sm:px-7")}>
              <h3 className="text-base font-semibold text-foreground">{SYRA_PROBLEM.title}</h3>
              {SYRA_PROBLEM.body.map((p) => (
                <Prose key={p.slice(0, 24)} className="mt-3">
                  {p}
                </Prose>
              ))}
              <ul className="mt-4 space-y-2">
                {SYRA_PROBLEM_BULLETS.map((bullet) => (
                  <li key={bullet} className="flex gap-2 text-[13px] leading-relaxed text-muted-foreground">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-foreground/40" aria-hidden />
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          </Section>

          <Section id="solution" title="Solution">
            <div className={cn(overviewCardShell, "rounded-2xl px-5 py-6 sm:px-7")}>
              <h3 className="text-base font-semibold text-foreground">{SYRA_SOLUTION.title}</h3>
              {SYRA_SOLUTION.body.map((p) => (
                <Prose key={p.slice(0, 24)} className="mt-3 text-foreground/85">
                  {p}
                </Prose>
              ))}
              <ul className="mt-4 space-y-2">
                {SYRA_SOLUTION_BULLETS.map((bullet) => (
                  <li key={bullet} className="flex gap-2 text-[13px] leading-relaxed text-muted-foreground">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary/60" aria-hidden />
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          </Section>

          <Section id="why-now" title={SYRA_WHY_NOW.title}>
            {SYRA_WHY_NOW.body.map((p) => (
              <Prose key={p.slice(0, 24)}>{p}</Prose>
            ))}
          </Section>

          <Section id="why-solana" title={SYRA_WHY_SOLANA.title}>
            {SYRA_WHY_SOLANA.body.map((p) => (
              <Prose key={p.slice(0, 24)}>{p}</Prose>
            ))}
          </Section>

          <Section id="product-flow" title="Product flow">
            <div className="grid gap-3 sm:grid-cols-3">
              {SYRA_PRODUCT_FLOW.map((step) => (
                <div key={step.step} className={cn(overviewCardShell, "rounded-2xl px-4 py-5")}>
                  <p className="font-mono text-xs text-muted-foreground/60">{step.step}</p>
                  <h3 className="mt-2 font-display text-base font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="pillars" title="Core pillars">
            <div className="grid gap-3 sm:grid-cols-2">
              {SYRA_PILLARS.map(({ icon: Icon, title, description }) => (
                <div key={title} className={cn(overviewCardShell, "rounded-2xl px-4 py-4")}>
                  <Icon className="h-4 w-4 text-foreground/70" strokeWidth={2} aria-hidden />
                  <h3 className="mt-3 text-[14px] font-semibold text-foreground">{title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="capabilities" title="What agents can do">
            <div className="grid gap-2 sm:grid-cols-2">
              {SYRA_CAPABILITIES.map(({ title, description }) => (
                <div key={title} className="rounded-xl border border-border/45 bg-card/35 px-4 py-3.5">
                  <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="differentiation" title="Differentiation">
            <div className={cn(overviewCardShell, "rounded-2xl px-5 py-6")}>
              <h3 className="font-display text-base font-semibold text-foreground">{SYRA_DIFFERENTIATION.headline}</h3>
              <Prose className="mt-3">{SYRA_DIFFERENTIATION.body}</Prose>
              <Prose className="mt-4 border-t border-border/50 pt-4">{SYRA_COMPETITION.body}</Prose>
            </div>
          </Section>

          <Section id="market" title="Market & revenue path">
            <Prose>{SYRA_MARKET.narrative}</Prose>
            <div className="grid gap-3 sm:grid-cols-3">
              {SYRA_MARKET.stats.map((stat) => (
                <div key={stat.label} className={cn(overviewCardShell, "rounded-2xl px-4 py-4")}>
                  <p className={cn(overviewMetricValueClass, "text-2xl")}>{stat.value}</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{stat.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.detail}</p>
                </div>
              ))}
            </div>
            <h3 className="pt-2 text-sm font-semibold text-foreground">Revenue streams</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {SYRA_BUSINESS_STREAMS.map((stream) => (
                <div key={stream.title} className="rounded-xl border border-border/45 px-4 py-3.5">
                  <h4 className="text-[13px] font-semibold text-foreground">{stream.title}</h4>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{stream.description}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="traction" title="Traction">
            <div className="grid gap-3 sm:grid-cols-2">
              {SYRA_TRACTION.map(({ title, description }) => (
                <div key={title} className={cn(overviewCardShell, "rounded-2xl px-4 py-4")}>
                  <h3 className="text-[14px] font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="roadmap" title="Roadmap">
            <div className="space-y-4">
              {SYRA_ROADMAP.map((quarter) => (
                <div key={quarter.period} className={cn(overviewCardShell, "rounded-2xl px-5 py-4")}>
                  <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground/70">
                    {quarter.period}
                  </p>
                  <ul className="mt-3 space-y-1.5">
                    {quarter.items.map((item) => (
                      <li key={item} className="flex gap-2 text-[13px] text-muted-foreground">
                        <span className="text-muted-foreground/50" aria-hidden>
                          —
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="text-[13px] text-muted-foreground">
              Investor slides:{" "}
              <a href="/deck" className="text-primary hover:underline">
                /deck
              </a>
            </p>
          </Section>

          <Section id="moat" title="Moat">
            <div className="overflow-hidden rounded-2xl border border-border/50">
              {SYRA_MOAT.map((row, index) => (
                <div
                  key={row.dimension}
                  className={cn(
                    "grid gap-1 border-b border-border/40 px-4 py-3.5 last:border-0 sm:grid-cols-[10rem_1fr] sm:gap-6",
                    index % 2 === 0 ? "bg-card/30" : "bg-transparent",
                  )}
                >
                  <p className="text-[13px] font-medium text-foreground/85">{row.dimension}</p>
                  <p className="text-[13px] leading-relaxed text-muted-foreground">{row.syra}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="stack" title="Tech stack">
            <div className="space-y-3">
              {SYRA_STACK_LAYERS.map((layer, index) => (
                <div
                  key={layer.label}
                  className={cn(overviewCardShell, "rounded-2xl px-5 py-4")}
                  style={{ marginLeft: `${Math.min(index * 8, 24)}px` }}
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">
                    {layer.label}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {layer.items.map((item) => (
                      <li key={item} className="text-[13px] text-muted-foreground">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          <Section id="platforms" title="Platforms & links">
            <div className="space-y-3">
              {SYRA_PLATFORMS.map(({ icon: Icon, name, description, href, external }) => {
                const inner = (
                  <>
                    <Icon className="h-4 w-4 shrink-0 text-foreground/70" strokeWidth={2} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[14px] font-semibold text-foreground">{name}</span>
                        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40" aria-hidden />
                      </div>
                      <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>
                    </div>
                  </>
                );
                const className = cn(
                  overviewCardShell,
                  "flex items-start gap-3 rounded-2xl px-4 py-3.5 transition-colors hover:border-border/75",
                );
                if (external) {
                  return (
                    <a key={name} href={href} target="_blank" rel="noopener noreferrer" className={className}>
                      {inner}
                    </a>
                  );
                }
                return (
                  <Link key={name} to={href} className={className}>
                    {inner}
                  </Link>
                );
              })}
            </div>
            <h3 className="pt-2 text-sm font-semibold text-foreground">Community</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {SYRA_COMMUNITY_LINKS.map(({ label, href, description }) => (
                <a
                  key={label}
                  href={href}
                  {...(href.startsWith("mailto:") ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                  className="rounded-xl border border-border/45 px-4 py-3 text-[13px] hover:border-border/70"
                >
                  <span className="font-medium text-foreground">{label}</span>
                  <span className="mt-0.5 block text-muted-foreground">{description}</span>
                </a>
              ))}
            </div>
          </Section>

          <Section id="monorepo" title="Monorepo map">
            <div className="overflow-hidden rounded-2xl border border-border/50">
              <div className="grid grid-cols-[minmax(6rem,8rem)_1fr_auto] gap-2 border-b border-border/50 bg-muted/30 px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                <span>Package</span>
                <span>Role</span>
                <span>URL</span>
              </div>
              {SYRA_MONOREPO_APPS.map((app) => (
                <div
                  key={app.package}
                  className="grid grid-cols-1 gap-1 border-b border-border/40 px-4 py-3 last:border-0 sm:grid-cols-[minmax(6rem,8rem)_1fr_auto] sm:items-center sm:gap-4"
                >
                  <code className="text-[12px] font-medium text-foreground">{app.package}</code>
                  <p className="text-[13px] text-muted-foreground">{app.role}</p>
                  {app.url ? (
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[12px] text-primary hover:underline sm:text-right"
                    >
                      {app.url.replace("https://", "")}
                    </a>
                  ) : (
                    <span className="text-[12px] text-muted-foreground/50 sm:text-right">—</span>
                  )}
                </div>
              ))}
            </div>
            <Prose>
              Public docs live in the <code className="text-xs bg-muted px-1 rounded">documentation</code> package.
              Marketing copy on <code className="text-xs bg-muted px-1 rounded">landing</code>.
            </Prose>
          </Section>

          <Section id="team" title="Team & founder–market fit">
            <h3 className="text-sm font-semibold text-foreground">{SYRA_FOUNDER_FIT.title}</h3>
            {SYRA_FOUNDER_FIT.body.map((p) => (
              <Prose key={p.slice(0, 24)}>{p}</Prose>
            ))}
            <ul className="list-disc space-y-1 pl-5 text-[13px] text-muted-foreground">
              <li>Full-time on Syra (2–5 builders)</li>
              <li>Bootstrapped — no external funding round to date</li>
              <li>Started 2025; live product in market</li>
            </ul>
          </Section>

          <Section id="internal-routes" title="Hidden routes (this app)">
            <div className="space-y-2">
              {SYRA_HIDDEN_ROUTES.map((route) => (
                <div
                  key={route.path}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-lg border border-border/45 px-4 py-3"
                >
                  <a href={route.path} className="font-mono text-sm text-primary hover:underline">
                    {route.path}
                  </a>
                  <span className="text-[13px] text-muted-foreground">{route.description}</span>
                </div>
              ))}
            </div>
            <Prose>
              Also: <Link to="/about" className="text-primary hover:underline">/about</Link> (in agent nav) is the
              public-facing overview; this page is the full internal brief.
            </Prose>
          </Section>

          <section id="disclaimer" className="scroll-mt-24 rounded-xl border border-border/40 bg-muted/15 px-4 py-4">
            <h2 className="text-sm font-semibold text-foreground">Disclaimer</h2>
            <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{SYRA_DISCLAIMER}</p>
          </section>
        </main>
      </div>
    </div>
  );
}
