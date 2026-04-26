import { useReducedMotion, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Building2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fadeUp, RISE_DOCS, SectionEyebrow } from "../primitives";
import { UP_ONLY_FUND } from "@/data/upOnlyFund";

type HeroSectionProps = {
  className?: string;
};

export function HeroSection({ className }: HeroSectionProps) {
  const reduceMotion = useReducedMotion() ?? false;
  return (
    <div className={cn("mb-10 sm:mb-14", className)}>
      <header {...fadeUp(reduceMotion)} aria-labelledby="uof-hero-heading">
        <Link
          to="/uponly"
          className="mb-6 inline-flex min-h-11 w-fit items-center gap-2 rounded-md py-1 pr-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:mb-7"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Up Only
        </Link>

        <div className="mb-5 flex flex-wrap items-center gap-2 sm:gap-3">
          <Badge
            variant="secondary"
            className="border border-border/50 bg-background/50 px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.18em] shadow-sm"
          >
            Syra × RISE ecosystem
          </Badge>
          <Badge
            variant="outline"
            className="border border-success/25 bg-success/[0.07] text-foreground/95 shadow-sm backdrop-blur"
          >
            <Building2 className="mr-1.5 h-3 w-3" aria-hidden />
            Treasury fund
          </Badge>
        </div>
        <SectionEyebrow>Transparent mandate</SectionEyebrow>
        <div className="mt-2 flex w-full min-w-0 flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
          <div className="min-w-0 w-full max-w-3xl flex-1 lg:min-w-[12rem]">
            <h1
              id="uof-hero-heading"
              className="text-balance break-words text-[1.375rem] font-bold leading-[1.15] tracking-[-0.02em] min-[380px]:text-2xl min-[480px]:text-3xl sm:text-4xl md:leading-[1.1] md:text-5xl"
            >
              <span className="neon-text">{UP_ONLY_FUND.name}</span>{" "}
              <span className="text-foreground/80">— backed by Syra</span>
            </h1>
            <p className="mt-3 max-w-2xl break-words text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
              {UP_ONLY_FUND.mandate}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Sparkles className="h-4 w-4 text-foreground/60" aria-hidden />
              <a
                href={RISE_DOCS.intro}
                className="text-sm font-medium text-foreground/90 underline-offset-2 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                RISE introduction
              </a>
            </div>
          </div>
          <div className="flex w-full min-w-0 flex-col items-stretch gap-3 sm:max-w-sm lg:w-auto lg:max-w-none lg:shrink-0 lg:items-end">
            <Button
              asChild
              className="h-11 w-full min-w-0 justify-center gap-2 min-[400px]:w-auto"
            >
              <a className="inline-flex items-center justify-center" href="#mandate">
                <span>Read mandate</span>
                <ArrowUpRight className="h-3.5 w-3.5 opacity-80" />
              </a>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="h-11 w-full min-w-0 justify-center gap-2 border border-border/60 bg-background/40 sm:w-auto"
            >
              <Link to="/uponly" className="inline-flex items-center justify-center">
                <span>Back to $UPONLY</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <motion.div {...fadeUp(reduceMotion)} className="h-px w-full scroll-mt-0" aria-hidden />
    </div>
  );
}
