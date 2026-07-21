"use client";

import { Link } from "@/lib/navigation";
import { ArrowUpRight, Mail } from "lucide-react";
import { SYRA_META_DESCRIPTION, SYRA_TAGLINE } from "@/lib/syraBranding";
import { SYRA_TOKEN_PAGE_PATH } from "@/content/syraFocus";
import { cn } from "@/lib/utils";
import {
  growthDividerClass,
  growthKickerClass,
} from "@/components/growth/growthHomeStyles";
import { PLAYGROUND_CONTENT_SHELL } from "@/components/playground/playgroundStyles";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Marketplace", href: "/marketplace" },
      { label: "Agent", href: "/agent" },
      { label: "Documentation", href: "https://docs.syraa.fun", external: true },
    ],
  },
  {
    title: "Capital",
    links: [
      { label: "$SYRA token", href: SYRA_TOKEN_PAGE_PATH },
      { label: "Stake", href: "/staking" },
      { label: "Swap", href: "/swap" },
      { label: "About", href: "/about" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Articles", href: "/articles" },
      { label: "Identity", href: "/identity" },
      { label: "X / Twitter", href: "https://x.com/syra_agent", external: true },
      { label: "Telegram", href: "https://t.me/syra_ai", external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Cookies", href: "/cookies" },
      { label: "support@syraa.fun", href: "mailto:support@syraa.fun", external: true },
    ],
  },
] as const;

/**
 * Premium site footer for the growth home — editorial, not marketing-glass CTA block.
 */
export function GrowthFooter() {
  return (
    <footer className="relative mt-8 border-t border-border/40 bg-background">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-40 opacity-80"
        style={{
          background:
            "radial-gradient(ellipse 70% 80% at 50% 0%, hsl(var(--foreground) / 0.04), transparent 70%)",
        }}
        aria-hidden
      />

      <div className={cn(PLAYGROUND_CONTENT_SHELL, "relative pb-10 pt-14 sm:pb-12 sm:pt-16")}>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)] lg:gap-16">
          <div className="max-w-sm">
            <Link
              to="/"
              className="inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <img
                src="/logo.jpg"
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 rounded-xl object-cover ring-1 ring-border/50"
                draggable={false}
              />
              <span className="font-display text-lg font-semibold tracking-tight">
                <span className="gradient-text">Syra</span>
              </span>
            </Link>
            <p className={cn(growthKickerClass, "mt-5")}>{SYRA_TAGLINE}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {SYRA_META_DESCRIPTION}
            </p>
            <a
              href="mailto:support@syraa.fun"
              className="mt-6 inline-flex h-10 min-h-10 items-center gap-2 rounded-xl border border-border/45 bg-card/40 px-3.5 text-xs font-medium text-muted-foreground transition-colors hover:border-border/70 hover:text-foreground"
            >
              <Mail className="h-3.5 w-3.5" aria-hidden />
              Contact
            </a>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 sm:gap-6">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className={cn(growthKickerClass, "mb-4")}>{col.title}</h3>
                <ul className="space-y-2.5">
                  {col.links.map((link) => {
                    const className =
                      "group inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground";
                    if ("external" in link && link.external) {
                      const isMail = link.href.startsWith("mailto:");
                      return (
                        <li key={link.label}>
                          <a
                            href={link.href}
                            {...(isMail
                              ? {}
                              : { target: "_blank", rel: "noopener noreferrer" })}
                            className={className}
                          >
                            {link.label}
                            {!isMail ? (
                              <ArrowUpRight
                                className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60"
                                aria-hidden
                              />
                            ) : null}
                          </a>
                        </li>
                      );
                    }
                    return (
                      <li key={link.label}>
                        <Link to={link.href} className={className}>
                          {link.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className={cn(growthDividerClass, "my-10 opacity-70")} />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground/80">
            © {new Date().getFullYear()} Syra · Machine Money for Agents
          </p>
          <p className="text-xs text-muted-foreground/65">
            Not financial advice. On-chain activity carries risk.
          </p>
        </div>
      </div>
    </footer>
  );
}
