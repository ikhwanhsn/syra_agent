"use client";

import { ArrowUpRight, Quote } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { SYRA_TESTIMONIALS } from "@/content/syraAbout";
import { cn } from "@/lib/utils";
import {
  growthKickerClass,
  growthProseClass,
  growthSectionTitleClass,
  growthStatValueClass,
} from "@/components/growth/growthHomeStyles";

/**
 * Social proof strip for growth home: three public reviews with source links.
 */
export function GrowthTestimonials({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();

  const container = reduceMotion
    ? undefined
    : {
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: 0.08, delayChildren: 0.06 },
        },
      };

  const item = reduceMotion
    ? undefined
    : {
        hidden: { opacity: 0, y: 12 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
        },
      };

  return (
    <section
      className={cn("relative", className)}
      aria-labelledby="reviews-heading"
    >
      <div className="mb-10 flex flex-col gap-4 sm:mb-12 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <div className="max-w-2xl">
          <p
            className={cn(
              growthKickerClass,
              "mb-3 inline-flex items-center gap-2.5 before:h-px before:w-6 before:bg-foreground/25",
            )}
          >
            Reviews
          </p>
          <h2 id="reviews-heading" className={growthSectionTitleClass}>
            Trusted by professionals
          </h2>
        </div>
        <p className={cn(growthProseClass, "max-w-md lg:text-right")}>
          Public notes from operators who stress-tested Syra on-chain. Open any card for the source on X.
        </p>
      </div>

      <motion.ul
        className="grid gap-px overflow-hidden rounded-2xl border border-border/40 bg-border/25 md:grid-cols-3"
        role="list"
        variants={container}
        initial={reduceMotion ? undefined : "hidden"}
        whileInView={reduceMotion ? undefined : "show"}
        viewport={reduceMotion ? undefined : { once: true, margin: "-80px" }}
      >
        {SYRA_TESTIMONIALS.map((testimonial) => (
          <motion.li key={testimonial.id} className="min-h-0" variants={item}>
            <a
              href={testimonial.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={testimonial.ariaLabel}
              className={cn(
                "group relative flex h-full min-h-[16.5rem] flex-col bg-background/92 p-6 sm:p-7",
                "transition-colors duration-200 hover:bg-card",
                "focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              <div className="mb-5 flex items-center justify-between gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/40 bg-muted/15 text-foreground/70 transition-colors group-hover:border-border/65 group-hover:text-foreground"
                  aria-hidden
                >
                  <Quote className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <ArrowUpRight
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 text-muted-foreground/55",
                    "transition-[transform,color] duration-200",
                    "group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground/75",
                  )}
                  aria-hidden
                />
              </div>

              <p className="flex-1 text-[15px] leading-[1.65] text-muted-foreground transition-colors group-hover:text-foreground/90">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              <div className="mt-6 flex items-center justify-between gap-3 border-t border-border/35 pt-4">
                <div className="flex min-w-0 items-center gap-3">
                  <img
                    src={testimonial.image}
                    alt=""
                    className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-border/50"
                    width={44}
                    height={44}
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold tracking-tight text-foreground">
                      {testimonial.author}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className={cn(growthStatValueClass, "text-sm")}>
                    {testimonial.metric}
                  </div>
                  <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
                    {testimonial.metricLabel}
                  </div>
                </div>
              </div>
            </a>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}
