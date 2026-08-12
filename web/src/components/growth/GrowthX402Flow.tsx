"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  growthKickerClass,
  growthMonoChipClass,
  growthStatValueClass,
  growthTerminalFrameClass,
  growthTerminalTitlebarClass,
} from "@/components/growth/growthHomeStyles";

const HANDSHAKE_EASE = [0.16, 1, 0.3, 1] as const;

function LivePulse() {
  return (
    <span className="relative flex h-2 w-2" aria-hidden>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/50 opacity-60 motion-reduce:hidden" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
    </span>
  );
}

type FlowLine = {
  id: string;
  prefix: string;
  text: string;
  tone?: "muted" | "warn" | "ok" | "default";
};

function buildLines(avgUsdPerCall: number | null): FlowLine[] {
  const settled =
    avgUsdPerCall != null && Number.isFinite(avgUsdPerCall)
      ? `$${avgUsdPerCall.toFixed(4)} USDC`
      : "$0.0042 USDC";

  return [
    {
      id: "req",
      prefix: "→",
      text: "GET /spend/news",
      tone: "default",
    },
    {
      id: "402",
      prefix: "←",
      text: "402 Payment Required",
      tone: "warn",
    },
    {
      id: "sign",
      prefix: "→",
      text: "X-PAYMENT signed · Solana USDC",
      tone: "muted",
    },
    {
      id: "ok",
      prefix: "←",
      text: `200 · settled ${settled}`,
      tone: "ok",
    },
  ];
}

export type GrowthX402FlowProps = {
  avgUsdPerCall?: number | null;
  paid7d?: number | null;
  payers7d?: number | null;
  settledUsd?: number | null;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string | null;
  className?: string;
};

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

/**
 * Agentic terminal motif: animated x402 payment handshake + live traction strip.
 * Respects prefers-reduced-motion (static full log, no loop).
 * Scoped to this component only — no page scroll/reveal motion.
 */
