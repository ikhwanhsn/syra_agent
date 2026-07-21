"use client";

import type { ReactNode } from "react";
import { Link } from "@/lib/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Mail, type LucideIcon } from "lucide-react";
import { GrowthFooter } from "@/components/growth/GrowthFooter";
import { EMAIL_SUPPORT } from "@/lib/marketing/global";
import { cn } from "@/lib/utils";
import {
  growthDividerClass,
  growthKickerClass,
  growthPanelClass,
  growthPanelQuietClass,
  growthProseClass,
  growthRootClass,
  growthSectionTitleClass,
} from "@/components/growth/growthHomeStyles";
import { PLAYGROUND_CONTENT_SHELL } from "@/components/playground/playgroundStyles";

export type LegalSection = {
  id: string;
  title: string;
  body: ReactNode;
};

export type LegalDocMeta = {
  path: string;
  label: string;
};

const LEGAL_DOCS: LegalDocMeta[] = [
  { path: "/privacy", label: "Privacy" },
  { path: "/terms", label: "Terms" },
  { path: "/cookies", label: "Cookies" },
];

type LegalDocumentLayoutProps = {
  icon: LucideIcon;
  kicker: string;
  title: string;
  updated: string;
  summary: string;
  currentPath: string;
  sections: LegalSection[];
};

export function LegalDocumentLayout({
  icon: Icon,
  kicker,
  title,
  updated,
  summary,
  currentPath,
  sections,
}: LegalDocumentLayoutProps) {
  const reduceMotion = useReducedMotion();
  const enter = reduceMotion
    ? { initial: false as const, animate: { opacity: 1 } }
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <div className={cn(growthRootClass, "flex flex-col")}>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] opacity-90"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% -10%, hsl(var(--foreground) / 0.06), transparent 62%), radial-gradient(ellipse 40% 30% at 90% 8%, hsl(var(--primary) / 0.08), transparent 55%)",
        }}
        aria-hidden
      />

      <main className="relative z-10 flex-1 pb-6 pt-8 sm:pt-10">
        <div className={PLAYGROUND_CONTENT_SHELL}>
          <motion.div {...enter}>
            <Link
              to="/"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to home
            </Link>

            <header className="mt-8 sm:mt-10">
              <div className="flex flex-wrap items-start gap-5">
                <div
                  className={cn(
                    "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
                    "border border-border/50 bg-card/60 shadow-[0_12px_40px_-28px_rgba(0,0,0,0.65)] backdrop-blur-md",
                  )}
                >
                  <Icon className="h-6 w-6 text-foreground/85" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={growthKickerClass}>{kicker}</p>
                  <h1 className={cn(growthSectionTitleClass, "mt-2 text-balance")}>{title}</h1>
                  <p className="mt-2 font-mono text-[11px] tracking-wide text-muted-foreground/70">
                    Last updated · {updated}
                  </p>
                </div>
              </div>

              <p className={cn(growthProseClass, "mt-6 max-w-2xl text-pretty")}>{summary}</p>

              <nav
                aria-label="Legal documents"
                className="mt-8 flex flex-wrap gap-2"
              >
                {LEGAL_DOCS.map((doc) => {
                  const active = doc.path === currentPath;
                  return (
                    <Link
                      key={doc.path}
                      to={doc.path}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "inline-flex h-10 min-h-10 items-center rounded-full px-4 text-sm font-medium transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        active
                          ? "bg-foreground text-background"
                          : "border border-border/50 bg-card/40 text-muted-foreground hover:border-border/80 hover:bg-card/70 hover:text-foreground",
                      )}
                    >
                      {doc.label}
                    </Link>
                  );
                })}
              </nav>
            </header>

            <div className={cn(growthDividerClass, "my-10 sm:my-12")} />

            <div className="grid gap-10 lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-14 xl:grid-cols-[12rem_minmax(0,1fr)]">
              <aside className="hidden lg:block">
                <div className="sticky top-[calc(var(--syra-global-nav-height,3.5rem)+1.25rem)]">
                  <p className={cn(growthKickerClass, "mb-4")}>On this page</p>
                  <nav aria-label="Table of contents" className="flex flex-col gap-1">
                    {sections.map((section, i) => (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        className={cn(
                          "rounded-lg px-2.5 py-2 text-[13px] leading-snug text-muted-foreground",
                          "transition-colors hover:bg-card/60 hover:text-foreground",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        )}
                      >
                        <span className="mr-2 font-mono text-[10px] text-muted-foreground/55">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {section.title}
                      </a>
                    ))}
                  </nav>
                </div>
              </aside>

              <div className={cn(growthPanelClass, "p-6 sm:p-8 lg:p-10")}>
                <article className="max-w-none">
                  {sections.map((section, i) => (
                    <section
                      key={section.id}
                      id={section.id}
                      className={cn(
                        "scroll-mt-[calc(var(--syra-global-nav-height,3.5rem)+1.25rem)]",
                        i > 0 && "mt-10 border-t border-border/35 pt-10 sm:mt-12 sm:pt-12",
                      )}
                    >
                      <div className="flex items-baseline gap-3">
                        <span className="font-mono text-[11px] font-medium tracking-[0.14em] text-muted-foreground/55">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <h2 className="font-display text-lg font-semibold tracking-[-0.03em] text-foreground sm:text-xl">
                          {section.title}
                        </h2>
                      </div>
                      <div className={cn(growthProseClass, "mt-4 space-y-4 [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:decoration-border [&_a]:transition-colors hover:[&_a]:decoration-foreground [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2.5 [&_ul]:pl-5")}>
                        {section.body}
                      </div>
                    </section>
                  ))}
                </article>
              </div>
            </div>

            <div className={cn(growthPanelQuietClass, "mt-10 p-6 sm:mt-12 sm:p-8")}>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-md">
                  <p className={growthKickerClass}>Questions</p>
                  <p className="mt-2 font-display text-lg font-semibold tracking-[-0.03em] text-foreground">
                    Need help with this policy?
                  </p>
                  <p className={cn(growthProseClass, "mt-2 text-[14px] sm:text-[15px]")}>
                    Reach the Syra team — we respond to privacy, terms, and cookie requests at the address below.
                  </p>
                </div>
                <a
                  href={`mailto:${EMAIL_SUPPORT}`}
                  className={cn(
                    "inline-flex h-12 min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-border/55 px-5",
                    "bg-background/50 text-sm font-semibold text-foreground backdrop-blur-md",
                    "transition-[border-color,background-color,transform] duration-200",
                    "hover:border-border/80 hover:bg-card/70",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    "active:scale-[0.98]",
                  )}
                >
                  <Mail className="h-4 w-4" aria-hidden />
                  {EMAIL_SUPPORT}
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <GrowthFooter />
    </div>
  );
}
