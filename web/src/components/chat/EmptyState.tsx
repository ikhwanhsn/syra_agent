"use client";

import { Link } from "@/lib/navigation";
import { ArrowUpRight, BookOpen, Plug, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  agentName?: string;
}

const RESOURCE_LINKS = [
  { href: "/marketplace", label: "APIs / Integrate", icon: Terminal, external: false },
  {
    href: "https://docs.syraa.fun/docs/build/mcp",
    label: "Install MCP",
    icon: Plug,
    external: true,
  },
  { href: "https://docs.syraa.fun", label: "Documentation", icon: BookOpen, external: true },
] as const;

const chipClass = cn(
  "group inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/40 px-3.5 py-2",
  "text-[12.5px] font-medium text-muted-foreground/80 backdrop-blur-md",
  "transition-[border-color,background-color,color,box-shadow] duration-200",
  "hover:border-border/80 hover:bg-card/50 hover:text-foreground hover:shadow-[0_4px_20px_-10px_rgba(0,0,0,0.35)]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
);

export function EmptyState({ agentName = "Syra Agent" }: EmptyStateProps) {
  return (
    <div className="relative flex min-h-full w-full flex-col items-center justify-center overflow-hidden px-4 pb-28 pt-14 sm:px-6 sm:pb-32 sm:pt-16">
      <div
        className="pointer-events-none absolute left-1/2 top-[38%] h-[min(420px,55vw)] w-[min(420px,55vw)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--foreground) / 0.045) 0%, hsl(var(--foreground) / 0.015) 42%, transparent 72%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border) / 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border) / 0.12) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 70% 55% at 50% 42%, black 15%, transparent 72%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 55% at 50% 42%, black 15%, transparent 72%)",
        }}
        aria-hidden
      />

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center text-center">
        <div
          className="animate-in fade-in zoom-in-95 fill-mode-both duration-500"
          style={{ animationDelay: "0ms" }}
        >
          <div className="relative mx-auto mb-6 h-[3.75rem] w-[3.75rem] sm:h-16 sm:w-16">
            <div
              className="absolute inset-0 rounded-[1.15rem] bg-foreground/[0.06] blur-xl sm:rounded-[1.25rem]"
              aria-hidden
            />
            <div
              className={cn(
                "relative flex h-full w-full items-center justify-center overflow-hidden rounded-[1.15rem] sm:rounded-[1.25rem]",
                "border border-border/55 bg-gradient-to-br from-card via-card/95 to-muted/35",
                "shadow-[0_8px_32px_-12px_rgba(0,0,0,0.28),inset_0_1px_0_0_rgba(255,255,255,0.06)]",
                "ring-1 ring-inset ring-white/[0.05]",
              )}
            >
              <img
                src="/logo.jpg"
                alt="Syra"
                className="h-full w-full object-cover"
                draggable={false}
              />
            </div>
          </div>
        </div>

        <p
          className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/55 duration-500"
          style={{ animationDelay: "60ms" }}
        >
          {agentName}
        </p>

        <h1
          className={cn(
            "animate-in fade-in slide-in-from-bottom-2 fill-mode-both text-balance duration-500",
            "mt-3 text-[1.75rem] font-semibold tracking-[-0.035em] text-foreground sm:text-[2.125rem]",
          )}
          style={{ animationDelay: "100ms" }}
        >
          How can I help you today?
        </h1>

        <p
          className={cn(
            "animate-in fade-in slide-in-from-bottom-2 fill-mode-both text-pretty duration-500",
            "mt-3 max-w-[21rem] text-[15px] leading-[1.55] text-muted-foreground/80 sm:max-w-md sm:text-[15.5px]",
          )}
          style={{ animationDelay: "140ms" }}
        >
          Markets, Solana, and machine money for agents — ask anything or pick a suggestion below.
        </p>

        <div
          className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both mt-8 flex flex-wrap items-center justify-center gap-2 duration-500"
          style={{ animationDelay: "180ms" }}
        >
          {RESOURCE_LINKS.map(({ href, label, icon: Icon, external }, index) => (
            <Link
              key={href}
              to={href}
              {...(external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className={cn(
                chipClass,
                index === 0 &&
                  "border-primary/35 bg-primary/8 text-primary hover:border-primary/50 hover:bg-primary/12 hover:text-primary",
              )}
            >
              <Icon
                className={cn(
                  "h-3.5 w-3.5 transition-colors",
                  index === 0 ? "opacity-80" : "text-muted-foreground/60 group-hover:text-foreground/70",
                )}
                strokeWidth={2}
                aria-hidden
              />
              {label}
              <ArrowUpRight
                className="h-3 w-3 text-muted-foreground/40 transition-[color,transform] duration-200 group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-muted-foreground/70"
                strokeWidth={2}
                aria-hidden
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