export function GrowthX402Flow({
  avgUsdPerCall = null,
  paid7d = null,
  payers7d = null,
  settledUsd = null,
  isLoading = false,
  isError = false,
  errorMessage = null,
  className,
}: GrowthX402FlowProps) {
  const reduceMotion = useReducedMotion();
  const lines = buildLines(avgUsdPerCall);
  const [visibleCount, setVisibleCount] = useState(reduceMotion ? lines.length : 0);
  const [loopKey, setLoopKey] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      setVisibleCount(lines.length);
      return;
    }

    setVisibleCount(0);
    const timers: number[] = [];
    lines.forEach((_, i) => {
      timers.push(
        window.setTimeout(() => {
          setVisibleCount(i + 1);
        }, 420 + i * 520),
      );
    });

    // Soft loop: pause on settled, then replay.
    timers.push(
      window.setTimeout(() => {
        setLoopKey((k) => k + 1);
      }, 420 + lines.length * 520 + 2800),
    );

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
    // Re-run when avg changes or loop restarts.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lines rebuilt from avgUsdPerCall
  }, [avgUsdPerCall, reduceMotion, loopKey]);

  const showCaret = !reduceMotion && visibleCount < lines.length;
  const settledVisible = visibleCount >= lines.length;

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <div className={growthTerminalFrameClass} aria-label="x402 payment handshake demo">
        <div className={growthTerminalTitlebarClass}>
          <div className="flex items-center gap-2.5">
            <span className="flex gap-1.5" aria-hidden>
              <span className="h-2 w-2 rounded-full bg-foreground/20" />
              <span className="h-2 w-2 rounded-full bg-foreground/15" />
              <span className="h-2 w-2 rounded-full bg-foreground/10" />
            </span>
            <span className={cn(growthMonoChipClass, "border-border/35 bg-background/40")}>
              x402 · settled
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">
            {settledVisible ? (
              <>
                <LivePulse />
                live
              </>
            ) : (
              "handshake"
            )}
          </span>
        </div>

        <div className="relative px-4 py-4 font-mono text-[12px] leading-[1.75] sm:px-5 sm:py-5 sm:text-[13px]">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12] motion-reduce:opacity-[0.06]"
            aria-hidden
            style={{
              backgroundImage: `
                linear-gradient(to right, hsl(var(--border) / 0.35) 1px, transparent 1px),
                linear-gradient(to bottom, hsl(var(--border) / 0.35) 1px, transparent 1px)
              `,
              backgroundSize: "24px 24px",
              maskImage: "linear-gradient(to bottom, black 0%, transparent 92%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 92%)",
            }}
          />

          <ol className="relative min-h-[8.5rem] space-y-1.5 sm:min-h-[9rem]" aria-live="polite">
            <AnimatePresence initial={false}>
              {lines.slice(0, visibleCount).map((line) => (
                <motion.li
                  key={`${loopKey}-${line.id}`}
                  className="flex gap-2.5"
                  initial={reduceMotion ? false : { opacity: 0, y: 6, x: 4 }}
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                  transition={{ duration: 0.35, ease: HANDSHAKE_EASE }}
                >
                  <span className="shrink-0 text-muted-foreground/50">{line.prefix}</span>
                  <span
                    className={cn(
                      line.tone === "ok" && "text-emerald-400",
                      line.tone === "warn" && "text-foreground/85",
                      line.tone === "muted" && "text-muted-foreground",
                      line.tone === "default" && "text-foreground/90",
                    )}
                  >
                    {line.text}
                  </span>
                </motion.li>
              ))}
            </AnimatePresence>
            {showCaret ? (
              <li className="flex gap-2.5 text-muted-foreground/60" aria-hidden>
                <span className="shrink-0">▋</span>
                <span className="animate-pulse motion-reduce:animate-none">awaiting...</span>
              </li>
            ) : null}
          </ol>

          <p className="relative mt-5 border-t border-border/30 pt-3 text-[11px] leading-relaxed text-muted-foreground/75">
            Agent pays per call. No API key. Settlement is on-chain USDC.
          </p>
        </div>
      </div>

      <div
        className={cn(
          growthTerminalFrameClass,
          "px-5 py-5 sm:px-6 sm:py-5",
        )}
        aria-live="polite"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            <LivePulse />
            Live traction
          </div>
          <span className={cn(growthMonoChipClass)}>x402</span>
        </div>

        {isLoading && paid7d == null ? (
          <div className="grid grid-cols-3 gap-3 sm:gap-5" aria-hidden>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="min-w-0 space-y-2">
                <div className="h-2.5 w-14 animate-pulse rounded-sm bg-muted/40" />
                <div className="h-6 w-16 animate-pulse rounded-md bg-muted/35 sm:h-7 sm:w-20" />
              </div>
            ))}
          </div>
        ) : isError && paid7d == null ? (
          <p className="text-sm text-destructive">
            {errorMessage ?? "Metrics unavailable"}
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:gap-5">
            <div className="min-w-0">
              <p className={cn(growthKickerClass, "tracking-[0.16em]")}>Calls · 7d</p>
              <p className={cn(growthStatValueClass, "mt-2 text-xl sm:text-2xl")}>
                {paid7d != null ? formatNum(paid7d) : "-"}
              </p>
            </div>
            <div className="min-w-0">
              <p className={cn(growthKickerClass, "tracking-[0.16em]")}>Wallets</p>
              <p className={cn(growthStatValueClass, "mt-2 text-xl sm:text-2xl")}>
                {payers7d != null ? formatNum(payers7d) : "-"}
              </p>
            </div>
            <div className="min-w-0">
              <p className={cn(growthKickerClass, "tracking-[0.16em]")}>Settled</p>
              <p className={cn(growthStatValueClass, "mt-2 text-xl sm:text-2xl")}>
                {settledUsd != null ? formatUsd(settledUsd) : "-"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
