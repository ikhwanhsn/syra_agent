import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BarChart3,
  LineChart,
  Shield,
  Terminal,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FUND_LANDING } from "@/data/fundLanding";
import { landingViewport } from "./landingMotion";

const features = [
  {
    icon: Terminal,
    title: "Market terminal",
    body: "Institutional screener with live tape, charts, and fund-grade overlays across Solana venues.",
  },
  {
    icon: BarChart3,
    title: "Market intelligence",
    body: "Watchlists, comparables, and floor scanners built for allocator workflows—not retail clicks.",
  },
  {
    icon: Activity,
    title: "Signals & flow",
    body: "Whale activity, agent signals, and news in one desk—gated where the mandate requires it.",
  },
  {
    icon: Wallet,
    title: "Portfolio view",
    body: "Treasury and position context wired to the same risk language as the fund landing.",
  },
  {
    icon: LineChart,
    title: "Simulators",
    body: "Quote, borrow, and DCA tooling to stress paths before capital moves on-chain.",
  },
  {
    icon: Shield,
    title: "Risk-first UX",
    body: "Disclosures and heuristics surface early—execution always remains wallet-controlled.",
  },
] as const;

type DashboardAccessSectionProps = {
  className?: string;
};

export function DashboardAccessSection({ className }: DashboardAccessSectionProps) {
  const reduce = useReducedMotion() ?? false;

  return (
    <section
      id="dashboard"
      className={cn("scroll-mt-28", className)}
      aria-labelledby="uof-dashboard-heading"
    >
      <div className="landing-dashboard-panel relative overflow-hidden rounded-[1.35rem] border border-border/50">
        <div
          className="pointer-events-none absolute inset-0 uof-hero-mesh opacity-50"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-uof via-uof/60 to-transparent"
          aria-hidden
        />
        <div className="relative z-10 grid gap-10 p-8 sm:p-10 md:grid-cols-12 md:gap-12 md:p-14 lg:p-16">
          <motion.div
            className="md:col-span-5"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={landingViewport}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.28em] text-uof">
              Command dashboard
            </p>
            <h2
              id="uof-dashboard-heading"
              className="landing-section-title mt-3 text-foreground"
            >
              The same desk our team runs every day
            </h2>
            <p className="mt-5 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
              Up Only Fund&apos;s operating terminal stays live—market discovery, simulators, and
              intelligence layers purpose-built for Solana allocators. Open the dashboard to
              diligence like the fund, not like a tourist.
            </p>
            <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-lg bg-uof !text-[hsl(var(--uof-foreground))] px-8 font-semibold shadow-[0_10px_36px_-8px_hsl(var(--uof)/0.5)] hover:bg-uof/92"
              >
                <Link to="/terminal" className="inline-flex items-center gap-2">
                  {FUND_LANDING.dashboardCta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 rounded-lg border-border/60 bg-background/40 px-8 font-medium backdrop-blur-sm hover:bg-background/70"
              >
                <Link to="/overview">Markets overview</Link>
              </Button>
            </div>
          </motion.div>

          <div className="grid gap-3 sm:grid-cols-2 md:col-span-7 md:gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={landingViewport}
                transition={{
                  duration: 0.45,
                  delay: reduce ? 0 : i * 0.06,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="rounded-xl border border-border/45 bg-background/35 p-5 backdrop-blur-sm"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 bg-card/50">
                  <f.icon className="h-4 w-4 text-uof" aria-hidden />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
