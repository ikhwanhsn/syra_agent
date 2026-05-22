import { motion, useReducedMotion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FUND_PORTFOLIO } from "@/data/fundPortfolio";
import { cn } from "@/lib/utils";
import { landingViewport, staggerContainer, staggerItemSm } from "./landingMotion";

type PortfolioSectionProps = {
  className?: string;
};

const STATUS_LABEL: Record<(typeof FUND_PORTFOLIO)[number]["status"], string> = {
  active: "Active",
  exited: "Exited",
};

export function PortfolioSection({ className }: PortfolioSectionProps) {
  const reduce = useReducedMotion() ?? false;

  return (
    <section
      id="portfolio"
      className={cn("scroll-mt-28", className)}
      aria-labelledby="uof-portfolio-heading"
    >
      <div className="max-w-2xl">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.28em] text-uof">Portfolio</p>
        <h2 id="uof-portfolio-heading" className="landing-section-title mt-3 text-foreground">
          Backed projects
        </h2>
        <p className="mt-4 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
          Teams and programs we have invested in across the Solana stack. We publish project context and thesis—not
          ticket size, marks, or returns.
        </p>
      </div>

      <motion.ul
        className="mt-10 grid gap-4 sm:grid-cols-2 lg:gap-5"
        variants={reduce ? undefined : staggerContainer}
        initial={reduce ? false : "hidden"}
        whileInView={reduce ? undefined : "show"}
        viewport={landingViewport}
      >
        {FUND_PORTFOLIO.map((company) => (
          <motion.li
            key={company.id}
            variants={reduce ? undefined : staggerItemSm}
            className="group relative overflow-hidden rounded-2xl border border-border/55 bg-gradient-to-b from-card/55 to-card/20 p-6 transition-colors hover:border-border/80 hover:bg-card/45 sm:p-7"
          >
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[radial-gradient(closest-side,hsl(var(--uof)/0.12),transparent)]"
              aria-hidden
            />
            <div className="relative z-10 flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                {company.logoUrl ? (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/50 bg-background/80 p-1.5">
                    <img
                      src={company.logoUrl}
                      alt=""
                      className="h-full w-full object-contain"
                      width={44}
                      height={44}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/60 font-display text-sm font-semibold text-foreground/80">
                    {company.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="truncate font-semibold tracking-tight text-foreground">{company.name}</h3>
                  <p className="mt-0.5 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    {company.category}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <Badge
                  variant="outline"
                  className="border-border/60 bg-background/40 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
                >
                  {STATUS_LABEL[company.status]}
                </Badge>
                {company.href ? (
                  <a
                    href={company.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 text-muted-foreground transition hover:border-foreground/20 hover:text-foreground"
                    aria-label={`Open ${company.name}`}
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                ) : null}
              </div>
            </div>
            <p className="relative z-10 mt-4 text-sm leading-relaxed text-muted-foreground">{company.thesis}</p>
            <p className="relative z-10 mt-4 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
              {company.network}
            </p>
          </motion.li>
        ))}
      </motion.ul>

      <p className="mt-8 text-xs leading-relaxed text-muted-foreground/90">
        Disclosure is limited to project identity and mandate fit. Capital deployed, weights, and performance are not
        published on this page. Confirm contracts and venue status on-chain before sizing exposure—DYOR.
      </p>
    </section>
  );
}
