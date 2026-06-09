import { motion, useReducedMotion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { FUND_PORTFOLIO } from "@/data/fundPortfolio";
import { cn } from "@/lib/utils";
import { LandingSectionHeader } from "./LandingSectionHeader";
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
      <LandingSectionHeader
        eyebrow="Portfolio"
        title="Backed projects"
        description="Teams and programs we have invested in across the Solana stack. We publish project context and thesis—not ticket size, marks, or returns."
        id="uof-portfolio-heading"
      />

      <motion.ul
        className="mt-12 grid gap-px overflow-hidden rounded-md border border-border/50 bg-border/40 sm:grid-cols-2"
        variants={reduce ? undefined : staggerContainer}
        initial={reduce ? false : "hidden"}
        whileInView={reduce ? undefined : "show"}
        viewport={landingViewport}
      >
        {FUND_PORTFOLIO.map((company) => (
          <motion.li
            key={company.id}
            variants={reduce ? undefined : staggerItemSm}
            className="group relative bg-card/50 p-7 transition-colors hover:bg-card/70 sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                {company.logoUrl ? (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/50 bg-background/80 p-2">
                    <img
                      src={company.logoUrl}
                      alt=""
                      className="h-full w-full object-contain"
                      width={48}
                      height={48}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border/50 bg-background/60 font-display text-sm font-semibold text-foreground/80">
                    {company.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="truncate font-medium tracking-tight text-foreground">{company.name}</h3>
                  <p className="mt-1 text-[0.65rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    {company.category}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {STATUS_LABEL[company.status]}
                </span>
                {company.href ? (
                  <a
                    href={company.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-border/50 text-muted-foreground transition hover:border-foreground/25 hover:text-foreground"
                    aria-label={`Open ${company.name}`}
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                ) : null}
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{company.thesis}</p>
            <p className="mt-4 text-[0.62rem] font-medium uppercase tracking-[0.16em] text-muted-foreground/75">
              {company.network}
            </p>
          </motion.li>
        ))}
      </motion.ul>

      <p className="mt-8 max-w-3xl text-xs leading-relaxed text-muted-foreground/90">
        Disclosure is limited to project identity and mandate fit. Capital deployed, weights, and performance are not
        published on this page. Confirm contracts and venue status on-chain before sizing exposure—DYOR.
      </p>
    </section>
  );
}
