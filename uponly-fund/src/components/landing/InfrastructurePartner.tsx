import { useReducedMotion, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LINK_AGENT, LINK_DOCS } from "../../../config/global";
import { cn } from "@/lib/utils";

const SYRA = "https://www.syraa.fun/" as const;

type InfrastructurePartnerProps = {
  className?: string;
};

/**
 * Syra is positioned as infrastructure — not the brand hero of the app.
 * Layout is stacked (no side-by-side text + actions on md) so copy never collapses to a narrow column.
 */
export function InfrastructurePartner({ className }: InfrastructurePartnerProps) {
  const reduceMotion = useReducedMotion() ?? false;
  return (
    <motion.section
      {...(reduceMotion
        ? {}
        : { initial: { opacity: 0, y: 12 }, whileInView: { opacity: 1, y: 0 } })}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "mb-20 w-full min-w-0 max-w-full rounded-2xl border border-dashed border-border/60 bg-gradient-to-b from-card/35 to-card/10 p-5 sm:mb-24 sm:p-8",
        className,
      )}
      aria-labelledby="infra-partner-title"
    >
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Behind the product
      </p>
      <h2
        id="infra-partner-title"
        className="mt-2 w-full min-w-0 max-w-3xl font-display text-lg font-semibold tracking-tight text-foreground sm:text-xl"
      >
        Infrastructure from Syra
      </h2>
      <p
        className="mt-3 w-full min-w-0 max-w-3xl text-pretty text-sm leading-relaxed text-muted-foreground sm:mt-4 sm:text-base sm:leading-relaxed [overflow-wrap:anywhere] [hyphens:none]"
        style={{ wordBreak: "normal" }}
      >
        APIs, the agent, and the execution discipline are powered by the Syra stack. Up Only Fund is a distinct
        program; Syra is the support layer—think of it as the rails, not the logo on the cover.
      </p>

      <ul
        className="mt-6 grid w-full min-w-0 list-none grid-cols-2 gap-2 p-0 sm:mt-7 sm:gap-2.5 lg:grid-cols-4"
        aria-label="Syra and program links"
      >
        <li className="min-w-0">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-10 w-full min-w-0 rounded-lg border-border/50 bg-background/40"
          >
            <a
              href={SYRA}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-1.5 px-2"
            >
              Syra
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
            </a>
          </Button>
        </li>
        <li className="min-w-0">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-10 w-full min-w-0 rounded-lg border-border/50 bg-background/30"
          >
            <a
              href={LINK_DOCS}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-1.5 px-2"
            >
              API docs
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
            </a>
          </Button>
        </li>
        <li className="min-w-0">
          <Button
            asChild
            size="sm"
            className="h-10 w-full min-w-0 rounded-lg border-0 bg-foreground text-background hover:bg-foreground/90"
          >
            <a
              href={LINK_AGENT}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center"
            >
              Open agent
            </a>
          </Button>
        </li>
        <li className="min-w-0">
          <Button asChild variant="secondary" size="sm" className="h-10 w-full min-w-0 rounded-lg">
            <Link to="/uponly/rise" className="inline-flex w-full items-center justify-center">
              RISE tools
            </Link>
          </Button>
        </li>
      </ul>
    </motion.section>
  );
}
