"use client";

import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import {
  SYRA_SAID_BADGE_URL,
  SYRA_SAID_PROFILE_URL,
} from "@/content/syraAbout";
import { cn } from "@/lib/utils";

export function AboutSaidBadge({ className }: { className?: string }) {
  return (
    <a
      href={SYRA_SAID_PROFILE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        overviewCardShell,
        "group block overflow-hidden transition-colors hover:border-border/70",
        className,
      )}
      aria-label="View Syra on SAID Protocol — #1 verified agent"
    >
      <div className="flex flex-col gap-6 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-6 lg:p-7">
        <div className="min-w-0 space-y-3 sm:max-w-md">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/45 bg-muted/20">
              <ShieldCheck className="h-4 w-4 text-foreground/75" aria-hidden />
            </span>
            <p className={overviewKickerClass}>SAID Protocol</p>
          </div>
          <div className="space-y-2">
            <h2 className="text-balance text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              #1 verified agent on SAID
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Syra leads the SAID agent directory with on-chain verified identity — check our profile and
              reputation on Solana.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors group-hover:text-primary">
            View on saidprotocol.com
            <ArrowUpRight className="h-3.5 w-3.5 opacity-70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>

        <div className="flex shrink-0 justify-center sm:justify-end">
          <div className="rounded-xl border border-border/40 bg-background/40 p-3 shadow-sm transition-shadow group-hover:shadow-md sm:p-4">
            <img
              src={SYRA_SAID_BADGE_URL}
              alt="SAID Verified — Syra agent badge"
              width={348}
              height={120}
              className="h-auto w-full max-w-[min(100%,280px)] sm:max-w-[300px]"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </a>
  );
}
